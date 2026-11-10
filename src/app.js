(function(){
'use strict';
const D=window.__DATA__, E=window.Engine;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=E.fmtNum, money=E.fmtMoney, KEY='dpa.v1';
const TIERS=['At risk','Medium','Watch','Too much','No risk'];
const TCLS={'At risk':'t-risk','Medium':'t-med','Watch':'t-watch','Too much':'t-much','No risk':'t-ok'};
const TICON={'At risk':'▲','Medium':'◆','Watch':'◉','Too much':'■','No risk':'✔'};
const DEC={order_more:['Order more or expedite','Stock will run short'],too_much:['Too much','Cash tied up in stock'],forecast_off:['Forecast looks off','Sales moving away from plan'],check_data:['Check the data','Something looks wrong in a source']};
const SRC={planning:'Planning system',bi:'Reporting tool',sharepoint:'Shared file',calc:'Calculated'};
const REASONS=['Budget','Focus is on another line','Supplier constraint','Planned promo change','Other'];
const DEFSET={...E.DEFAULTS,flags:{...E.DEFAULTS.flags},minDollars:0,tierNames:{},cols:{sub:true,conf:true,dollars:true},profile:'Planner'};
const RULES={
 missed_order:['Missed order','Nothing is on order or in transit and projected stock goes below zero. Critical when that happens inside the supplier lead time plus how late they usually run.'],
 late_po:['Lead time risk','An order exists but stock runs out first. Critical if it runs out even on the quoted arrival date. Medium if it only runs out when the supplier is as late as their history says.'],
 history_gap:['Short vs last year','Orders plus stock are well below what the same weeks needed last year, after removing last year\'s stock-outs and one-time promos and adjusting for this year\'s pace.'],
 promo_repeat:['Promo repeat','The same promo is planned again. Supply covers the base forecast but not the base plus last year\'s measured lift.'],
 pos_outpacing:['Sales above forecast','Sell-through beat the forecast by a set margin for several weeks in a row.'],
 overstock:['Too much stock','Many weeks of supply on hand and sell-through is slowing.'],
 channel_fill:['Shipping ahead of sales','Shipments to retailers are well above what shoppers bought over 8 weeks, so retailers may be building stock.'],
 newitem_gap:['New item forecast','The forecast for a new item is far from what similar past launches sold in their first 12 weeks.'],
 check_data:['Check the data','A source value looks wrong or is missing, so flags that depend on it are paused until it is fixed.']};

/* ---------- state ---------- */
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({settings:st.settings,notes:st.notes}))}catch(e){}}
const saved=load();
const st={snap:'today',settings:merge(DEFSET,saved&&saved.settings),notes:(saved&&saved.notes)||JSON.parse(JSON.stringify(D.seedNotes)),
 tier:'attn',dec:null,sub:'',q:'',tab:'attn',open:null,wi:{slip:0,lift:0,qty:0,h:2},res:null,prev:null};
function merge(a,b){const o=JSON.parse(JSON.stringify(a));if(!b)return o;for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==='object')o[k]=merge(o[k],b[k]);else o[k]=b[k]}return o}
const snap=()=>D[st.snap];
const tn=t=>st.settings.tierNames[t]||t;
function recompute(){
  const s=engineSettings();st.res=E.compute(snap(),s,st.notes);
  st.prev=st.snap==='today'?E.compute(D.yesterday,s,st.notes):null;
  st.diff=st.prev?E.diff(st.prev,st.res):null;
}
function engineSettings(){const s=st.settings;return {historyGapPct:s.historyGapPct,promoCushionPct:s.promoCushionPct,overstockWOS:s.overstockWOS,channelRatio:s.channelRatio,outpaceRatio:s.outpaceRatio,outpaceWeeks:s.outpaceWeeks,leadTimeBasis:s.leadTimeBasis,flags:s.flags}}
const skuOf=id=>snap().skus.find(s=>s.id===id);
const rowOf=id=>st.res.rows.find(r=>r.id===id);
const tierB=t=>`<span class="tier ${TCLS[t]}"><span aria-hidden="true">${TICON[t]}</span>${esc(tn(t))}</span>`;
const src=k=>`<span class="src s-${k}">${SRC[k]}</span>`;

/* ---------- page ---------- */
function renderApp(){
  const r=st.res,rows=r.rows,attn=rows.filter(x=>x.headline).length;
  const q=D.loadReport.filter(x=>x.status==='quarantined').length, nf=D.loadReport.filter(x=>x.status==='new_field').length;
  const health=`<div class="card health" data-g="health"><b>Data health</b>
   <span class="ok-t">● ${D.sources.length} sources combined</span>
   <span>Refreshed ${esc(snap().meta.asOf)}, 6:05 AM</span>
   ${st.snap==='today'?`<span class="warn-t">▲ ${q} file held back (units look wrong)</span><span>◉ ${nf} new field kept, not used yet</span><span class="ok-t">✔ 1 renamed column auto-mapped</span>`:`<span class="mute">Yesterday's files</span>`}
   <a href="#" id="l-load" style="color:var(--brand)">See what happened in today's load</a></div>`;
  const dsum=Object.entries(r.dec).map(([k,v])=>`<button class="dtile" aria-pressed="${st.dec===k}" data-dec="${k}">
     <div class="t">${DEC[k][0]}</div><div class="n">${v.n}</div><div class="d">${DEC[k][1]}</div>
     <div class="h">${v.d>0?money(v.d)+' at stake':'&nbsp;'}</div></button>`).join('');
  $('#app').innerHTML=`${health}${sinceHtml()}
   <div class="decisions" data-g="decisions">${dsum}</div>
   <div class="tabs" role="tablist">
    <button class="tab" role="tab" aria-selected="${st.tab==='attn'}" data-tab="attn" data-g="tab-attn">Needs attention</button>
    <button class="tab" role="tab" aria-selected="${st.tab==='acc'}" data-tab="acc" data-g="tab-accepted">Accepted risks (${r.accepted})</button>
    <button class="tab" role="tab" aria-selected="${st.tab==='acc2'}" data-tab="acc2" data-g="tab-accuracy">Forecast accuracy</button></div>
   <div id="tabbody"></div>
   <p class="foot">Sample data, not Mattel data. Every brand, supplier and number here is invented. Built from fields a planning team already has: POS, shipments, on-hand, in-transit, open POs, forecast, promo calendar, supplier lead times and 3 years of history.</p>`;
  bindApp();renderTab();
}
function sinceHtml(){
  if(!st.diff)return '';const d=st.diff,nm=id=>esc(rowOf(id).name),lk=id=>`<a data-open="${id}">${nm(id)}</a>`;
  const li=[];
  d.toAtRisk.forEach(i=>li.push(`<li>▲ <b>Newly at risk:</b> ${lk(i)}</li>`));
  d.reAlerted.forEach(i=>li.push(`<li><span class="re">RE-ALERT</span> ${lk(i)} gap grew past what was accepted</li>`));
  d.newFlags.forEach(i=>li.push(`<li>◆ <b>New flag:</b> ${lk(i)}</li>`));
  d.worsened.forEach(i=>li.push(`<li>↗ <b>Got worse:</b> ${lk(i)}</li>`));
  d.recovered.forEach(i=>li.push(`<li>✔ <b>Fixed:</b> ${lk(i)} (an order was placed)</li>`));
  return `<div class="card since" data-g="since"><h2>Since yesterday</h2>${li.length?`<ul>${li.join('')}</ul>`:'<div class="mute">Nothing changed.</div>'}</div>`;
}
function bindApp(){
  $$('[data-dec]').forEach(b=>b.onclick=()=>{st.dec=st.dec===b.dataset.dec?null:b.dataset.dec;if(st.tab!=='attn')st.tab='attn';renderApp()});
  $$('[data-tier]').forEach(b=>b.onclick=()=>{st.tier=b.dataset.tier;renderApp()});
  $$('[data-tab]').forEach(b=>b.onclick=()=>{st.tab=b.dataset.tab;renderApp()});
  $$('[data-open]').forEach(a=>a.onclick=e=>{e.preventDefault();openSku(a.dataset.open)});
  $('#l-load').onclick=e=>{e.preventDefault();openLoad(false)};
}
function filtered(){
  const s=st.settings,q=st.q.toLowerCase();
  return st.res.rows.filter(r=>{
    if(st.tier==='attn'){if(!r.headline)return false}else if(st.tier!=='all'&&r.tier!==st.tier)return false;
    if(st.dec&&r.decision!==st.dec)return false;
    if(st.sub&&r.sub!==st.sub)return false;
    if(q&&!(r.id+' '+r.name).toLowerCase().includes(q))return false;
    if(s.minDollars&&r.headline&&r.dollars<s.minDollars)return false;
    return true}).sort((a,b)=>E.TIER_ORDER[a.tier]-E.TIER_ORDER[b.tier]||b.dollars-a.dollars);
}
function renderTab(){
  const tb=$('#tabbody');
  if(st.tab==='acc')return tb.innerHTML=accHtml(),bindRows(tb);
  if(st.tab==='acc2')return tb.innerHTML=accuracyHtml();
  const subs=['',...D.subs];
  tb.innerHTML=`<div class="bar" data-g="filters">${chipsHtml()}</div>
   <div class="bar"><input type="search" id="q" placeholder="Search SKU or name" value="${esc(st.q)}" aria-label="Search">
   <select id="sub" aria-label="Subcategory">${subs.map(s=>`<option value="${esc(s)}" ${st.sub===s?'selected':''}>${s||'All subcategories'}</option>`).join('')}</select>
   <span class="mute" id="cnt"></span>${st.dec?`<button class="btn sm" id="cleardec">Clear "${DEC[st.dec][0]}"</button>`:''}</div>
   <div class="card" data-g="list"><div id="listbody"></div></div>`;
  $$('[data-tier]',tb).forEach(b=>b.onclick=()=>{st.tier=b.dataset.tier;renderApp()});
  $('#q').oninput=e=>{st.q=e.target.value;renderList()};$('#sub').onchange=e=>{st.sub=e.target.value;renderList()};
  const cd=$('#cleardec');if(cd)cd.onclick=()=>{st.dec=null;renderApp()};
  renderList();
}
function chipsHtml(){const r=st.res,attn=r.rows.filter(x=>x.headline).length;
  return [['attn',`Needs attention (${attn})`],...TIERS.map(t=>[t,`${tn(t)} (${r.tiers[t]})`]),['all',`All (${r.total})`]].map(([k,l])=>`<button class="chip" aria-pressed="${st.tier===k}" data-tier="${k}">${esc(l)}</button>`).join('')}
