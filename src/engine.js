(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const H = 12;
  const DEFAULTS = {
    historyGapPct: 10, promoCushionPct: 3, overstockWOS: 16, channelRatio: 1.3,
    outpaceRatio: 1.2, outpaceWeeks: 3, leadTimeBasis: 'p80', minDollars: 0,
    flags: { missed_order: true, late_po: true, history_gap: true, promo_repeat: true, pos_outpacing: true,
             overstock: true, channel_fill: true, newitem_gap: true, check_data: true }
  };
  const TIER_ORDER = { 'At risk': 0, 'Medium': 1, 'Watch': 2, 'Too much': 3, 'No risk': 4 };
  const DECISION_OF = { missed_order: 'order_more', late_po: 'order_more', history_gap: 'order_more', promo_repeat: 'order_more',
    pos_outpacing: 'order_more', overstock: 'too_much', channel_fill: 'too_much', newitem_gap: 'forecast_off', check_data: 'check_data' };
  const FLAG_LABEL = { missed_order: 'Missed order', late_po: 'Lead time risk', history_gap: 'Short vs last year', promo_repeat: 'Promo repeat',
    pos_outpacing: 'Sales above forecast', overstock: 'Too much stock', channel_fill: 'Shipping ahead of sales',
    newitem_gap: 'New item forecast', check_data: 'Check the data' };

  const sum = (a, f = 0, t = a.length) => { let s = 0; for (let i = f; i < t; i++) s += a[i] || 0; return s; };
  const mean = a => (a.length ? sum(a) / a.length : 0);
  const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(sum(a.map(x => (x - m) * (x - m))) / (a.length - 1)); };
  const clip = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const MS = 86400000;
  function parseDay(s) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
  function addDays(d, n) { return new Date(d.getTime() + n * MS); }
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(d) { return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
  function fmtNum(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtMoney(n) { const a = Math.abs(n); if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'; if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K'; return '$' + Math.round(n); }
  function weekStart(snap, h) { return addDays(parseDay(snap.meta.today), 1 + 7 * h); }
  function weekNum(h) { const w = 46 + h; return w > 52 ? w - 52 : w; }

  function leadWeeks(sku, snap, basis) {
    const s = snap.suppliers[sku.supplier];
    if (!s || s.quotedWeeks == null) return null;
    const q = s.quotedWeeks;
    if (!s.history || s.history.length < 4) return { q, p80: null, slip: 0, use: q };
    const p80 = (mean(s.history) + 0.84 * sd(s.history)) / 7;
    return { q, p80, slip: Math.max(0, p80 - q), use: basis === 'quoted' ? q : Math.max(q, p80) };
  }

  function lyValue(sku, h) {
    const w = 46 + h; const p = sku.pos;
    if (w <= 52) return { v: p.y2025[w - 1], oos: sku.oos25[w - 1] || 1, ly: true, w };
    return { v: p.y2026[w - 53], oos: 1, ly: false, w: w - 52 };
  }
  function measureLift(sku) {
    // Promo lift measured against neighbouring weeks, then divided by the same ratio two years ago
    // (when the promo did not run) so seasonality is not mistaken for lift.
    const pw = (sku.promo.ly || []).map(x => x.w); if (!pw.length) return 0;
    const a = Math.min(...pw), b = Math.max(...pw);
    const ratio = (y, oos) => {
      const adj = w => y[w - 1] / Math.max((oos && oos[w - 1]) || 1, 0.3), base = [];
      for (let w = a - 3; w < a; w++) if (w >= 1) base.push(adj(w));
      for (let w = b + 1; w <= b + 3; w++) if (w <= 52) base.push(adj(w));
      const bm = mean(base); return bm > 0 ? mean(pw.map(adj)) / bm : 1;
    };
    const r1 = ratio(sku.pos.y2025, sku.oos25), r2 = sku.pos.y2024 && sum(sku.pos.y2024) > 0 ? ratio(sku.pos.y2024, null) : 1;
    return clip(r1 / r2 - 1, 0, 1.5);
  }
  function histDemand(sku) {
    const y25 = sku.pos.y2025, y26 = sku.pos.y2026;
    const ratio = clip(sum(y26, 32, 45) / Math.max(1, sum(y25, 32, 45)), 0.5, 1.8);
    const lift = measureLift(sku); const out = []; const raw = [];
    for (let h = 0; h < H; h++) {
      const r = lyValue(sku, h); let adj = r.v / Math.max(r.oos, 0.3); raw.push(r.v);
      const lyP = r.ly && (sku.promo.ly || []).some(x => x.w === r.w);
      const tyP = (sku.promo.ty || []).some(x => x.h === h && x.confirmed);
      if (lyP && !tyP) adj = adj / (1 + lift);
      if (r.ly) adj *= ratio;
      out.push(adj);
    }
    return { demand: out, ratio, lift, rawLY: raw };
  }

  function project(sku, snap, o) {
    const inv = sku.inv; let cur = inv.onHand; const rows = []; let first = null, minInv = 0;
    const arr = new Array(H + 10).fill(0);
    (inv.transit || []).forEach(t => { arr[Math.min(t.etaH, H + 9)] += t.qty; });
    (inv.pos || []).forEach(p => { arr[Math.min(p.etaH + (o.slip || 0), H + 9)] += p.qty; });
    if (o.extra && o.extra.qty > 0) arr[Math.min(o.extra.h, H + 9)] += o.extra.qty;
    for (let h = 0; h < H; h++) {
      cur += arr[h]; cur -= o.demand[h];
      rows.push({ h, demand: o.demand[h], arrival: arr[h], inv: cur, date: weekStart(snap, h) });
      if (cur < 0 && first === null) first = h; if (cur < minInv) minInv = cur;
    }
    return { rows, first, short: -minInv };
  }

  function analogsFor(sku, snap) {
    if (!sku.isNew || !sku.analogs) return null;
    const curves = sku.analogs.map(a => ({ id: a.id, name: (snap.skus.find(s => s.id === a.id) || {}).name || a.id, why: a.why, curve: (snap.skus.find(s => s.id === a.id) || {}).launchCurve || [] }));
    const totals = curves.map(c => sum(c.curve));
    return { curves, mean: mean(totals), min: Math.min(...totals), max: Math.max(...totals) };
  }

  function activeNotes(events) {
    const creates = events.filter(e => e.t === 'create');
    const dead = new Set(events.filter(e => e.t === 'close').map(e => e.target).concat(creates.filter(e => e.supersedes).map(e => e.supersedes)));
    const out = {};
    creates.slice().sort((a, b) => a.id - b.id).forEach(n => { if (!dead.has(n.id)) out[n.sku + '|' + n.flag] = n; });
    return out;
  }

  function evalSku(sku, snap, S, notes) {
    const flags = []; const price = sku.price; const F = sku.fcstH; const needPlan = sum(F);
    const inv = sku.inv; const transitQty = sum((inv.transit || []).map(t => t.qty)); const poQty = sum((inv.pos || []).map(p => p.qty));
    const supply = inv.onHand + transitQty + poQty; const lt = leadWeeks(sku, snap, S.leadTimeBasis);
    const hd = sku.isNew ? null : histDemand(sku); const needHist = hd ? sum(hd.demand) : 0;
    const meanF = mean(F); const wos = meanF > 0 ? (inv.onHand + transitQty) / meanF : 0;
    const pos26 = sku.pos.y2026, f26 = sku.forecast26;
    const hasPOS = sum(pos26, 38, 45) > 0 || sku.isNew;
    const last4 = sum(pos26, 41, 45), last4f = sum(f26, 41, 45);
    const metrics = { wos, onHand: inv.onHand, transit: transitQty, openPO: poQty, supply, needPlan, needHist, lyRaw: hd ? sum(hd.rawLY) : 0,
      posVsFcst: last4f > 0 ? last4 / last4f - 1 : 0, ytdRatio: hd ? hd.ratio : 0, lift: hd ? hd.lift : 0, lt };
    const add = f => flags.push(f);

    // data checks
    const issues = (sku.dataIssues || []).slice();
    if (inv.onHand < 0) issues.push('Negative on-hand inventory: ' + fmtNum(inv.onHand) + ' units');
    if (!lt) issues.push('Supplier lead time is missing, so stock-out timing cannot be projected');
    if (S.flags.check_data && issues.length) add({ type: 'check_data', tier: 'Watch', dollars: 0, gapUnits: 0, text: issues[0], issues, confidence: 'High' });
    const canProject = lt && inv.onHand >= 0 && hasPOS;

    if (canProject && !sku.isNew) {
      const ltUse = lt.use; const slipW = Math.round(lt.slip);
      const q = project(sku, snap, { demand: F, slip: 0 });
      const p = project(sku, snap, { demand: F, slip: S.leadTimeBasis === 'p80' ? slipW : 0 });
      const hasSupply = (inv.pos || []).length + (inv.transit || []).length > 0;
      const orderBy = h => { const d = addDays(weekStart(snap, h), -Math.round(ltUse * 7)); return d <= parseDay(snap.meta.today) ? null : d; };
      if (!hasSupply && q.first !== null && S.flags.missed_order) {
        const urgent = q.first <= Math.ceil(ltUse);
        const ob = orderBy(q.first);
        add({ type: 'missed_order', tier: urgent ? 'At risk' : 'Medium', dollars: q.short * price, gapUnits: q.short, firstH: q.first, confidence: 'High',
          text: 'No order placed. Stock runs out the week of ' + fmtDate(weekStart(snap, q.first)) + (ob ? '. Order by ' + fmtDate(ob) : '. Order now or expedite') });
      } else if (hasSupply && S.flags.late_po) {
        if (q.first !== null) add({ type: 'late_po', tier: 'At risk', dollars: q.short * price, gapUnits: q.short, firstH: q.first, confidence: 'High',
          text: 'Stock runs out the week of ' + fmtDate(weekStart(snap, q.first)) + ' before the PO arrives. Short ' + fmtNum(q.short) + ' units' });
        else if (p.first !== null) add({ type: 'late_po', tier: 'Medium', dollars: p.short * price, gapUnits: p.short, firstH: p.first, confidence: 'High', slipWeeks: slipW,
          text: 'Supplier usually runs ~' + slipW + ' wk late. If so, stock runs out the week of ' + fmtDate(weekStart(snap, p.first)) });
      }
      // history gap
      if (S.flags.history_gap && needHist > 0 && supply < (1 - S.historyGapPct / 100) * needHist) {
        const gap = needHist - supply;
        add({ type: 'history_gap', tier: 'Medium', dollars: gap * price, gapUnits: gap, confidence: 'High',
          text: 'Orders and stock cover ' + fmtNum(supply) + ' units. The same weeks last year sold ' + fmtNum(metrics.lyRaw) + ' (adjusted need ' + fmtNum(needHist) + ')' });
      }
      // promo repeat
      const tyAll = sku.promo.ty || []; const tyConf = tyAll.filter(x => x.confirmed); const lyP = sku.promo.ly || [];
      if (S.flags.promo_repeat && lyP.length && tyAll.length) {
        const lift = metrics.lift; const wk = meanF; const needPromo = needPlan + wk * lift * tyConf.length;
        const c = S.promoCushionPct / 100;
        if (tyConf.length && supply < (1 - c) * needPromo && supply >= (1 - c) * needPlan) {
          const gap = needPromo - supply;
          add({ type: 'promo_repeat', tier: 'Medium', dollars: gap * price, gapUnits: gap, confidence: 'High',
            text: 'Promo repeats (last year lifted sales ~' + Math.round(lift * 100) + '%). Needs ' + fmtNum(needPromo) + ' units, supply is ' + fmtNum(supply) });
        } else if (!tyConf.length) {
          add({ type: 'promo_repeat', tier: 'Watch', dollars: 0, gapUnits: 0, confidence: 'Medium', possible: true,
            text: 'Possible promo repeat. Last year it lifted sales ~' + Math.round(lift * 100) + '%. Confirm it is on this year\'s calendar' });
        }
      }
      // sales above forecast
      const n = S.outpaceWeeks; let out = true;
      for (let i = 0; i < n; i++) if (!(pos26[44 - i] > S.outpaceRatio * f26[44 - i])) out = false;
      if (S.flags.pos_outpacing && out) {
        const ratio = sum(pos26, 45 - n, 45) / Math.max(1, sum(f26, 45 - n, 45)); const adj = needPlan * Math.max(1, ratio);
        const pct = Math.round((ratio - 1) * 100);
        if (adj > supply) add({ type: 'pos_outpacing', tier: 'Medium', dollars: (adj - supply) * price, gapUnits: adj - supply, confidence: 'High',
          text: 'Sales ran ' + pct + '% above forecast for ' + n + ' weeks and supply will not cover that pace (short ' + fmtNum(adj - supply) + ')' });
        else add({ type: 'pos_outpacing', decision: 'forecast_off', tier: 'Watch', dollars: (adj - needPlan) * price, gapUnits: adj - needPlan, confidence: 'High',
          text: 'Sales ran ' + pct + '% above forecast for ' + n + ' weeks. Supply covers it, but the forecast looks low' });
      } else {
        for (let i = 0; i < 8; i++) if (f26[44 - i] > 0 && pos26[44 - i] > 2.5 * f26[44 - i]) { metrics.spike = true; break; }
      }
      // too much
      if (!sku.lumpy && S.flags.overstock && wos > S.overstockWOS) {
        const trend = sum(pos26, 41, 45) / Math.max(1, sum(pos26, 37, 41));
        if (trend < 0.9) { const ex = Math.max(0, inv.onHand + transitQty - 12 * meanF);
          add({ type: 'overstock', tier: 'Too much', dollars: ex * price * 0.25, gapUnits: ex, confidence: 'High',
            text: fmtNum(wos) + ' weeks of supply and sales are slowing (' + Math.round((trend - 1) * 100) + '%)' }); }
      }
      const sh = sum(sku.ship.y2026, 37, 45), pp = sum(pos26, 37, 45);
      if (!sku.lumpy && S.flags.channel_fill && pp > 0 && sh > S.channelRatio * pp)
        add({ type: 'channel_fill', tier: 'Watch', dollars: (sh - pp) * price * 0.25, gapUnits: sh - pp, confidence: 'High',
          text: 'Shipping ' + Math.round((sh / pp - 1) * 100) + '% ahead of sell-through over 8 weeks. Retailers may be building stock' });
    }
    if (sku.isNew && S.flags.newitem_gap) {
      const an = analogsFor(sku, snap);
      if (an && an.mean > 0) {
        const r = needPlan / an.mean;
        if (r < 0.75) add({ type: 'newitem_gap', tier: 'Medium', dollars: (an.mean - needPlan) * price, gapUnits: an.mean - needPlan, confidence: 'Medium',
          text: 'Forecast is ' + Math.round((1 - r) * 100) + '% below similar past launches (' + fmtNum(needPlan) + ' vs ' + fmtNum(an.mean) + ' units in 12 weeks)' });
        else if (r > 1.33) add({ type: 'newitem_gap', tier: 'Watch', dollars: (needPlan - an.mean) * price * 0.25, gapUnits: needPlan - an.mean, confidence: 'Medium',
          text: 'Forecast is ' + Math.round((r - 1) * 100) + '% above similar past launches (' + fmtNum(needPlan) + ' vs ' + fmtNum(an.mean) + ' units)' });
      }
    }
    flags.forEach(f => { f.decision = f.decision || DECISION_OF[f.type]; f.label = FLAG_LABEL[f.type]; });
    if (sku.lumpy) flags.forEach(f => { f.confidence = 'Low'; });
    // notes
    let reAlert = false; const accepted = [];
    flags.forEach(f => {
      const n = notes[sku.id + '|' + f.type];
      if (n && f.tier !== 'No risk') {
        const trig = n.realertGap != null ? n.realertGap : (n.acceptedGap || 0) * 1.5;
        if ((f.gapUnits || 0) > trig && n.acceptedGap != null) { f.reAlert = true; f.note = n; reAlert = true; }
        else { f.accepted = true; f.note = n; accepted.push(f); }
      }
    });
    const live = flags.filter(f => !f.accepted);
    live.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || b.dollars - a.dollars);
    const top = live[0] || null;
    const allSorted = flags.slice().sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || b.dollars - a.dollars);
    return { id: sku.id, name: sku.name, sub: sku.sub, price, isNew: !!sku.isNew, lumpy: !!sku.lumpy,
      tier: top ? top.tier : 'No risk', decision: top ? top.decision : null, headline: top ? top.text : null, headlineType: top ? top.type : null,
      dollars: top ? top.dollars : 0, flags: allSorted, acceptedFlags: accepted, isAccepted: !top && accepted.length > 0, reAlert,
      confidence: top ? top.confidence : 'High', metrics };
  }

  function compute(snap, settings, noteEvents) {
    const S = Object.assign({}, DEFAULTS, settings || {}); S.flags = Object.assign({}, DEFAULTS.flags, (settings || {}).flags || {});
    const notes = activeNotes(noteEvents || []);
    const rows = snap.skus.map(s => evalSku(s, snap, S, notes));
    const tiers = { 'At risk': 0, 'Medium': 0, 'Watch': 0, 'Too much': 0, 'No risk': 0 };
    const dec = { order_more: { n: 0, d: 0 }, too_much: { n: 0, d: 0 }, forecast_off: { n: 0, d: 0 }, check_data: { n: 0, d: 0 } };
    let accepted = 0;
    rows.forEach(r => { tiers[r.tier]++; if (r.decision) { dec[r.decision].n++; dec[r.decision].d += r.dollars; } if (r.isAccepted) accepted++; });
    return { rows, tiers, dec, accepted, settings: S, total: rows.length };
  }

  function diff(prev, cur, tol = 0.05) {
    const pm = {}; prev.rows.forEach(r => { pm[r.id] = r; }); const out = { toAtRisk: [], recovered: [], newFlags: [], reAlerted: [], worsened: [] };
    cur.rows.forEach(r => {
      const p = pm[r.id]; if (!p) return;
      if (r.tier === 'At risk' && p.tier !== 'At risk') out.toAtRisk.push(r.id);
      if (p.tier !== 'No risk' && r.tier === 'No risk' && !r.isAccepted) out.recovered.push(r.id);
      const pt = new Set(p.flags.map(f => f.type)); const ct = r.flags.filter(f => !f.accepted);
      if (ct.some(f => !pt.has(f.type)) && r.tier !== 'At risk') out.newFlags.push(r.id);
      if (r.reAlert && !p.reAlert) out.reAlerted.push(r.id);
      if (p.tier === r.tier && p.dollars > 0 && (r.dollars - p.dollars) / p.dollars > tol) out.worsened.push(r.id);
    });
    return out;
  }

  function accuracy(snap) {
    const bySub = {}; snap.skus.forEach(s => { if (s.isNew) return; (bySub[s.sub] = bySub[s.sub] || []).push(s); });
    const out = {};
    Object.keys(bySub).forEach(k => {
      const A = new Array(13).fill(0), F = new Array(13).fill(0);
      bySub[k].forEach(s => { for (let i = 0; i < 13; i++) { A[i] += s.pos.y2026[32 + i]; F[i] += s.forecast26[32 + i]; } });
      const sa = sum(A), sf = sum(F); const wmape = sum(A.map((a, i) => Math.abs(a - F[i]))) / sa; const bias = (sf - sa) / sa;
      const e = A.slice(5).map((a, i) => a - F[5 + i]); const t = mean(e) / ((sd(e) / Math.sqrt(8)) || 1e-9);
      out[k] = { wmape, bias, t, possible: Math.abs(t) > 3 && Math.abs(bias) > 0.03, direction: bias < 0 ? 'under' : 'over', n: bySub[k].length };
    });
    return out;
  }

  function options(sku, snap, res) {
    const f = res.flags.find(x => !x.accepted) || res.flags[0]; if (!f) return [];
    const inv = sku.inv; const o = []; const lt = res.metrics.lt;
    const ltTxt = lt ? 'about ' + (lt.use).toFixed(1) + ' weeks' : 'unknown lead time';
    if (f.type === 'missed_order' || f.type === 'late_po') {
      o.push({ t: 'Place or expedite an order for ' + fmtNum(Math.ceil(f.gapUnits / 10) * 10) + ' units', note: 'Supplier lead time is ' + ltTxt + '. Freight cost needs a quote.' });
      if (inv.otherDC > 0) o.push({ t: 'Move up to ' + fmtNum(Math.min(inv.otherDC, f.gapUnits)) + ' units from another DC', note: fmtNum(inv.otherDC) + ' units sit in other locations' });
      if ((sku.promo.ty || []).some(x => x.confirmed)) o.push({ t: 'Move or trim the planned promo', note: 'Promo weeks raise demand during the gap' });
      o.push({ t: 'Offer customers a split shipment', note: 'Ship what is available, the rest when the PO lands' });
    } else if (f.type === 'history_gap') {
      o.push({ t: 'Review the forecast against last year', note: 'Last year\'s sales: ' + fmtNum(res.metrics.lyRaw) + ' units in these weeks' });
      o.push({ t: 'Add an order of about ' + fmtNum(Math.ceil(f.gapUnits / 10) * 10) + ' units', note: 'Closes the gap to the history-based need' });
      o.push({ t: 'Accept the gap and add a note', note: 'Use this when budget or priorities rule it out. The flag returns only if the gap grows' });
    } else if (f.type === 'promo_repeat') {
      o.push({ t: 'Confirm the promo dates and depth with Sales', note: 'Lift estimate comes from last year' });
      o.push({ t: 'Add about ' + fmtNum(Math.ceil(f.gapUnits / 10) * 10) + ' units to cover the lift', note: 'Or shift promo timing if supply cannot land in time' });
    } else if (f.type === 'pos_outpacing') {
      o.push({ t: 'Raise the forecast for the next weeks', note: 'Sales have run above forecast several weeks in a row' });
      if (f.decision !== 'forecast_off') o.push({ t: 'Add about ' + fmtNum(Math.ceil(f.gapUnits / 10) * 10) + ' units', note: 'Covers the faster pace' });
    } else if (f.type === 'overstock') {
      if ((inv.pos || []).length) o.push({ t: 'Push out or reduce the open PO of ' + fmtNum(sum(inv.pos.map(p => p.qty))) + ' units', note: 'Check supplier terms before changing' });
      o.push({ t: 'Look at other channels or a markdown', note: 'Margin impact needs input' });
    } else if (f.type === 'channel_fill') {
      o.push({ t: 'Check retailer inventory before the next shipments', note: 'Shipping is outrunning sell-through' });
      o.push({ t: 'Hold or slow upcoming shipments', note: 'Until sell-through catches up' });
    } else if (f.type === 'newitem_gap') {
      o.push({ t: 'Review the analogs and the forecast together', note: 'Swap an analog if one does not fit' });
      o.push({ t: 'Adjust the forecast toward the analog range', note: 'Range: ' + fmtNum((analogsFor(sku, snap) || {}).min || 0) + ' to ' + fmtNum((analogsFor(sku, snap) || {}).max || 0) + ' units' });
    } else if (f.type === 'check_data') {
      o.push({ t: 'Ask the data owner to fix or confirm the field', note: 'Flags that depend on it are paused until then' });
    }
    return o;
  }

  return { H, DEFAULTS, TIER_ORDER, DECISION_OF, FLAG_LABEL, compute, project, histDemand, diff, accuracy, analogsFor, activeNotes, leadWeeks, options,
    weekStart, weekNum, fmtDate, fmtNum, fmtMoney, parseDay, addDays, sum, mean, sd };
});