function renderList(){
  const rows=filtered(),c=st.settings.cols;$('#cnt').textContent=rows.length+' SKUs';
  $('#listbody').innerHTML=rows.length?`<table class="list"><thead><tr><th>Status</th><th>SKU</th><th>What is going on</th>${c.dollars?'<th class="num">$ at risk</th>':''}${c.conf?'<th>Confidence</th>':''}</tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table>`
   :'<div class="empty">Nothing here with these filters.</div>';
  bindRows($('#listbody'));
}
function rowHtml(r){const c=st.settings.cols;
  const hl=r.headline||(r.isAccepted?'Accepted risk (see note)':'No flags. Supply covers the forecast and last year\'s pattern.');
  return `<tr class="r" tabindex="0" data-open="${r.id}"><td>${tierB(r.tier)}${r.reAlert?'<div style="margin-top:4px"><span class="re" style="margin:0">RE-ALERT</span></div>':''}</td>
   <td><div class="sku-name">${esc(r.name)}</div><div class="sku-id">${r.id}${c.sub?' · '+esc(r.sub):''}${r.isNew?' · new item':''}${r.lumpy?' · lumpy demand':''}</div></td>
   <td>${r.headline?`<span class="tag">${esc(E.FLAG_LABEL[r.headlineType])}</span>`:''}${esc(hl)}${r.metrics.spike&&!r.headline?'<div class="conf">One-time spike noticed in the last 8 weeks, treated as a one-off.</div>':''}</td>
   ${c.dollars?`<td class="num">${r.dollars>0?money(r.dollars):'—'}</td>`:''}${c.conf?`<td class="conf">${r.headline?r.confidence:''}</td>`:''}</tr>`}
function bindRows(root){$$('[data-open]',root).forEach(e=>{e.onclick=()=>openSku(e.dataset.open);e.onkeydown=ev=>{if(ev.key==='Enter')openSku(e.dataset.open)}})}
function accHtml(){
  const rows=st.res.rows.filter(r=>r.acceptedFlags.length);
  if(!rows.length)return '<div class="card empty">No accepted risks. Add a note on a flag to park it here.</div>';
  return `<div class="card" data-g="acc-list"><table class="list"><thead><tr><th>SKU</th><th>Accepted because</th><th class="num">Gap accepted</th><th class="num">Gap now</th><th>Re-alert at</th></tr></thead><tbody>${rows.flatMap(r=>r.acceptedFlags.map(f=>{const n=f.note;
   return `<tr class="r" tabindex="0" data-open="${r.id}"><td><div class="sku-name">${esc(r.name)}</div><div class="sku-id">${r.id} · ${esc(E.FLAG_LABEL[f.type])}</div></td>
   <td><span class="tag">${esc(n.reason)}</span>${esc(n.text)}<div class="conf">${esc(n.who)}, ${esc(n.date)}. Kept until you remove it.</div></td>
   <td class="num">${fmt(n.acceptedGap)} units</td><td class="num">${fmt(f.gapUnits)} units</td><td class="num">${n.realertGap!=null?(n.realertGap>1e8?'Never':fmt(n.realertGap)+' units'):fmt(n.acceptedGap*1.5)+' units'}</td></tr>`})).join('')}</tbody></table></div>
   <p class="foot">Notes never expire on their own. The only thing that brings a flag back is the data: if the gap grows past 1.5x what you accepted (adjustable per note), or you remove the note.</p>`}
function accuracyHtml(){
  const a=E.accuracy(snap());
  return `<div class="card sec" data-g="accuracy"><h3>Forecast accuracy by subcategory (last 13 weeks)</h3>
  <p class="mute">Checked at group level, not SKU by SKU, so one noisy item cannot trigger a false alarm.</p>
  <table class="list"><thead><tr><th>Subcategory</th><th class="num">SKUs</th><th class="num">Miss (WMAPE)</th><th class="num">Bias</th><th>Signal</th></tr></thead><tbody>
  ${Object.entries(a).map(([k,v])=>`<tr><td><b>${esc(k)}</b></td><td class="num">${v.n}</td><td class="num">${(v.wmape*100).toFixed(1)}%</td><td class="num">${v.bias>0?'+':''}${(v.bias*100).toFixed(1)}%</td>
  <td>${v.possible?`<span class="tier t-med">◆ Possible bias: forecast runs ${v.direction === 'under' ? 'low' : 'high'}</span><div class="conf">Seen over 8 weeks across ${v.n} SKUs. Worth a look at the forecast method.</div>`:'<span class="ok-t">✔ No consistent bias</span>'}</td></tr>`).join('')}</tbody></table></div>`}

/* ---------- charts ---------- */
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x))),f=x/p;return (f<1.5?1:f<3?2:f<7?5:10)*p}
function svgChart(o){
  const W=o.W||640,Hh=o.H||270,m={l:56,r:14,t:16,b:38},iw=W-m.l-m.r,ih=Hh-m.t-m.b;
  const X=x=>m.l+(x-o.xmin)/(o.xmax-o.xmin)*iw,Y=y=>m.t+ih-(y-o.ymin)/(o.ymax-o.ymin)*ih;
  let s=`<svg class="ch" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(o.label||'chart')}">`;
  (o.shades||[]).forEach(b=>{s+=`<rect x="${X(b.x1)}" y="${m.t}" width="${X(b.x2)-X(b.x1)}" height="${ih}" fill="${b.color}" opacity="${b.op||.18}"/>`});
  const st_=niceStep((o.ymax-o.ymin)/4);
  for(let v=Math.ceil(o.ymin/st_)*st_;v<=o.ymax+1e-9;v+=st_){s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="currentColor" opacity=".13"/><text x="${m.l-8}" y="${Y(v)+4}" text-anchor="end" font-size="12" fill="currentColor" opacity=".7">${fmt(v)}</text>`}
  (o.xticks||[]).forEach(t=>{s+=`<text x="${X(t[0])}" y="${Hh-14}" text-anchor="middle" font-size="12" fill="currentColor" opacity=".7">${esc(t[1])}</text>`});
  (o.hlines||[]).forEach(l=>{s+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(l.y)}" y2="${Y(l.y)}" stroke="${l.color}" stroke-width="1.6" ${l.dash?`stroke-dasharray="${l.dash}"`:''}/>${l.label?`<text x="${W-m.r-4}" y="${Y(l.y)-5}" text-anchor="end" font-size="12" fill="${l.color}">${esc(l.label)}</text>`:''}`});
  (o.vlines||[]).forEach(l=>{s+=`<line x1="${X(l.x)}" x2="${X(l.x)}" y1="${m.t}" y2="${m.t+ih}" stroke="${l.color||'currentColor'}" stroke-dasharray="${l.dash||'4 4'}" stroke-width="1.5"/><text x="${X(l.x)+4}" y="${m.t+12}" font-size="12" fill="${l.color||'currentColor'}">${esc(l.label||'')}</text>`});
  (o.series||[]).forEach(se=>{let d='',pen=false;se.pts.forEach(p=>{if(p[1]==null||isNaN(p[1])){pen=false;return}d+=(pen?'L':'M')+X(p[0]).toFixed(1)+' '+Y(Math.min(Math.max(p[1],o.ymin),o.ymax)).toFixed(1);pen=true});
    s+=`<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.w||2.4}" ${se.dash?`stroke-dasharray="${se.dash}"`:''} stroke-linejoin="round" stroke-linecap="round"/>`});
  (o.marks||[]).forEach(k=>{const x=X(k.x),y=Y(k.y);
    if(k.shape==='x')s+=`<path d="M${x-6} ${y-6}L${x+6} ${y+6}M${x+6} ${y-6}L${x-6} ${y+6}" stroke="${k.color}" stroke-width="3"/>`;
    else if(k.shape==='tri')s+=`<path d="M${x} ${y-8}L${x+7} ${y+5}L${x-7} ${y+5}Z" fill="${k.color}"/>`;
    else s+=`<circle cx="${x}" cy="${y}" r="5" fill="${k.color}"/>`;
    if(k.label)s+=`<text x="${Math.min(Math.max(x,m.l+30),W-60)}" y="${y-12}" text-anchor="middle" font-size="12" font-weight="700" fill="${k.color}">${esc(k.label)}</text>`});
  if(o.note)s+=o.note.map((t,i)=>`<text x="${m.l+8}" y="${m.t+16+i*16}" font-size="13" font-weight="700" fill="${o.noteColor||'currentColor'}">${esc(t)}</text>`).join('');
  return s+'</svg>';
}
const C={ty:'#2b4cc7',fc:'#0b7285',ly:'#b45309',y2:'#8a94a3',late:'#d9480f',wi:'#7b2cbf',bad:'#c62828',ss:'#6b7280'};
function wkDate(w){return E.fmtDate(E.addDays(E.parseDay(snap().meta.weekOneStart),7*(w-1)))}
function demandChart(sku,res){
  const p=sku.pos,lift=1+st.wi.lift/100,ly=w=>w<=52?p.y2025[w-1]:p.y2026[w-53],y2=w=>w<=52?p.y2024[w-1]:p.y2025[w-53];
  const W=[];for(let w=30;w<=57;w++)W.push(w);
  const F=sku.fcstH.map(v=>v*lift);
  const ser=[{pts:W.map(w=>[w,y2(w)]),color:C.y2,w:1.8},{pts:W.map(w=>[w,ly(w)]),color:C.ly,w:2.4},
   {pts:W.filter(w=>w<=45).map(w=>[w,p.y2026[w-1]]),color:C.ty,w:3},
   {pts:W.filter(w=>w<=45).map(w=>[w,sku.forecast26[w-1]]),color:C.fc,w:1.5,dash:'3 3'},
   {pts:[[45,sku.forecast26[44]],...F.map((v,h)=>[46+h,v])],color:C.fc,w:3,dash:'7 4'}];
  const ymax=niceStep(Math.max(...ser.flatMap(s=>s.pts.map(q=>q[1]||0)))*1.12/4)*4||10;
  const shades=[];(sku.promo.ly||[]).forEach(x=>{if(x.w>=30)shades.push({x1:x.w-.5,x2:x.w+.5,color:'#b45309',op:.16})});
  (sku.promo.ty||[]).forEach(x=>shades.push({x1:46+x.h-.5,x2:46+x.h+.5,color:'#2b4cc7',op:x.confirmed?.2:.07}));
  const rr=res;const f=rr.flags.find(x=>x.type==='history_gap'&&!x.accepted)||rr.flags.find(x=>x.type==='history_gap');
  const note=f?[`Supply ${fmt(rr.metrics.supply)} units`,`Same weeks last year sold ${fmt(rr.metrics.lyRaw)}`]:null;
  return svgChart({xmin:29.5,xmax:57.5,ymin:0,ymax,series:ser,shades,vlines:[{x:45.5,label:'Today'}],
   xticks:[30,34,38,42,46,50,54].map(w=>[w,wkDate(w)]),label:'Weekly sales, forecast and prior years',note,noteColor:C.bad})+
  `<div class="legend"><span><i style="border-color:${C.ty}"></i>This year (POS)</span><span><i style="border-color:${C.fc};border-top-style:dashed"></i>Forecast</span><span><i style="border-color:${C.ly}"></i>Last year</span><span><i style="border-color:${C.y2}"></i>2 years ago</span>
   ${(sku.promo.ly||[]).length||(sku.promo.ty||[]).length?`<span><i style="border-color:#b45309;opacity:.5"></i>Promo weeks (last year / planned)</span>`:''}</div>`;
}
function invCharts(sku,res){
  const lt=res.metrics.lt,F=sku.fcstH;
  if(!lt)return {html:'<div class="mute">Stock projection not shown: the supplier lead time is missing in the source. Flags that depend on it are paused.</div>',v:''};
  if(sku.inv.onHand<0)return {html:'<div class="mute">Stock projection not shown: on-hand is negative in the source. Fix the data first.</div>',v:''};
  const w=st.wi,Fw=F.map(v=>v*(1+w.lift/100)),active=w.slip||w.lift||w.qty;
  const base=E.project(sku,snap(),{demand:F,slip:0}),slipW=Math.round(lt.slip||0);
  const late=slipW>0?E.project(sku,snap(),{demand:F,slip:slipW}):null;
  const wi=active?E.project(sku,snap(),{demand:Fw,slip:w.slip,extra:w.qty>0?{qty:w.qty,h:w.h}:null}):null;
  const all=[...base.rows,...(late?late.rows:[]),...(wi?wi.rows:[])].map(r=>r.inv);
  const mx=Math.max(...all,1),mn=Math.min(...all,0),ss=2*E.mean(F);
  const step=niceStep((mx-mn)*1.1/4),ymax=Math.ceil(mx*1.1/step)*step,ymin=Math.floor(mn*1.1/step)*step;
  const ser=[{pts:base.rows.map(r=>[r.h,r.inv]),color:C.ty,w:3}];
  if(late)ser.push({pts:late.rows.map(r=>[r.h,r.inv]),color:C.late,w:2.4,dash:'6 4'});
  if(wi)ser.push({pts:wi.rows.map(r=>[r.h,r.inv]),color:C.wi,w:3});
  const marks=[];(sku.inv.pos||[]).forEach(p=>{const r=base.rows[Math.min(p.etaH,11)];marks.push({x:p.etaH,y:r.inv,shape:'tri',color:C.fc,label:'PO '+fmt(p.qty)})});
  (sku.inv.transit||[]).forEach(p=>{const r=base.rows[Math.min(p.etaH,11)];marks.push({x:p.etaH,y:r.inv,shape:'tri',color:C.fc,label:'In transit '+fmt(p.qty)})});
  if(base.first!==null)marks.push({x:base.first,y:base.rows[base.first].inv,shape:'x',color:C.bad,label:'Out of stock'});
  const vl=[];if(base.first!==null){const ob=base.first-(lt.use||0);if(ob>=0)vl.push({x:ob,label:'Order by '+E.fmtDate(E.addDays(E.weekStart(snap(),0),Math.round(ob*7))),color:C.bad,dash:'5 4'})}
  const html=svgChart({xmin:-.5,xmax:11.5,ymin:ymin,ymax:ymax,series:ser,marks,vlines:vl,hlines:[{y:0,color:C.bad},{y:ss,color:C.ss,dash:'4 4',label:'Safety stock (2 wks)'}],
   xticks:[0,2,4,6,8,10].map(h=>[h,E.fmtDate(E.weekStart(snap(),h))]),label:'Projected inventory by week',H:250})+
   `<div class="legend"><span><i style="border-color:${C.ty}"></i>If supplier is on time</span>${late?`<span><i style="border-color:${C.late};border-top-style:dashed"></i>If supplier runs ${slipW} wk${slipW>1?'s':''} late (their history)</span>`:''}${wi?`<span><i style="border-color:${C.wi}"></i>Your what-if</span>`:''}</div>`;
  let v='';const res2=wi||base,ps=res.price;
  if(res2.first!==null)v=`<div class="verdict v-bad">${active?'With your changes: ':''}stock runs out the week of ${E.fmtDate(E.weekStart(snap(),res2.first))}. Short ${fmt(res2.short)} units (${money(res2.short*ps)} of sales).</div>`;
  else v=`<div class="verdict v-ok">${active?'With your changes: ':''}no stock-out in the next 12 weeks.</div>`;
  if(base.first!==null&&!active){const ob=E.addDays(E.weekStart(snap(),base.first),-Math.round(lt.use*7)),td=E.parseDay(snap().meta.today);
    v+=`<div class="mute" style="margin-top:6px">Supplier lead time is ${lt.q} weeks quoted${lt.p80?`, about ${lt.p80.toFixed(1)} in practice`:''}. ${ob>td?'Order by '+E.fmtDate(ob)+' to avoid it.':'The order date has already passed, so this needs an expedite or another source.'}</div>`}
  return {html,v,wiMax:Math.max(2000,Math.ceil((base.short||F.reduce((a,b)=>a+b,0)/4)*2/100)*100)};
}
/* ---------- drill-down ---------- */
function evidence(sku,res,f){
  const m=res.metrics,lt=m.lt,ev=[];const sup=(k,a,b)=>ev.push([k,a,b]);
  const dstr=a=>a.map(p=>fmt(p.qty)+' on '+E.fmtDate(E.weekStart(snap(),p.etaH))).join(', ')||'None';
  if(['missed_order','late_po'].includes(f.type)){
    sup('On hand',fmt(m.onHand),'planning');sup('In transit',dstr(sku.inv.transit),'planning');sup('Open POs',dstr(sku.inv.pos),'planning');
    sup('Forecast, next 12 weeks',fmt(m.needPlan),'planning');if(lt){sup('Supplier lead time (quoted)',lt.q+' weeks','sharepoint');if(lt.p80)sup('Supplier lead time (typical)',lt.p80.toFixed(1)+' weeks','calc')}
    if(f.firstH!=null)sup('First week short',E.fmtDate(E.weekStart(snap(),f.firstH)),'calc')}
  else if(f.type==='history_gap'){sup('Supply (on hand + in transit + open POs)',fmt(m.supply),'planning');sup('Forecast, next 12 weeks',fmt(m.needPlan),'planning');
    sup('Sold in these weeks last year',fmt(m.lyRaw),'bi');sup('Need after adjustments*',fmt(m.needHist),'calc');sup('Gap',fmt(f.gapUnits)+' units','calc')}
  else if(f.type==='promo_repeat'){const t=(sku.promo.ty||[])[0],l=(sku.promo.ly||[])[0];sup('Promo',(t&&t.name)||'','sharepoint');sup('Last year lift',Math.round(m.lift*100)+'%','calc');sup('Supply',fmt(m.supply),'planning');sup('Forecast without promo',fmt(m.needPlan),'planning');if(f.gapUnits)sup('Short vs promo need',fmt(f.gapUnits)+' units','calc')}
  else if(f.type==='pos_outpacing'){const l3=E.sum(sku.pos.y2026,42,45),f3=E.sum(sku.forecast26,42,45);sup('Sales, last 3 weeks',fmt(l3),'bi');sup('Forecast, same weeks',fmt(f3),'planning');sup('Ahead of forecast',Math.round((l3/f3-1)*100)+'%','calc');sup('Supply',fmt(m.supply),'planning');sup('Forecast, next 12 weeks',fmt(m.needPlan),'planning')}
  else if(f.type==='overstock'){sup('Weeks of supply',m.wos.toFixed(0),'calc');sup('On hand + in transit',fmt(m.onHand+m.transit),'planning');sup('Avg weekly forecast',fmt(E.mean(sku.fcstH)),'planning');sup('Sales trend (last 4 vs prior 4 weeks)',Math.round((E.sum(sku.pos.y2026,41,45)/E.sum(sku.pos.y2026,37,41)-1)*100)+'%','bi')}
  else if(f.type==='channel_fill'){const sh=E.sum(sku.ship.y2026,37,45),pp=E.sum(sku.pos.y2026,37,45);sup('Shipped to retailers, 8 weeks',fmt(sh),'bi');sup('Sold to shoppers, 8 weeks',fmt(pp),'bi');sup('Difference',fmt(sh-pp),'calc')}
  else if(f.type==='newitem_gap'){const a=E.analogsFor(sku,snap());sup('Forecast, first 12 weeks',fmt(m.needPlan),'planning');sup('Similar past launches (average)',fmt(a.mean),'calc');sup('Range of those launches',fmt(a.min)+' to '+fmt(a.max),'calc')}
  else if(f.type==='check_data'){(f.issues||[]).forEach(x=>sup('Issue',x,'planning'))}
  return ev;
}
function openSku(id){
  st.open=id;st.wi={slip:0,lift:0,qty:0,h:2};drawerHtml();$('#drawer').classList.add('on');$('#scrim').classList.add('on');$('#drawer').scrollTop=0;
  const cl=$('#d-close');if(cl)cl.focus();
}
function drawerHtml(){
  const sku=skuOf(st.open),res=rowOf(st.open),top=res.flags.find(f=>!f.accepted)||res.flags[0];
  const flag=top;
  let why='';
  if(flag){const ru=RULES[flag.type];why=`<div class="card sec" data-g="why"><h3>Why this was flagged</h3><div class="hl">${esc(flag.text)}</div>
   <div class="mute" style="margin-bottom:10px">Rule: <b>${esc(ru[0])}</b>. ${esc(ru[1])}</div>
   <div class="ev">${evidence(sku,res,flag).map(e=>`<div>${esc(e[0])}</div><div>${esc(e[1])}${src(e[2])}</div>`).join('')}</div>
   ${flag.type==='history_gap'?`<p class="conf">*Adjusted for: last year's stock-out weeks (counted as demand that went unmet), one-time promos last year that are not repeating, and this year's sales pace vs last year.</p>`:''}
   ${res.lumpy?'<p class="conf">Lumpy demand (a few big orders, many zero weeks): confidence is Low and averages can mislead.</p>':''}</div>`}
  else why=`<div class="card sec"><h3>No flags</h3><p>Supply covers the forecast and last year's pattern.</p></div>`;
  const opts=flag?E.options(sku,snap(),res):[];
  const inv=sku.isNew?null:invCharts(sku,res);
  const others=res.flags.filter(f=>f!==flag);
  $('#drawer').innerHTML=`<div class="dr-h"><div style="flex:1">${tierB(res.tier)}${res.reAlert?'<span class="re">RE-ALERT</span>':''}<div class="hl" style="margin:6px 0 0">${esc(res.name)}</div>
   <div class="mute">${res.id} · ${esc(res.sub)} · ${esc(sku.supplier)} · $${sku.price.toFixed(2)} each</div></div><button class="btn" id="d-close">Close</button></div>
   <div class="dr-b">${why}
   ${sku.isNew?analogHtml(sku,res):`<div class="card sec" data-g="drill-chart"><h3>Sales: this year, forecast, and prior years</h3>${demandChart(sku,res)}</div>`}
   ${inv?`<div class="card sec" data-g="whatif"><h3>Stock projection and what-if</h3><div id="wi-chart">${inv.html}</div><div id="wi-v">${inv.v}</div>
     ${(sku.isNew||!res.metrics.lt||sku.inv.onHand<0)?'':`<div style="margin-top:12px">
     <div class="slider"><label for="s-slip">Supplier ETA slips by</label><input id="s-slip" type="range" min="0" max="8" value="${st.wi.slip}"><output id="o-slip"></output></div>
     <div class="slider"><label for="s-lift">Demand vs forecast</label><input id="s-lift" type="range" min="-30" max="60" step="5" value="${st.wi.lift}"><output id="o-lift"></output></div>
     <div class="slider"><label for="s-qty">Add an order of</label><input id="s-qty" type="range" min="0" max="${inv.wiMax}" step="50" value="${st.wi.qty}"><output id="o-qty"></output></div>
     <div class="slider"><label for="s-h">Arriving in week</label><input id="s-h" type="range" min="1" max="8" value="${st.wi.h}"><output id="o-h"></output></div>
     <button class="btn sm" id="wi-reset">Reset what-if</button></div>`}</div>`:''}
   ${opts.length?`<div class="card sec" data-g="options"><h3>Options from the data</h3>${opts.map(o=>`<div class="opt"><b>${esc(o.t)}</b><span>${esc(o.note)}</span></div>`).join('')}
     <div class="conf">These come from numbers in the sources. Cost, margin and customer terms are not in the data, so they are marked for a human.</div></div>`:''}
   ${others.length?`<div class="card sec"><h3>Other flags on this SKU</h3>${others.map(f=>`<div style="margin-bottom:6px">${tierB(f.tier)} ${esc(f.text)}${f.accepted?' <span class="tag">accepted</span>':''}</div>`).join('')}</div>`:''}
   ${notesHtml(sku,res)}</div>`;
  bindDrawer(sku,res,inv);updateOut();
}
function updateOut(){const w=st.wi,set=(i,t)=>{const e=$('#'+i);if(e)e.textContent=t};
  set('o-slip',w.slip+' wk');set('o-lift',(w.lift>0?'+':'')+w.lift+'%');set('o-qty',fmt(w.qty));set('o-h','wk +'+w.h)}
function bindDrawer(sku,res,inv){
  $('#d-close').onclick=closeAll;
  if(!$('#s-slip'))return bindNotes(sku,res);
  [['slip','s-slip'],['lift','s-lift'],['qty','s-qty'],['h','s-h']].forEach(([k,id])=>$('#'+id).oninput=e=>{st.wi[k]=+e.target.value;updateOut();const r=invCharts(sku,res);$('#wi-chart').innerHTML=r.html;$('#wi-v').innerHTML=r.v;
    const dc=$('[data-g=drill-chart]');if(k==='lift'&&dc)dc.innerHTML='<h3>Sales: this year, forecast, and prior years</h3>'+demandChart(sku,res)});
  $('#wi-reset').onclick=()=>{st.wi={slip:0,lift:0,qty:0,h:2};drawerHtml()};
  bindNotes(sku,res);
}
function analogHtml(sku,res){
  const a=E.analogsFor(sku,snap()),ser=a.curves.map(c=>({pts:c.curve.map((v,i)=>[i+1,v]),color:C.y2,w:1.8})).concat([{pts:sku.fcstH.map((v,i)=>[i+1,v]),color:C.fc,w:3.2,dash:'7 4'}]);
  const ymax=niceStep(Math.max(...ser.flatMap(s=>s.pts.map(p=>p[1])))*1.15/4)*4;
  return `<div class="card sec" data-g="drill-chart"><h3>New item: forecast vs similar past launches</h3>${svgChart({xmin:.5,xmax:12.5,ymin:0,ymax,series:ser,xticks:[1,3,5,7,9,11].map(w=>[w,'Wk '+w]),label:'Analog launch curves'})}
   <div class="legend"><span><i style="border-color:${C.y2}"></i>Past launches (analogs)</span><span><i style="border-color:${C.fc};border-top-style:dashed"></i>Current forecast</span></div>
   <table class="list" style="margin-top:10px"><thead><tr><th>Analog</th><th>Why it was picked</th><th class="num">First 12 weeks</th></tr></thead><tbody>${a.curves.map(c=>`<tr><td>${esc(c.name)}<div class="sku-id">${c.id}</div></td><td>${esc(c.why)}</td><td class="num">${fmt(E.sum(c.curve))}</td></tr>`).join('')}</tbody></table>
   <p class="conf">Needs 3 or more analogs, including the weaker sellers, so the average is not cherry-picked. A planner can swap any analog.</p></div>`;
}
/* ---------- notes ---------- */
function allEvents(sku){return st.notes.filter(e=>e.sku===sku||e.t==='close'&&st.notes.find(c=>c.id===e.target&&c.sku===sku))}
function notesHtml(sku,res){
  const act=Object.values(E.activeNotes(st.notes)).filter(n=>n.sku===sku.id),ev=allEvents(sku.id);
  const flagsAvail=res.flags.map(f=>f.type);
  const cur=res.flags.find(f=>!f.accepted)||res.flags[0];
  return `<div class="card sec" data-g="notes"><h3>Notes <span class="conf">Kept until you remove them. They never expire on their own.</span></h3>
   ${act.map(n=>{const f=res.flags.find(x=>x.type===n.flag);return `<div class="note-box"><b>${esc(E.FLAG_LABEL[n.flag])}</b> <span class="tag">${esc(n.reason)}</span><div>${esc(n.text)}</div>
    <div class="conf">${esc(n.who)}, ${esc(n.date)}. Accepted gap ${fmt(n.acceptedGap||0)} units${f?`, gap now ${fmt(f.gapUnits)}`:''}. Re-alert ${n.realertGap!=null&&n.realertGap>1e8?'is off':'if gap passes '+fmt(n.realertGap!=null?n.realertGap:(n.acceptedGap||0)*1.5)+' units'}.</div>
    <div class="row"><button class="btn sm" data-rm="${n.id}">Remove note</button><span id="rm-${n.id}"></span></div></div>`}).join('')}
   ${flagsAvail.length?`<details ${act.length?'':'open'}><summary style="cursor:pointer;font-weight:650">Add a note</summary>
    <div class="row"><label class="f">Flag<select id="n-flag">${flagsAvail.map(t=>`<option value="${t}" ${cur&&cur.type===t?'selected':''}>${esc(E.FLAG_LABEL[t])}</option>`).join('')}</select></label>
    <label class="f">Reason<select id="n-reason">${REASONS.map(r=>`<option>${r}</option>`).join('')}</select></label>
    <label class="f">Accepted gap (units)<input id="n-gap" type="number" min="0" value="${Math.round((cur&&cur.gapUnits)||0)}"></label></div>
    <label class="f">What should the next person know?<textarea id="n-text" rows="3" placeholder="Example: Sold more last year in the holiday weeks, but this year's budget does not allow that quantity and focus is on another line."></textarea></label>
    <div class="row"><label><input type="checkbox" id="n-re" checked> Alert me again if the gap grows past <input id="n-mult" type="number" step="0.1" min="1" value="1.5" style="width:70px">x what I accepted</label></div>
    <button class="btn pri" id="n-save">Save note</button></details>`:'<div class="mute">Nothing flagged on this SKU, so there is nothing to note.</div>'}
   ${ev.length?`<ul class="hist">${ev.map(e=>e.t==='create'?`<li>${esc(e.date)}: ${esc(e.who)} added a note on ${esc(E.FLAG_LABEL[e.flag])} (${esc(e.reason)})</li>`:`<li>${esc(e.date)}: note removed${e.tag?' (tag: '+esc(e.tag)+')':''}</li>`).join('')}</ul>`:''}</div>`;
}
function bindNotes(sku,res){
  const sv=$('#n-save');
  if(sv)sv.onclick=()=>{const txt=$('#n-text').value.trim();if(!txt){$('#n-text').focus();return}
    const flag=$('#n-flag').value,gap=+$('#n-gap').value||0,re=$('#n-re').checked,mult=+$('#n-mult').value||1.5,prev=E.activeNotes(st.notes)[sku.id+'|'+flag];
    const id=Math.max(0,...st.notes.map(e=>e.id))+1;
    st.notes.push({t:'create',id,sku:sku.id,flag,reason:$('#n-reason').value,text:txt,acceptedGap:gap,realertGap:re?(mult===1.5?null:gap*mult):1e12,who:'You',date:'Nov 8',supersedes:prev?prev.id:undefined});
    save();recompute();renderApp();drawerHtml()};
  $$('[data-rm]').forEach(b=>b.onclick=()=>{const id=b.dataset.rm,box=$('#rm-'+id);
    box.innerHTML=`<select id="rt-${id}"><option>Budget no longer a constraint</option><option>Decision made</option><option>Added by mistake</option><option>Other</option></select> <button class="btn sm pri" id="rc-${id}">Confirm remove</button>`;
    $('#rc-'+id).onclick=()=>{const nid=Math.max(0,...st.notes.map(e=>e.id))+1;st.notes.push({t:'close',id:nid,target:+id,tag:$('#rt-'+id).value,date:'Nov 8'});save();recompute();renderApp();drawerHtml()}});
}
/* ---------- settings ---------- */
function openSettings(){
  const s=st.settings,row=(k,l,d,min,max,step)=>`<div class="set-row"><div>${l}<small>${d}</small></div><input type="number" data-s="${k}" value="${s[k]}" min="${min}" max="${max}" step="${step||1}"></div>`;
  $('#settings').innerHTML=`<div class="dr-h"><div style="flex:1"><div class="hl" style="margin:0">Settings</div><div class="mute">Saved for you on this device. Every metric below can be set per person.</div></div><button class="btn" id="st-close">Close</button></div>
  <div class="dr-b"><div class="card sec" data-g="set-profile"><h3>Profile</h3><div class="row">${['Planner','Manager'].map(p=>`<button class="chip" aria-pressed="${s.profile===p}" data-prof="${p}">${p}</button>`).join('')}</div>
   <div class="conf">Planner sees everything. Manager hides small items and data chatter, so the list is only the big decisions.</div></div>
  <div class="card sec"><h3>Flags to run</h3>${Object.keys(E.FLAG_LABEL).map(k=>`<label class="sw"><input type="checkbox" data-flag="${k}" ${s.flags[k]?'checked':''}><span><b>${esc(E.FLAG_LABEL[k])}</b><br><span class="conf">${esc(RULES[k][1])}</span></span></label>`).join('')}</div>
  <div class="card sec"><h3>Thresholds</h3>
   ${row('historyGapPct','Short vs last year, flag when supply is below need by (%)','Lower catches smaller gaps',1,50)}
   ${row('promoCushionPct','Promo repeat cushion (%)','How much shortfall is ignored',0,20)}
   ${row('overstockWOS','Too much stock, weeks of supply above','',4,80)}
   ${row('channelRatio','Shipping ahead of sales, ratio above','1.3 means 30% ahead',1,3,.05)}
   ${row('outpaceRatio','Sales above forecast, ratio above','1.2 means 20% above',1,3,.05)}
   ${row('outpaceWeeks','Sales above forecast, weeks in a row','',2,8)}
   ${row('minDollars','Hide items under ($ at risk)','Manager view uses 25,000',0,1000000,1000)}
   <div class="set-row"><div>Lead time to trust<small>Typical uses the supplier's real history. Quoted uses the quote only.</small></div><select data-s="leadTimeBasis"><option value="p80" ${s.leadTimeBasis==='p80'?'selected':''}>Typical</option><option value="quoted" ${s.leadTimeBasis==='quoted'?'selected':''}>Quoted</option></select></div></div>
  <div class="card sec"><h3>Columns</h3>${[['sub','Subcategory'],['conf','Confidence'],['dollars','$ at risk']].map(([k,l])=>`<label class="sw"><input type="checkbox" data-col="${k}" ${s.cols[k]?'checked':''}> ${l}</label>`).join('')}</div>
  <div class="card sec"><h3>Status names</h3>${TIERS.map(t=>`<div class="set-row"><div>${t}</div><input type="text" data-tn="${t}" value="${esc(s.tierNames[t]||'')}" placeholder="${t}"></div>`).join('')}</div>
  <div class="row"><button class="btn" id="st-export">Copy my settings</button><button class="btn" id="st-def">Back to defaults</button></div></div>`;
  $('#settings').classList.add('on');$('#scrim').classList.add('on');
  const ch=()=>{save();recompute();renderApp()};
  $('#st-close').onclick=closeAll;
  $$('[data-s]',$('#settings')).forEach(i=>i.onchange=()=>{st.settings[i.dataset.s]=i.type==='number'?+i.value:i.value;st.settings.profile='Custom';ch();openSettings()});
  $$('[data-flag]').forEach(i=>i.onchange=()=>{st.settings.flags[i.dataset.flag]=i.checked;st.settings.profile='Custom';ch()});
  $$('[data-col]').forEach(i=>i.onchange=()=>{st.settings.cols[i.dataset.col]=i.checked;ch()});
  $$('[data-tn]').forEach(i=>i.onchange=()=>{st.settings.tierNames[i.dataset.tn]=i.value.trim();ch()});
  $$('[data-prof]').forEach(b=>b.onclick=()=>{const p=b.dataset.prof;st.settings=merge(DEFSET,{});st.settings.profile=p;
    if(p==='Manager'){st.settings.minDollars=25000;st.settings.flags.check_data=false;st.settings.flags.channel_fill=false;st.settings.flags.promo_repeat=false}ch();openSettings()});
  $('#st-def').onclick=()=>{st.settings=merge(DEFSET,{});ch();openSettings()};
  $('#st-export').onclick=()=>{try{navigator.clipboard.writeText(JSON.stringify(st.settings,null,1))}catch(e){}};
}
/* ---------- modals ---------- */
function closeAll(){$$('.drawer').forEach(d=>d.classList.remove('on'));$('#scrim').classList.remove('on');closeModal();st.open=null}
function closeModal(){const m=$('#modal');m.classList.remove('on');m.innerHTML='';if(window.__loadTimer){clearTimeout(window.__loadTimer);window.__loadTimer=null}}
function openModal(title,body){const m=$('#modal');m.innerHTML=`<div class="m-h"><div class="hl" style="margin:0;flex:1">${title}</div><button class="btn" id="m-close">Close</button></div><div class="m-b">${body}</div>`;m.classList.add('on');$('#scrim').classList.add('on');$('#m-close').onclick=closeAll;$('#m-close').focus()}
function openLoad(replay){
  if(replay){st.snap='yesterday';recompute();renderApp()}
  const rep=D.loadReport,ic={ok:'<span class="ok-t">✔</span>',new_field:'<span style="color:var(--watch)">◉</span>',quarantined:'<span class="bad-t">▲</span>'};
  openModal(replay?'Loading today\'s files':'What happened in today\'s load',`<p class="mute">Each file is checked before it is used. Fixable changes are handled. Anything risky is held back and shown to you.</p><ul class="log" id="lg"></ul><div class="row" id="lg-done"></div>`);
  let i=0;const lg=$('#lg');
  (function step(){if(i>=rep.length){const dn=$('#lg-done');if(dn){dn.innerHTML='<button class="btn pri" id="lg-go">Show what changed since yesterday</button>';$('#lg-go').onclick=()=>{st.snap='today';recompute();renderApp();closeAll()}}return}
   const r=rep[i++],src_=D.sources.find(s=>s.id===r.src);lg.insertAdjacentHTML('beforeend',`<li>${ic[r.status]}<div><b>${esc(r.file)}</b> <span class="conf">from ${esc(src_?src_.name:'')}</span><div>${esc(r.msg)}</div></div></li>`);
   window.__loadTimer=setTimeout(step,replay?(matchMedia('(prefers-reduced-motion: reduce)').matches?0:750):0)})();
}
const SRCPANEL={
 planning:{h:'API pull from the planning system',steps:['Scheduled job calls the planning system each morning','Pulls forecast, open POs and inventory','Checks every field against the expected shape','Passes clean rows to the combiner'],real:'Needs read access from IT. If direct API is not allowed, the same data can arrive as a scheduled export instead.',sample:[['SKU','On hand','Open PO','ETA'],['FD-1012','1,950','1,740','Dec 1'],['BB-1009','5,610','0','—']]},
 bi:{h:'Scheduled export from the reporting tool',steps:['The reporting tool sends or saves its daily export','The tool watches the inbox or shared folder','Downloads the file and reads the columns','Renamed columns are matched; odd values are held back'],real:'Whether the tool can email or save a data file (not just a picture of a dashboard) depends on how it is set up. If it cannot, a scheduled export to a shared folder is the usual route.',sample:[['SKU','Week','POS units','Shipped'],['FD-1012','45','63','60'],['SM-1033','45','1,980','3,020']]},
 sharepoint:{h:'Shared file that someone maintains',steps:['A person updates the file (lead times, promo calendar)','The tool reads it on a schedule','Changes since yesterday are noted','Missing values pause only the flags that need them'],real:'Good for data that lives in a spreadsheet and has no feed. The owner of the file just keeps it current.',sample:[['Supplier','Quoted weeks','Promo','Weeks'],['Lotus Doll Factory','10','Holiday feature','49-50'],['Bluegate','9','—','—']]},
 manual:{h:'Manual drop: any file a planner wants checked',steps:['Drag a file in','The tool reads the headers and guesses what each column is','Anything unsure is shown for a one-click confirm','The file joins the combined data, new columns kept']
  ,real:'This is how a new dataset gets added the first time. After one confirm, the tool remembers the mapping.',sample:[['Column in file','Looks like','Sure?'],['sell_thru_units','POS units','Yes'],['xfer_qty','Unclear','Ask'] ]}};
function openFlow(){
  const S=D.sources,col={api:'#2b4cc7',email:'#1f7a34',file:'#b45309',manual:'#6d4fb3'},lab={api:'API pull',email:'Scheduled export',file:'Shared file',manual:'Manual drop'};
  const nodes=S.map((s,i)=>({s,x:12,y:14+i*98,w:236,h:78}));
  const outs=[['Website','site'],['Workbook','xl'],['Daily email','em']].map((o,i)=>({n:o[0],id:o[1],x:760,y:40+i*110,w:228,h:78}));
  let sv=`<svg class="flow-svg" viewBox="0 0 1000 420" role="group" aria-label="Animated data flow">`;
  nodes.forEach((n,i)=>{const d=`M${n.x+n.w} ${n.y+n.h/2} C 330 ${n.y+n.h/2}, 340 210, 392 210`;sv+=`<path id="p${i}" d="${d}" fill="none" stroke="${col[n.s.type]}" stroke-width="2.5" opacity=".35"/>`;
    for(let k=0;k<3;k++)sv+=`<circle r="6" fill="${col[n.s.type]}" opacity="0"><animateMotion dur="3.6s" begin="${(k*1.2+i*.35).toFixed(2)}s" repeatCount="indefinite"><mpath href="#p${i}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.06;.94;1" dur="3.6s" begin="${(k*1.2+i*.35).toFixed(2)}s" repeatCount="indefinite"/></circle>`});
  outs.forEach((o,i)=>{const d=`M608 210 C 680 210, 690 ${o.y+o.h/2}, ${o.x} ${o.y+o.h/2}`;sv+=`<path id="q${i}" d="${d}" fill="none" stroke="#0b7285" stroke-width="2.5" opacity=".35"/>`;
    for(let k=0;k<2;k++)sv+=`<circle r="6" fill="#0b7285" opacity="0"><animateMotion dur="3s" begin="${(k*1.5+i*.4).toFixed(2)}s" repeatCount="indefinite"><mpath href="#q${i}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.06;.94;1" dur="3s" begin="${(k*1.5+i*.4).toFixed(2)}s" repeatCount="indefinite"/></circle>`});
  nodes.forEach((n,i)=>{sv+=`<g class="flow-node" tabindex="0" role="button" data-src="${n.s.id}" aria-label="${esc(n.s.name)}"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="var(--card)" stroke="${col[n.s.type]}" stroke-width="2"/>
    <text x="${n.x+14}" y="${n.y+28}" font-size="16" font-weight="700" fill="currentColor">${esc(n.s.name)}</text><text x="${n.x+14}" y="${n.y+50}" font-size="13" fill="${col[n.s.type]}" font-weight="700">${lab[n.s.type]}</text><text x="${n.x+14}" y="${n.y+67}" font-size="12" fill="currentColor" opacity=".7">${esc(n.s.cadence)}</text></g>`});
  sv+=`<g class="flow-node" tabindex="0" role="button" data-src="hub" aria-label="Check and combine"><rect x="392" y="130" width="216" height="160" rx="16" fill="var(--card)" stroke="#0b7285" stroke-width="3"/><text x="500" y="170" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor">Check, match, combine</text>
   <text x="500" y="198" text-anchor="middle" font-size="13" fill="currentColor" opacity=".8">Match renamed columns</text><text x="500" y="218" text-anchor="middle" font-size="13" fill="currentColor" opacity=".8">Hold back odd values</text><text x="500" y="238" text-anchor="middle" font-size="13" fill="currentColor" opacity=".8">Keep new fields</text><text x="500" y="258" text-anchor="middle" font-size="13" fill="currentColor" opacity=".8">Flag, rank, explain</text></g>`;
  outs.forEach(o=>{sv+=`<g class="flow-node" tabindex="0" role="button" data-src="${o.id}" aria-label="${o.n}"><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="12" fill="var(--card)" stroke="#0b7285" stroke-width="2"/><text x="${o.x+14}" y="${o.y+45}" font-size="17" font-weight="700" fill="currentColor">${o.n}</text></g>`});
  sv+='</svg>';
  openModal('How the data gets in',`<div class="row"><span class="mute">Click any box. This is an illustration of how it could work; which routes are allowed is up to company IT.</span><button class="btn sm" id="f-pause">Pause animation</button></div>${sv}<div id="f-panel" class="panelbox" data-g="flow-panel"><b>Click a box above</b> to see how that route works, what fields it carries and what happens when they change.</div>`);
  const svg=$('.flow-svg'),rm=matchMedia('(prefers-reduced-motion: reduce)').matches;let paused=false;
  if(rm){svg.pauseAnimations();paused=true;$('#f-pause').textContent='Play animation'}
  $('#f-pause').onclick=()=>{paused=!paused;paused?svg.pauseAnimations():svg.unpauseAnimations();$('#f-pause').textContent=paused?'Play animation':'Pause animation'};
  $$('.flow-node').forEach(g=>{const go=()=>flowPanel(g.dataset.src);g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
}
function flowPanel(id){
  const p=$('#f-panel');let h='';
  if(SRCPANEL[id]){const P=SRCPANEL[id],s=D.sources.find(x=>x.id===id),lr=D.loadReport.filter(r=>r.src===id);
    h=`<h3 style="margin-top:0">${esc(P.h)}</h3><ol>${P.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
     <div class="two"><div><b>Fields it carries</b><ul>${s.fields.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><div class="conf">${esc(s.how)}</div></div>
     <div><b>Example rows (invented)</b><table class="list"><tbody>${P.sample.map((r,i)=>`<tr>${r.map(c=>i?`<td>${esc(c)}</td>`:`<th style="position:static">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></div>
     <p><b>In practice:</b> ${esc(P.real)}</p>
     ${lr.length?`<b>Today's load from this route</b><ul class="log" style="opacity:1">${lr.map(r=>`<li style="opacity:1;transform:none;animation:none">${r.status==='ok'?'✔':r.status==='quarantined'?'▲':'◉'} <div><b>${esc(r.file)}</b><div>${esc(r.msg)}</div></div></li>`).join('')}</ul>`:''}`}
  else if(id==='hub')h=`<h3 style="margin-top:0">Check, match, combine</h3><ul><li><b>Match:</b> a renamed column is recognised by name and by the numbers in it. Safe matches happen on their own. Quantity or date fields wait for one click.</li>
   <li><b>Hold back:</b> a file whose values jump 10x or change units is set aside; yesterday's values stay and you are told.</li><li><b>Keep:</b> a brand-new field is stored and tagged "not used yet", so the dataset grows without breaking anything.</li>
   <li><b>Pause only what is affected:</b> a missing lead time pauses lead-time flags for that supplier and says why.</li><li><b>Safe daily run:</b> results are written to a temp file and swapped in only if complete, so a failed run never leaves a half-updated file.</li></ul>`;
  else if(id==='site')h=`<h3 style="margin-top:0">Website</h3><p>The view you are looking at: decisions first, one line why, click for charts. Updates when the daily file refreshes.</p>`;
  else if(id==='xl')h=`<h3 style="margin-top:0">Workbook</h3><p>Everything combined in one sheet with each column tagged by source, plus notes, settings and a data-health tab. This is the version that can live on a shared drive and be filtered or pivoted.</p><button class="btn" id="f-dl">Download combined data (CSV)</button>`;
  else if(id==='em')h=`<h3 style="margin-top:0">Daily email</h3><p>Top findings, what changed since yesterday, and data issues. Short enough to read in a minute.</p><button class="btn" id="f-em">Preview today's email</button>`;
  p.innerHTML=h;const d=$('#f-dl');if(d)d.onclick=downloadCsv;const e=$('#f-em');if(e)e.onclick=openEmail;
}
function openEmail(){
  const live=st.res.rows.filter(r=>r.headline).sort((a,b)=>E.TIER_ORDER[a.tier]-E.TIER_ORDER[b.tier]||b.dollars-a.dollars),top=live.slice(0,5),t=st.res.tiers;
  let b=`Subject: Demand planning, ${t['At risk']} at risk, ${t['Medium']} medium (${snap().meta.asOf})\n\nGood morning. Top items to look at today:\n\n`;
  top.forEach((r,i)=>{b+=`${i+1}. [${tn(r.tier)}] ${r.name} (${r.id})\n   ${r.headline}\n   ${r.dollars>0?money(r.dollars)+' at risk':''}\n\n`});
  if(st.diff){b+='Since yesterday:\n';st.diff.toAtRisk.forEach(i=>b+=`  - Newly at risk: ${rowOf(i).name}\n`);st.diff.reAlerted.forEach(i=>b+=`  - Re-alert (gap grew): ${rowOf(i).name}\n`);st.diff.recovered.forEach(i=>b+=`  - Fixed: ${rowOf(i).name}\n`);b+='\n'}
  b+=`Data health: ${D.loadReport.filter(r=>r.status==='quarantined').length} file held back, 1 new field kept. Open the tool for charts and options.\n\nSample data, not Mattel data.`;
  openModal('Daily email preview',`<p class="mute">Sent each morning after the files refresh. Accepted risks stay out of it unless they re-alert.</p><div class="email">${esc(b)}</div>`);
}
/* ---------- csv ---------- */
function downloadCsv(){
  const cols=['SKU','Name','Subcategory','Supplier','Status','Decision','What is going on','$ at risk','Confidence','On hand [Planning system]','In transit [Planning system]','Open PO qty [Planning system]','Supply [Calculated]','Forecast next 12 wks [Planning system]','Need from history [Calculated]','Same weeks last year [Reporting tool]','Weeks of supply [Calculated]','Lead time quoted wks [Shared file]','Lead time typical wks [Calculated]','Note'];
  const q=v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const lines=[cols.join(',')];
  st.res.rows.forEach(r=>{const m=r.metrics,lt=m.lt,n=r.acceptedFlags[0]&&r.acceptedFlags[0].note;
    lines.push([r.id,r.name,r.sub,skuOf(r.id).supplier,r.tier,r.decision?DEC[r.decision][0]:'',r.headline||'',Math.round(r.dollars),r.headline?r.confidence:'',m.onHand,m.transit,m.openPO,m.supply,Math.round(m.needPlan),Math.round(m.needHist),Math.round(m.lyRaw),m.wos.toFixed(1),lt?lt.q:'',lt&&lt.p80?lt.p80.toFixed(1):'',n?n.reason+': '+n.text:''].map(q).join(','))});
  const blob=new Blob([lines.join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='combined-data-sample.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
/* ---------- guided tour ---------- */
const HG1=D.ids.HG1,STEPS=[
 {t:'[data-g=badge]',h:'This is sample data',b:'Every brand, supplier and number is invented. What matters is what can be built from data a planning team already has.',pre:()=>closeAll()},
 {t:'[data-g=health]',h:'Data from several places, checked first',b:'Files from the planning system, the reporting tool and shared sheets are combined. A renamed column is matched, a new field is kept, and a file with odd values is held back.',pre:()=>closeAll()},
 {t:'[data-g=since]',h:'What changed overnight',b:'Newly at risk, fixed, and worse than yesterday. This is the part a planner would otherwise rebuild by hand every morning.',pre:()=>closeAll()},
 {t:'[data-g=decisions]',h:'Four decisions, not 120 rows',b:'Order more, too much, forecast looks off, check the data. Click one to filter. Dollars show what is at stake.',pre:()=>closeAll()},
 {t:'[data-g=list]',h:'Ranked, with one line why',b:'Every SKU has a status. Click a row to see the data behind it.',pre:()=>{closeAll();window.scrollTo(0,0)}},
 {t:'[data-g=drill-chart]',h:'Order 700, last year sold 1,000',b:'Supply covers the forecast, so a normal check passes. But the same weeks last year needed more. This is the gap that is easy to miss by hand.',pre:()=>openSku(HG1),side:true},
 {t:'[data-g=whatif]',h:'Try a what-if',b:'Slide the supplier delay, demand or an added order and see when stock runs out. Options come from the data only.',pre:()=>openSku(D.ids.LP2),side:true},
 {t:'[data-g=notes]',h:'Notes that never get lost',b:'Park a flag with a reason, like "budget does not allow it". It stays until you remove it, and only comes back if the gap grows past what you accepted.',pre:()=>openSku(D.ids.HG2),side:true},
 {t:'[data-g=acc-list]',h:'Accepted risks stay visible',b:'Nothing disappears. Each note shows the gap accepted, the gap now, and when it would re-alert.',pre:()=>{closeAll();st.tab='acc';renderApp()}},
 {t:'[data-g=flow-panel]',h:'How the data gets in',b:'API, a scheduled export, a shared file, or a manual drop. Click any box. Which routes are allowed depends on IT.',pre:()=>{closeAll();st.tab='attn';renderApp();openFlow();flowPanel('bi')},side:true},
 {t:'[data-g=set-profile]',h:'Metrics are adjustable per person',b:'Thresholds, which flags run, columns and names can all be set by each user. A manager can see only the big decisions.',pre:()=>{closeAll();openSettings()},side:true}];
let gi=-1;
function tour(i){
  gi=i;const g=$('#guide');if(i<0||i>=STEPS.length){g.innerHTML='';document.removeEventListener('keydown',gkey);gi=-1;closeAll();st.tab='attn';renderApp();return}
  const s=STEPS[i];s.pre&&s.pre();
  setTimeout(()=>{const el=$(s.t);if(!el){g.innerHTML='';return}el.scrollIntoView({block:s.side?'nearest':'center'});
    setTimeout(()=>{const r=el.getBoundingClientRect(),pad=6;
     const sh=`<div class="g-shade" style="left:${r.left-pad}px;top:${r.top-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px"></div>`;
     const cw=Math.min(380,innerWidth*.92);let cx=r.left,cy=r.bottom+14;
     if(cy+210>innerHeight)cy=Math.max(10,r.top-230);if(r.height>innerHeight*.6){cy=innerHeight-230}
     if(s.side&&r.left>cw+30)cx=r.left-cw-14;cx=Math.min(Math.max(10,cx),innerWidth-cw-10);
     if(s.side&&r.left<=cw+30)cx=Math.max(10,innerWidth-cw-10),cy=Math.max(10,innerHeight-240);
     g.innerHTML=sh+`<div class="g-call" style="left:${cx}px;top:${cy}px" role="dialog" aria-live="polite"><div class="sm">Step ${i+1} of ${STEPS.length}</div><h4>${esc(s.h)}</h4><div>${esc(s.b)}</div>
      <div class="row"><button class="btn sm" id="g-b" ${i?'':'disabled'}>Back</button><button class="btn sm pri" id="g-n">${i===STEPS.length-1?'Finish':'Next'}</button><button class="btn sm" id="g-x">Exit tour</button></div></div>`;
     $('#g-n').onclick=()=>tour(i+1);$('#g-b').onclick=()=>tour(i-1);$('#g-x').onclick=()=>tour(-1);$('#g-n').focus()},260)},330);
  document.removeEventListener('keydown',gkey);document.addEventListener('keydown',gkey);
}
function gkey(e){if(gi<0)return;if(e.key==='ArrowRight')tour(gi+1);else if(e.key==='ArrowLeft'&&gi>0)tour(gi-1);else if(e.key==='Escape'){e.stopPropagation();tour(-1)}}
/* ---------- boot ---------- */
$('#b-tour').onclick=()=>{st.snap='today';st.tier='attn';st.dec=null;st.sub='';st.q='';st.tab='attn';recompute();renderApp();tour(0)};
$('#b-load').onclick=()=>openLoad(true);$('#b-flow').onclick=()=>openFlow();$('#b-email').onclick=openEmail;$('#b-csv').onclick=downloadCsv;$('#b-set').onclick=openSettings;
$('#scrim').onclick=closeAll;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gi<0)closeAll()});
window.__app={st,recompute,renderApp,openSku,tour,openFlow,flowPanel,openSettings,openEmail,openLoad,downloadCsv,reset:()=>{try{localStorage.removeItem(KEY)}catch(e){}st.settings=merge(DEFSET,{});st.notes=JSON.parse(JSON.stringify(D.seedNotes));st.snap='today';st.tier='attn';st.dec=null;st.sub='';st.q='';st.tab='attn';closeAll();recompute();renderApp()}};
const rb=document.createElement('button');rb.className='btn';rb.id='b-reset';rb.textContent='Reset demo';rb.onclick=()=>window.__app.reset();$('.top-in').appendChild(rb);
const setHH=()=>{const h=$('header.top');if(h)document.documentElement.style.setProperty('--hh',h.offsetHeight+'px')};
addEventListener('resize',setHH);recompute();renderApp();setHH();
})();
