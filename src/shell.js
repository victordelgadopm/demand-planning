(function(){
'use strict';
const A=window.__app,E=A.E,D=A.D,st=A.st,esc=A.esc,money=A.money;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const CK='dpa.cols.v3';
/* ---------- columns ---------- */
const OWN={Fashion:'Planner A',Collector:'Planner B',Small:'Planner C',Baby:'Planner A',"Playsets & Houses":'Planner B',Accessories:'Planner C'};
const TODO={order_more:'Place or expedite an order',too_much:'Pause new orders and review promos',forecast_off:'Review the forecast',check_data:'Fix the source data first'};
const TS={'At risk':'t_risk','Medium':'t_med','Watch':'t_watch','Overstocked':'t_much','No risk':'t_ok'};
const TCLASS={'At risk':'t-risk','Medium':'t-med','Watch':'t-watch','Overstocked':'t-much','No risk':'t-ok'};
const COLS={
 status:{h:'Status',w:13,core:1},sku:{h:'SKU',w:11,core:1},product:{h:'Product',w:32,core:1},sub:{h:'Line',w:17},abc:{h:'ABC Class',w:9,src:'from the Planning system: A items make up the first 80% of 12-week forecast sales value, B the next 15%, C the last 5%'},
 supplier:{h:'Supplier',w:18,src:'from the Shared file'},
 owner:{h:'Owner (Sample)',w:14,src:'as a sample, by line. Your real owner list would come from a file you share'},
 onhand:{h:'On Hand (Units)',w:11,num:'int',src:'from the Planning system: units in the warehouse today'},
 transit:{h:'In Transit (Units)',w:11,num:'int',src:'from the Planning system: units on the way, with a delivery date'},
 openpo:{h:'Open PO (Units)',w:11,num:'int',src:'from the Planning system: units ordered from the supplier that have not shipped yet'},
 onorder:{h:'On Order (Units)',w:11,num:'int',src:'from the Planning system: in transit plus open orders'},
 supply:{h:'Total Supply (Units)',w:12,num:'int',src:'from the Planning system: on hand, in transit and open orders added together'},
 fcstwk:{h:'Forecast Per Week (Units)',w:12,num:'int',src:'from the Planning system: the average of the next 12 weekly forecasts'},
 sales4:{h:'Sales, Last 3 Weeks (Units)',w:12,num:'int',src:'from the Reporting tool: units sold over the last 3 weeks'},
 salesvs:{h:'Sales vs Forecast (Last 3 Weeks)',w:13,num:'pctS',src:'from the Reporting tool and the Planning system: last 3 weeks of sales compared with the forecast for the same weeks'},
 ly:{h:'Same Weeks Last Year (Units)',w:16,num:'int',src:'from the Reporting tool: units sold in the same weeks last year'},
 wos:{h:'Weeks Of Supply',w:11,num:'dec1',src:'from the Planning system: stock on hand plus in transit, divided by the average weekly forecast'},
 lt:{h:'Lead Time (Weeks)',w:11,num:'dec1',src:'from the Shared file: the supplier\'s quoted lead time'},
 stockout:{h:'Stock-Out Week',w:13,src:'calculated: the first week stock goes below zero, using quoted delivery dates'},
 orderby:{h:'Order By',w:11,src:'calculated: the stock-out week minus the supplier lead time'},
 nextarr:{h:'Next Arrival',w:15,src:'from the Planning system: the soonest delivery and its units'},
 gap:{h:'Unit Gap',w:11,num:'int',src:'calculated: units short, units in excess, or units the forecast is off by'},
 gaptype:{h:'Gap Type',w:12,src:'calculated: whether the unit gap is short, over, or a forecast miss'},
 dollars:{h:'$ At Stake',w:12,num:'money',src:'calculated: unit gap times unit price'},
 price:{h:'Unit Price',w:10,num:'money2',src:'from the Shared file'},
 acc:{h:'Forecast Accuracy (13 Wks)',w:13,num:'pct',src:'calculated: one minus the forecast miss over the last 13 weeks'},
 bias:{h:'Forecast Bias (13 Wks)',w:13,num:'pctS',src:'calculated: whether the forecast ran high (+) or low (-) over the last 13 weeks'},
 ship:{h:'Shipped ÷ Sold (8 Wks)',w:12,num:'x2',src:'from the Reporting tool: shipments to retailers divided by retailer sales over 8 weeks'},
 peak:{h:'Peak Months',w:14,src:'calculated from the last two years of sales: months that sell at least 1.5x an average month'},
 peakwk:{h:'Peak Weeks (Next 12)',w:20,src:'calculated: the weeks in the next 12 that sold at least 1.5x a normal week last year'},
 peakcover:{h:'Peak Cover',w:11,src:'calculated: whether projected stock stays above 2 weeks of peak demand through the peak weeks (OK, Thin or Short)'},
 promo:{h:'Promo Status',w:18,src:'from the Shared file (the promo calendar) and last year\'s tagged promo weeks'},
 nextpromo:{h:'Next Promo',w:22,src:'from the Shared file: the next promo week on the calendar and whether it is confirmed'},
 lift:{h:'Promo Lift (Last Year)',w:12,num:'pctS',src:'calculated: last year\'s promo weeks compared with the normal weeks around them'},
 going:{h:'What Is Going On',w:62,core:1,wide:1},todo:{h:'What To Do',w:34},conf:{h:'Confidence',w:12},
 note:{h:'Note',w:48,wide:1,src:'from the notes you save on each item'}};
const DEFAULT=['status','sku','product','sub','onhand','onorder','wos','fcstwk','salesvs','stockout','gap','dollars','going','note','conf'];
const FULLK=['status','sku','product','sub','abc','supplier','owner','onhand','transit','openpo','onorder','supply','fcstwk','sales4','salesvs','ly','peak','peakwk','peakcover','promo','nextpromo','lift','wos','lt','stockout','orderby','nextarr','gap','gaptype','dollars','price','acc','bias','ship','going','todo','conf','note'];
const DASHK=['status','sku','product','onhand','onorder','wos','fcstwk','salesvs','stockout','nextarr','peakcover','nextpromo','gap','dollars','going','note','conf'];
const DH={onhand:'On Hand',onorder:'On Order',wos:'Wks Of Supply',fcstwk:'Fcst / Wk',salesvs:'Sales vs Fcst (3 Wk)',stockout:'Stock-Out Week',nextarr:'Next Arrival',peakcover:'Peak Cover',nextpromo:'Next Promo',gap:'Unit Gap',dollars:'$ At Stake',going:'What Is Going On',note:'Note'};
const dh=k=>DH[k]||COLS[k].h;
let cols=(function(){try{const c=JSON.parse(localStorage.getItem(CK)||'null');if(Array.isArray(c)&&c.every(k=>COLS[k]))return c}catch(e){}return DEFAULT.slice()})();
const saveCols=()=>{try{localStorage.setItem(CK,JSON.stringify(cols))}catch(e){}};
let rowsMode='attn',tab='dash';
const PLK=new Set(['onhand','transit','openpo','onorder','supply','fcstwk','sales4','salesvs','wos','stockout','orderby','nextarr','gap','gaptype','dollars','price','acc','bias','ship','abc','peak','peakwk','peakcover','promo','nextpromo','lift']);
function val(k,r){
  if(PLK.has(k))return A.pv(k,r);
  const m=r.metrics,sk=A.skuOf(r.id),n=A.noteFor(r.id);
  switch(k){
   case 'status':return A.tn(r.tier);case 'sku':return r.id;case 'product':return r.name;case 'sub':return r.sub;
   case 'going':return r.headline||(r.isAccepted?'Accepted risk (see note)':'No flags. Supply covers the forecast.');
   case 'todo':return r.decision?TODO[r.decision]:(r.headline?'Take a look':'');
   case 'conf':return r.headline?r.confidence:'';
   case 'lt':return m.lt&&m.lt.q!=null?m.lt.q:'';
   case 'ly':return Math.round(m.lyRaw||0);
   case 'supplier':return sk?sk.supplier:'';case 'owner':return OWN[r.sub]||'Planner A';
   case 'note':return n?n.line:'';}
  return '';
}
function sheetRows(mode){
  return st.res.rows.filter(r=>mode==='all'||r.headline).sort((a,b)=>E.TIER_ORDER[a.tier]-E.TIER_ORDER[b.tier]||b.dollars-a.dollars);
}
/* ---------- dashboard ---------- */
const ALLD='All decisions',DECKEYS=Object.keys(A.DEC),DECL=DECKEYS.map(k=>A.DEC[k][0]);
const STAT=()=>['Needs attention',...A.TIERS.map(t=>A.tn(t)),'All statuses'];
const dName=r=>r.decision?A.DEC[r.decision][0]:'';
let dashDec=ALLD,dashStat='Needs attention';
const statOK=r=>dashStat==='All statuses'||(dashStat==='Needs attention'&&!!r.headline)||A.tn(r.tier)===dashStat;
const dashMatch=r=>(dashDec===ALLD||dName(r)===dashDec)&&statOK(r);
const sumD=it=>it.reduce((t,r)=>t+(r.dollars>0?Math.round(r.dollars):0),0);
function dashHtml(){
  const all=sheetRows('all'),rows=all.filter(dashMatch);
  const boxes=DECKEYS.map((k,i)=>{const lab=DECL[i],it=all.filter(r=>dName(r)===lab&&statOK(r));
    return `<div class="dbox${dashDec===lab?' sel':''}"><div class="dbt">${esc(lab)}</div><div class="dbn">${it.length}</div><div class="dbs">${money(sumD(it))} at stake</div></div>`}).join('');
  const head=DASHK.map(k=>`<th class="${COLS[k].num?'money':''}">${esc(dh(k))}</th>`).join('');
  const body=rows.map(r=>`<tr data-open="${r.id}" tabindex="0">${DASHK.map(k=>{const v=val(k,r),C=COLS[k];
    if(k==='status')return `<td class="st ${TCLASS[r.tier]||'t-ok'}">${esc(v)}</td>`;
    if(C.num)return `<td class="money ${A.pcls(k,v)}">${esc(A.fv(k,v))}</td>`;
    return `<td class="${k==='going'?'wide':(k==='sku'||k==='conf'||k==='nextarr'?'c':'')} ${A.pcls(k,v)}">${esc(String(v))}</td>`}).join('')}</tr>`).join('');
  return `<div class="dash"><h3>Daily Planning Dashboard (Sample Data), ${esc(A.TODAY_SHORT)}</h3>
   <p class="dnote">Decision is the action an item needs. Status is how urgent it is, and "Needs attention" means anything flagged. Pick one of each in the two yellow cells. The four boxes count the items for the status you picked, and the list rebuilds itself. This is the same dashboard that opens first in the downloaded sheet.</p>
   <div class="dpick"><label>Decision <select id="dd">${[ALLD,...DECL].map(o=>`<option ${o===dashDec?'selected':''}>${esc(o)}</option>`).join('')}</select></label>
   <label>Status <select id="ds">${STAT().map(o=>`<option ${o===dashStat?'selected':''}>${esc(o)}</option>`).join('')}</select></label></div>
   <div class="dboxes">${boxes}</div>
   <div class="dsec">Portfolio Snapshot <span>All items, not filtered by the picks above</span></div>
   <div class="snap dsnap">${A.snapTiles().map(([t,n,sub])=>`<div class="snapt"><div class="t">${t}</div><div class="n">${n}</div><div class="d">${esc(sub)}</div></div>`).join('')}</div>
   <div class="dcount">Items matching your choices: <b>${rows.length}</b><span class="dsep">·</span>Total $ at stake: <b>${money(sumD(rows))}</b><span class="dsep">·</span>No decision needed: <b>${rows.filter(r=>!r.decision).length}</b></div>
   <div class="xl-scroll"><table class="xt dtab"><thead><tr class="heads">${head}</tr></thead><tbody>${body||`<tr><td colspan="${DASHK.length}">Nothing matches these choices.</td></tr>`}</tbody></table></div>
   <p class="dfoot">$ At Stake is the unit gap times the unit price. Unit gap is units short for Order more, units over for Too much stock, and units the forecast is off by for Forecast looks off. Red weeks of supply is under 4, purple is over ${st.settings.overstockWOS}. Amber sales vs forecast is 15% or more either way.</p></div>`;
}
/* ---------- since / notes / recipe data ---------- */
function sinceItems(){
  if(!st.diff)return [];const d=st.diff,out=[],add=(t,ids)=>ids.forEach(id=>{const r=A.rowOf(id);out.push([t,r.name,r.id,r.headline||'Order was placed'])});
  add('Newly at risk',d.toAtRisk);add('Re-alert',d.reAlerted);add('New flag',d.newFlags);add('Got worse',d.worsened);add('Fixed',d.recovered);return out;
}
function noteItems(){
  return Object.values(E.activeNotes(st.notes)).sort((a,b)=>a.id-b.id).map(n=>{const r=A.rowOf(n.sku);return [n.sku,r?r.name:'',E.NOTE_LABEL[n.flag]||n.flag,n.kind==='comment'?'Comment':'Accepted risk',n.reason,n.text,n.who,n.date,n.kind==='comment'?'':Math.round(n.acceptedGap||0)]});
}
const DEFS=[
 ['On Hand / In Transit / Open PO','Units in the warehouse today / units on the way with a delivery date / units ordered from the supplier that have not shipped. On Order is In Transit plus Open PO. Total Supply is On Hand plus On Order.'],
 ['Forecast Per Week','The average of the next 12 weekly forecasts.'],
 ['Sales vs Forecast (3 Wk)','Sales over the last 3 weeks divided by the forecast for the same weeks, minus 1. Amber when it is 15% or more either way.'],
 ['Weeks Of Supply','(On Hand + In Transit) divided by Forecast Per Week. Red under 4 weeks. Purple over '+st.settings.overstockWOS+' weeks (a setting).'],
 ['Stock-Out Week','The first week in the next 12 where projected stock goes below zero, using the quoted delivery dates. "None" means no stock-out in 12 weeks. "n/a" means a new item or a data problem.'],
 ['Order By','The stock-out week minus the supplier lead time (the longer of quoted and typical). "Now" means that date has already passed.'],
 ['Next Arrival','The soonest delivery, in transit or on a PO, with its units.'],
 ['Unit Gap','Units short (Order more or expedite), units over (Too much stock), or units the forecast is off by (Forecast looks off).'],
 ['$ At Stake','Unit Gap times Unit Price.'],
 ['ABC Class','A is the items that make the first 80% of 12-week forecast sales value, B the next 15%, C the last 5%.'],
 ['Forecast Accuracy / Bias','Accuracy is 1 minus the miss (WMAPE) over the last 13 weeks. Miss is the sum of |actual - forecast| divided by total actual. Bias is (forecast - actual) divided by actual, so negative means the forecast runs low.'],
 ['Shipped ÷ Sold (8 Wks)','Shipments to retailers divided by retailer sales over 8 weeks. Above 1.3x suggests retailers are building stock.'],
 ['Peak Months / Peak Weeks','Peak months are the calendar months that sold at least 1.5x an average month, over the last two years. Peak weeks are the weeks in the next 12 that sold at least 1.5x a normal week last year.'],
 ['Peak Cover','OK means projected stock stays above 2 weeks of peak demand through the peak weeks. Thin means it dips below that. Short means stock goes below zero. "No peak" means no peak week falls in the next 12.'],
 ['Promo Status','None, Last year only, Not confirmed (this year\'s promo is on the calendar but not confirmed), Confirmed covered or short (supply against the base forecast plus last year\'s lift), or New this year.'],
 ['Promo Lift (Last Year)','Last year\'s promo weeks compared with the normal weeks around them.'],
 ['12-Week Plan','Projected On Hand each week is last week plus receipts minus forecast demand. Red means below zero. Lowest Point is the lowest projected week. The Peak / Promo Weeks row marks PEAK weeks, PROMO weeks (PROMO? if not confirmed) and BOTH.']];
function recipeItems(){
  return [['Rows Shown','Items that need attention, ranked by status then dollars. Switch to all items any time.'],
   ['Columns',cols.map(k=>COLS[k].h).join(', ')],
   ['Data Sources',D.sources.map(s=>s.name).join(', ')],
   ['Checks Run',Object.keys(E.FLAG_LABEL).filter(k=>st.settings.flags[k]).map(k=>E.FLAG_LABEL[k]).join(', ')],
   ['Seasonality And Promos','Peak months are calculated from sales history. Promos are read from the promo calendar file. The Seasonal Calendar tab lists what is calculated, what comes from a file and what is not available.'],
   ['Notes','Notes never expire. A comment keeps the alert on. An accepted risk stops the alert and comes back only if its gap grows past 1.5 times what was accepted.'],
   ['Schedule','Every morning after the files refresh (sample: 6:05 AM)'],
   ['How To Change It','Tell the AI in chat what you are not seeing. It updates this recipe.'],
   ...DEFS.map(d=>['Definition: '+d[0],d[1]])];
}
/* ---------- plan + accuracy data ---------- */
function planBlocks(rows){
  return rows.map(r=>{const sk=A.skuOf(r.id),pj=E.project(sk,A.snap(),{demand:sk.fcstH,slip:0}).rows;const pw=new Set(r.metrics.peak?r.metrics.peak.weeks:[]),ty={};((sk.promo&&sk.promo.ty)||[]).forEach(x=>{ty[x.h]=x.confirmed});
    const mark=pj.map((x,h)=>{const pk=pw.has(h),pr=h in ty;return pk&&pr?'BOTH':pk?'PEAK':pr?(ty[h]?'PROMO':'PROMO?'):''});
    return {r,onHand:sk.inv.onHand,dem:pj.map(x=>x.demand),rec:pj.map(x=>x.arrival),inv:pj.map(x=>x.inv),mark}});
}
const weekLabels=()=>Array.from({length:E.H},(_,h)=>E.fmtDate(E.weekStart(A.snap(),h)));
const tgtText=(w,b)=>w>0.35||Math.abs(b)>0.10?'Off target':w>0.25||Math.abs(b)>0.05?'Watch':'On target';
function accRows(){
  const T=E.accuracyTotal(A.snap()),a=E.accuracy(A.snap());
  return [{line:'All Lines',n:T.n,w:T.wmape,b:T.bias,sig:''},...Object.entries(a).sort((x,y)=>y[1].wmape-x[1].wmape).map(([k,v])=>({line:k,n:v.n,w:v.wmape,b:v.bias,sig:v.possible?'Possible bias: forecast runs '+(v.direction==='under'?'low':'high'):'No consistent bias'}))];
}
/* ---------- grid ---------- */
function letters(n){return Array.from({length:n},(_,i)=>MiniXlsx.col(i))}
function gridHtml(heads,rows,o){
  o=o||{};const L=letters(heads.length);
  return `<div class="xl-scroll"><table class="xt"><thead><tr class="letters"><th class="rn"></th>${L.map(x=>`<th>${x}</th>`).join('')}</tr>
   <tr class="heads"><th class="rn">1</th>${heads.map(h=>`<th class="${h.cls||''}">${esc(h.t)}</th>`).join('')}</tr></thead>
   <tbody>${rows.length?rows.map((r,i)=>`<tr ${r.id?`data-open="${r.id}" tabindex="0"`:''}><td class="rn">${i+2}</td>${r.c.map(c=>`<td class="${c.cls||''}">${esc(c.t)}</td>`).join('')}</tr>`).join(''):`<tr><td class="rn">2</td><td colspan="${heads.length}">${esc(o.empty||'Nothing here.')}</td></tr>`}</tbody></table></div>`;
}
function colGrid(keys,rows,empty){
  const heads=keys.map(k=>({t:COLS[k].h,cls:COLS[k].num?'money':''}));
  const body=rows.map(r=>({id:r.id,c:keys.map(k=>{const v=val(k,r),C=COLS[k];
    if(k==='status')return {t:v,cls:'st '+TCLASS[r.tier]};
    if(C.num)return {t:A.fv(k,v),cls:'money '+A.pcls(k,v)};
    return {t:String(v),cls:(C.wide?'wide ':'')+A.pcls(k,v)}})}));
  return {html:gridHtml(heads,body,{empty}),n:rows.length};
}
function planGrid(rows){
  const wl=weekLabels(),heads=[{t:'Status'},{t:'SKU'},{t:'Product'},{t:'Measure'},{t:'On Hand Now',cls:'money'},...wl.map(t=>({t,cls:'money'})),{t:'12-Wk Total',cls:'money'},{t:'Lowest Point',cls:'money'},{t:'Note'}];
  const body=[],nf=v=>E.fmtNum(v);
  planBlocks(rows).forEach(b=>{const r=b.r,low=Math.min(...b.inv);
    const id=(first)=>first?[{t:A.tn(r.tier),cls:'st '+TCLASS[r.tier]},{t:r.id},{t:r.name}]:[{t:''},{t:''},{t:''}];
    body.push({id:r.id,c:[...id(1),{t:'Forecast Demand'},{t:''},...b.dem.map(v=>({t:nf(v),cls:'money'})),{t:nf(b.dem.reduce((a,v)=>a+v,0)),cls:'money'},{t:''},{t:val('note',r),cls:'wide'}]});
    body.push({id:r.id,c:[...id(0),{t:'Receipts (Transit + PO)'},{t:''},...b.rec.map(v=>({t:v?nf(v):'',cls:'money'})),{t:nf(b.rec.reduce((a,v)=>a+v,0)),cls:'money'},{t:''},{t:''}]});
    body.push({id:r.id,c:[...id(0),{t:'Projected On Hand',cls:'bold'},{t:nf(b.onHand),cls:'money'},...b.inv.map(v=>({t:nf(v),cls:'money'+(v<0?' bad':'')})),{t:''},{t:nf(low),cls:'money'+(low<0?' bad':'')},{t:''}]});
    body.push({id:r.id,c:[...id(0),{t:'Peak / Promo Weeks'},{t:''},...b.mark.map(v=>({t:v,cls:v?'warn':''})),{t:''},{t:''},{t:''}]})});
  return {html:gridHtml(heads,body,{empty:'Nothing needs attention.'}),n:rows.length};
}
const PPK=['status','sku','product','sub','promo','nextpromo','lift','peak','peakwk','peakcover','going','note'];
const SEASON_KEY='How to read this: 1.00x is a normal month. 1.50x or more is a peak and is shaded. Q4 Share is the part of the year\'s sales that falls in Oct to Dec (25% would be flat). A line with no shaded month has no seasonal peak.';
const seasonSummary=d=>`${d.n.promo} of ${d.n.items} items have a promo this year or last year (${d.n.ty} this year, ${d.n.unconf} not yet confirmed). ${d.n.thin} of the ${d.n.peak} items with a peak in the next 12 weeks would run thin or short.`;
function seasonGrid(){
  const d=A.seasonData(),heads=[{t:'Line'},...A.MONS.map(m=>({t:m,cls:'money'})),{t:'Q4 Share',cls:'money'},{t:'Peak Months'}];
  const body=d.lrow.map(l=>({c:[{t:l.line,cls:'bold'},...l.idx.map(x=>({t:x.toFixed(2)+'x',cls:'money'+(x>=1.5?' warn':'')})),{t:A.pctN(l.q4,0),cls:'money'},{t:l.peak}]}));
  const srcs=gridHtml(['Topic','Where It Comes From','How'].map(t=>({t})),A.SEASON_SRC.map(x=>({c:[{t:x[0],cls:'bold'},{t:x[1],cls:'st'},{t:x[2],cls:'wide'}]})));
  return `<div class="note-box">${esc(seasonSummary(d))}</div><div class="note-box">${esc(SEASON_KEY)}</div>`+gridHtml(heads,body)+`<h3 class="sub-h">Where This Comes From</h3>`+srcs;
}
function accGrid(){
  const rows=accRows(),heads=['Line','Items','Forecast Accuracy','Miss (WMAPE)','Bias','Against Targets','Signal'].map((t,i)=>({t,cls:i>=1&&i<=4?'money':''}));
  return {html:gridHtml(heads,rows.map(x=>({c:[{t:x.line,cls:'bold'},{t:String(x.n),cls:'money'},{t:A.pctN(1-x.w),cls:'money'},{t:A.pctN(x.w),cls:'money'},{t:A.pctSN(x.b),cls:'money'},{t:tgtText(x.w,x.b),cls:({'On target':'','Watch':'warn','Off target':'bad'})[tgtText(x.w,x.b)]},{t:x.sig,cls:'wide'}]}))),n:rows.length-1};
}
const TABS=[['dash','Dashboard'],['today','Today'],['all','Master List'],['plan','12-Week Plan'],['acc','Forecast Accuracy'],['season','Seasonal Calendar'],['promos','Promos And Peaks'],['since','Since Yesterday'],['notes','Notes'],['recipe','Recipe']];
function renderSheet(){
  const v=$('#v-sheet'),total=st.res.total;
  let inner,count='';
  if(tab==='dash'){inner=dashHtml();count='Interactive'}
  else if(tab==='today'){const g=colGrid(cols,sheetRows(rowsMode),'Nothing needs attention.');inner=g.html;count=`${g.n} of ${total} items`}
  else if(tab==='all'){const g=colGrid(FULLK,sheetRows('all'));inner=g.html;count=`${g.n} items, every column`}
  else if(tab==='plan'){const g=planGrid(sheetRows(rowsMode));inner=g.html;count=`${g.n} items, ${E.H} weeks`}
  else if(tab==='acc'){const g=accGrid();inner=g.html;count='Last 13 weeks'}
  else if(tab==='season'){inner=seasonGrid();count='12 months, by line'}
  else if(tab==='promos'){const d=A.seasonData(),g=colGrid(PPK,d.list);inner=g.html;count=`${g.n} items with a promo or a thin peak`}
  else if(tab==='since'){const it=sinceItems();inner=gridHtml(['Change','Product','SKU','Detail','Note'].map(t=>({t})),it.map(r=>({id:r[2],c:[...r.map(t=>({t})),{t:val('note',A.rowOf(r[2])),cls:'wide'}]})),{empty:'Nothing changed since yesterday.'});count=it.length+' changes'}
  else if(tab==='notes'){const it=noteItems();inner=gridHtml(['SKU','Product','About','Type','Reason','Note','Who','Date','Accepted Gap (Units)'].map(t=>({t})),it.map(r=>({id:r[0],c:r.map((t,i)=>({t:String(t),cls:i===5?'wide':''}))})),{empty:'No notes yet.'});count=it.length+' notes'}
  else{const it=recipeItems();inner=gridHtml(['Setting','What It Is Set To'].map(t=>({t})),it.map(r=>({c:[{t:r[0],cls:'st'},{t:r[1],cls:'wide'}]})));count='Saved with the sheet'}
  v.innerHTML=`<div class="page"><div class="pg-h"><h1>Daily Sheet</h1></div>
   <p class="pg-sub">This is what lands in your Excel file every morning. Click any row to see the numbers behind it. The download opens in Excel with the same colors and formatting, on an interactive Dashboard where the yellow dropdowns change the boxes and the list.</p>
   <div class="xl"><div class="xl-bar"><span class="fx">fx</span><b>Daily Planning Sheet (Sample Data), ${esc(A.TODAY_SHORT)}</b><span class="mute" style="color:#555">${count}</span><span style="flex:1"></span>
    ${tab==='today'||tab==='plan'?`<span class="seg" role="group" aria-label="Rows"><button data-rows="attn" aria-pressed="${rowsMode==='attn'}">Needs attention</button><button data-rows="all" aria-pressed="${rowsMode==='all'}">All items</button></span>`:''}
    <button class="btn sm" id="sh-custom">Add or remove columns</button>
    <button class="btn dl" id="sh-dl">Download Sheet</button></div>
   ${inner}
   <div class="xl-tabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" aria-selected="${tab===k}" data-xt="${k}">${l}</button>`).join('')}</div></div>
   <p class="sec-sub" style="margin:10px 0 0"><b>Tabs at the bottom:</b> Dashboard opens first. Today lists what needs you, with the columns you chose. Master List is the primary tab: it has every item and every column, and Dashboard, Today and Promos And Peaks read from it, so a change there shows up in all three. 12-Week Plan projects stock week by week. Forecast Accuracy shows how the forecast has done by line. Since Yesterday is what changed. Notes is where notes are typed, and the Master List pulls each item's note from it, so the Note column on every tab follows. Recipe explains how the sheet is built and defines every column.</p><p class="simnote">Sample data, not Mattel data. The real file is built the same way from your own exports.</p></div>`;
  $$('[data-rows]',v).forEach(b=>b.onclick=()=>{rowsMode=b.dataset.rows;renderSheet()});
  $$('[data-xt]',v).forEach(b=>b.onclick=()=>{tab=b.dataset.xt;renderSheet()});
  const dd=$('#dd',v),ds=$('#ds',v);if(dd)dd.onchange=()=>{dashDec=dd.value;renderSheet()};if(ds)ds.onchange=()=>{dashStat=ds.value;renderSheet()};
  $$('[data-open]',v).forEach(e=>{e.onclick=()=>A.openSku(e.dataset.open);e.onkeydown=ev=>{if(ev.key==='Enter')A.openSku(e.dataset.open)}});
  $('#sh-dl').onclick=downloadXlsx;$('#sh-custom').onclick=()=>go('custom');
}
/* ---------- xlsx ---------- */
function downloadXlsx(){
  const C=MiniXlsx.col,hdr=ks=>Object.assign(ks.map(t=>({v:t,s:'head'})),{h:42});
  const cellOf=(k,r)=>{const v=val(k,r),Cc=COLS[k];
    if(k==='status')return {v,s:TS[r.tier]};
    if(Cc.num)return v===''?null:{v,s:Cc.num};
    return {v,s:'txt'}};
  /* conditional formats shared by the list sheets: weeks of supply, sales vs forecast, stock-out, negative stock */
  const ovr=st.settings.overstockWOS;
  const cfList=(keys,first,last)=>{if(last<first)return [];const out=[],L=k=>{const i=keys.indexOf(k);return i<0?null:C(i)};
    const wl=L('wos'),sl=L('salesvs'),ol=L('stockout'),hl=L('onhand'),ob=L('orderby');
    if(wl)out.push({ref:`${wl}${first}:${wl}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(ISNUMBER(${wl}${first}),${wl}${first}<4)`},{type:'expression',dxf:2,formula:`AND(ISNUMBER(${wl}${first}),${wl}${first}>${ovr})`}]});
    if(sl)out.push({ref:`${sl}${first}:${sl}${last}`,rules:[{type:'expression',dxf:1,formula:`AND(ISNUMBER(${sl}${first}),ABS(${sl}${first})>=0.15)`}]});
    [ol,ob].forEach(c=>{if(c)out.push({ref:`${c}${first}:${c}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(${c}${first}<>"",${c}${first}<>"None",${c}${first}<>"n/a")`}]})});
    if(hl)out.push({ref:`${hl}${first}:${hl}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(ISNUMBER(${hl}${first}),${hl}${first}<0)`}]});
    const pcv=L('peakcover'),prm=L('promo');
    if(pcv)out.push({ref:`${pcv}${first}:${pcv}${last}`,rules:[{type:'cellIs',op:'equal',dxf:0,formula:'"Short"'},{type:'cellIs',op:'equal',dxf:1,formula:'"Thin"'}]});
    if(prm)out.push({ref:`${prm}${first}:${prm}${last}`,rules:[{type:'cellIs',op:'equal',dxf:0,formula:'"Confirmed, short"'},{type:'cellIs',op:'equal',dxf:1,formula:'"Not confirmed"'}]});
    return out};
  const mk=(rows,name,keys)=>{
    const data=rows.map(r=>keys.map(k=>cellOf(k,r)));
    return {name,widths:keys.map(k=>COLS[k].w),rows:[hdr(keys.map(k=>COLS[k].h)),...data],freeze:1,filter:data.length+1,cf:cfList(keys,2,data.length+1)};
  };
  const since=sinceItems(),notes=noteItems(),rec=recipeItems();
  const allRows=sheetRows('all'),N=allRows.length;
  const STATL=STAT(),D0=dashDec,S0=dashStat;
  /* ---- Master List: every item, every column, plus four hidden helper columns that drive the dashboard ---- */
  const nf=FULLK.length,ix=k=>FULLK.indexOf(k);
  const HELP=['Decision','Needs Attention','Status Match','Show'];
  const dataSheet=mk(allRows,'Master List',FULLK);
  dataSheet.freezeCols=3;
  dataSheet.rows[0].push(...HELP.map(t=>({v:t,s:'head'})));
  const hL=i=>C(nf+i),sCol=C(ix('status'));
  let run=0;const showVal=allRows.map(r=>dashMatch(r)?++run:'');
  allRows.forEach((r,i)=>{const row=dataSheet.rows[i+1],er=i+2;
    row.push({v:dName(r),s:'txt'},{v:r.headline?'Yes':'No',s:'txt'},
     {f:`IF(OR(Dashboard!$F$4="All statuses",AND(Dashboard!$F$4="Needs attention",${hL(1)}${er}="Yes"),${sCol}${er}=Dashboard!$F$4),1,0)`,v:statOK(r)?1:0,s:'txt'},
     {f:`IF(AND(OR(Dashboard!$B$4="${ALLD}",${hL(0)}${er}=Dashboard!$B$4),${hL(2)}${er}=1),MAX(${hL(3)}$1:${hL(3)}${er-1})+1,"")`,v:showVal[i],s:'txt'})});
  dataSheet.widths=[...dataSheet.widths,...HELP.map(()=>14)];
  dataSheet.hide=HELP.map((_,i)=>nf+i);
  const rng=k=>{const c=C(typeof k==='number'?nf+k:ix(k));return `'Master List'!$${c}$2:$${c}$${N+1}`};
  const rDec=rng(0),rAtt=rng(1),rSM=rng(2),rShow=rng(3);
  /* Notes are typed on the Notes tab. The Master List pulls each item's first note by SKU, and every other tab pulls it from the Master List. */
  const NA='Notes!$A$2:$A$500',NE='Notes!$E$2:$E$500',NF='Notes!$F$2:$F$500',skuC=C(ix('sku')),noteI=ix('note');
  allRows.forEach((r,i)=>{const er=i+2;dataSheet.rows[i+1][noteI]={f:`IFERROR(INDEX(${NE},MATCH($${skuC}${er},${NA},0))&": "&INDEX(${NF},MATCH($${skuC}${er},${NA},0)),"")`,v:val('note',r),s:'txt'}});
  const TN0=['At risk','Medium','Watch','Overstocked','No risk'];
  /* list tabs that read every cell from the Master List by SKU */
  const mkL=(rows,name,keys)=>{const si=keys.indexOf('sku');if(si<0)return mk(rows,name,keys);const sc=C(si),skuR=rng('sku');
    const data=rows.map((r,i)=>{const er=i+2;return keys.map(k=>{if(k==='sku')return {v:r.id,s:'ctr'};
      const Cc=COLS[k],rg=rng(k),m=`MATCH($${sc}${er},${skuR},0)`,v=val(k,r);
      return {f:`IFERROR(IF(INDEX(${rg},${m})="","",INDEX(${rg},${m})),"")`,v:v,s:k==='status'?'ctr':Cc.num||'txt'}})});
    const sh={name,widths:keys.map(k=>COLS[k].w),rows:[hdr(keys.map(k=>COLS[k].h)),...data],freeze:1,filter:data.length+1,cf:cfList(keys,2,data.length+1)};
    const stc=keys.indexOf('status');if(stc>=0&&data.length)sh.cf.push({ref:`${C(stc)}2:${C(stc)}${data.length+1}`,rules:TN0.map((t,j)=>({type:'cellIs',op:'equal',dxf:j,formula:`"${A.tn(t)}"`}))});
    return sh};
  /* ---- Forecast Accuracy ---- */
  const ac=accRows(),AR=ac.length+1;
  const accSheet={name:'Forecast Accuracy',fit:true,widths:[20,9,16,16,12,16,40],freeze:1,rows:[hdr(['Line','Items','Forecast Accuracy','Miss (WMAPE)','Bias','Against Targets','Signal']),
    ...ac.map((x,i)=>{const er=i+2;return [{v:x.line,s:'bold'},{v:x.n,s:'int'},{f:`1-D${er}`,v:1-x.w,s:'pct'},{v:x.w,s:'pct'},{v:x.b,s:'pctS'},
      {f:`IF(OR(D${er}>0.35,ABS(E${er})>0.1),"Off target",IF(OR(D${er}>0.25,ABS(E${er})>0.05),"Watch","On target"))`,v:tgtText(x.w,x.b),s:'ctr'},{v:x.sig,s:'txt'}]}),
    [],[{v:'How to read this',s:'bold'}],
    [{v:'Miss (WMAPE) adds up |actual - forecast| for every SKU and week over the last 13 weeks, then divides by total actual sales. Bias is (forecast - actual) divided by actual: negative means the forecast runs low. Common targets: miss under 25%, bias within 5% either way. Over 35% miss or 10% bias is off target.',s:'note'}]],
    cf:[{ref:`F2:F${AR}`,rules:[{type:'cellIs',op:'equal',dxf:0,formula:'"Off target"'},{type:'cellIs',op:'equal',dxf:1,formula:'"Watch"'},{type:'cellIs',op:'equal',dxf:4,formula:'"On target"'}]}],merges:[`A${AR+3}:G${AR+3}`]};
  accSheet.rows[AR+2].h=48;
  /* ---- 12-Week Plan: forecast, receipts and projected on hand for every item ---- */
  const PB=planBlocks(allRows),wl=weekLabels(),W=E.H;
  const plan={name:'12-Week Plan',widths:[13,11,32,24,12,...Array(W).fill(9),12,12,46],freeze:1,freezeCols:4,rows:[hdr(['Status','SKU','Product','Measure','On Hand Now',...wl,'12-Wk Total','Lowest Point','Note'])],cf:[]};
  const wc0=5,wcN=4+W,tc=5+W,lc=6+W;
  PB.forEach((b,i)=>{const r=b.r,r1=2+i*4,r2=r1+1,r3=r1+2,id=[{v:A.tn(r.tier),s:TS[r.tier]},{v:r.id,s:'txt'},{v:r.name,s:'txt'}];
    const rd=Math.round,v3=x=>Math.round(x*1000)/1000;
    plan.rows.push([...id,{v:'Forecast Demand',s:'txt'},{v:'',s:'txt'},...b.dem.map(x=>({v:v3(x),s:'int'})),{f:`SUM(${C(wc0)}${r1}:${C(wcN)}${r1})`,v:b.dem.reduce((a,x)=>a+v3(x),0),s:'int'},{v:'',s:'txt'},{f:`IFERROR(IF(INDEX(${rng('note')},MATCH($B${r1},${rng('sku')},0))="","",INDEX(${rng('note')},MATCH($B${r1},${rng('sku')},0))),"")`,v:val('note',r),s:'txt'}]);
    plan.rows.push([...id,{v:'Receipts (Transit + PO)',s:'txt'},{v:'',s:'txt'},...b.rec.map(x=>({v:x||0,s:'int'})),{f:`SUM(${C(wc0)}${r2}:${C(wcN)}${r2})`,v:b.rec.reduce((a,x)=>a+x,0),s:'int'},{v:'',s:'txt'},{v:'',s:'txt'}]);
    let prev=b.onHand;const proj=b.dem.map((d,h)=>{prev=prev+(b.rec[h]||0)-v3(d);return prev});
    plan.rows.push([...id,{v:'Projected On Hand',s:'bold'},{v:b.onHand,s:'int'},...proj.map((x,h)=>({f:`${C(wc0+h-1)}${r3}+${C(wc0+h)}${r2}-${C(wc0+h)}${r1}`,v:x,s:'int'})),{v:'',s:'txt'},
      {f:`MIN(${C(wc0)}${r3}:${C(wcN)}${r3})`,v:Math.min(...proj),s:'int'},{v:'',s:'txt'}]);
    plan.rows.push([...id,{v:'Peak / Promo Weeks',s:'txt'},{v:'',s:'txt'},...b.mark.map(x=>({v:x,s:'ctr'})),{v:'',s:'txt'},{v:'',s:'txt'},{v:'',s:'txt'}]);
  });
  const pl=plan.rows.length;plan.filter=pl;
  // first projected week starts from On Hand Now (column E)
  plan.cf.push({ref:`${C(wc0)}2:${C(lc)}${pl}`,rules:[{type:'expression',dxf:0,formula:`AND($D2="Projected On Hand",ISNUMBER(${C(wc0)}2),${C(wc0)}2<0)`}]});
  plan.cf.push({ref:`${C(wc0)}2:${C(wcN)}${pl}`,rules:[{type:'expression',dxf:1,formula:`AND($D2="Peak / Promo Weeks",${C(wc0)}2<>"")`}]});
  /* ---- Seasonal Calendar and Promos And Peaks ---- */
  const SD=A.seasonData(),SR=SD.lines.length,sc0=5;
  const season={name:'Seasonal Calendar',fit:true,widths:[24,...Array(12).fill(8),10,16],freeze:0,rows:[],merges:[],cf:[]};
  const sput=(r,c,o)=>{while(season.rows.length<r)season.rows.push([]);season.rows[r-1][c]=o};
  const sspan=(r,c0,c1,o)=>{sput(r,c0,o);for(let c=c0+1;c<=c1;c++)sput(r,c,{v:'',s:o.s});if(c1>c0)season.merges.push(`${C(c0)}${r}:${C(c1)}${r}`)};
  const LC=14;
  sspan(1,0,LC,{v:'Seasonal Calendar (Sample Data)',s:'title'});
  sspan(2,0,LC,{f:`COUNTIF(${rng('promo')},"<>None")&" of "&COUNTA(${rng('sku')})&" items have a promo this year or last year. "&(COUNTIF(${rng('peakcover')},"Thin")+COUNTIF(${rng('peakcover')},"Short"))&" items would run thin or short into a peak in the next 12 weeks."`,
    v:`${SD.n.promo} of ${SD.n.items} items have a promo this year or last year. ${SD.n.thin} items would run thin or short into a peak in the next 12 weeks.`,s:'note'});
  sspan(3,0,LC,{v:SEASON_KEY,s:'note'});
  season.rows[1].h=22;season.rows[2].h=34;
  sput(5,0,{v:'Line (Compared With A Normal Month)',s:'head'});A.MONS.forEach((m,j)=>sput(5,1+j,{v:m,s:'head'}));sput(5,13,{v:'Q4 Share',s:'head'});sput(5,14,{v:'Peak Months',s:'head'});season.rows[4].h=30;
  SD.lrow.forEach((l,i)=>{const r=6+i;sput(r,0,{v:l.line,s:'bold'});l.idx.forEach((x,j)=>sput(r,1+j,{v:x,s:'x2'}));sput(r,13,{f:`SUM(K${r}:M${r})/12`,v:l.q4,s:'pct'});sput(r,14,{v:l.peak,s:'txt'})});
  season.cf.push({ref:`B6:M${5+SR}`,rules:[{type:'cellIs',op:'greaterThanOrEqual',dxf:1,formula:'1.5'}]});
  const wr=7+SR;sspan(wr,0,LC,{v:'Where This Comes From',s:'sect'});
  A.SEASON_SRC.forEach((x,i)=>{const r=wr+1+i;sspan(r,0,0,{v:x[0],s:'bold'});sspan(r,1,2,{v:x[1],s:'ctr'});sspan(r,3,LC,{v:x[2],s:'note'});season.rows[r-1].h=40});
  const promoSheet=mkL(SD.list,'Promos And Peaks',PPK);promoSheet.fit=true;promoSheet.freezeCols=3;
  /* ---- Dashboard ---- */
  const DW={status:12,sku:10,product:30,onhand:10,onorder:10,wos:9,fcstwk:9,salesvs:11,stockout:12,nextarr:15,peakcover:10,nextpromo:17,gap:10,dollars:12,going:50,note:40,conf:10};
  const nd=DASHK.length,HC=nd; // helper column index on the dashboard
  const dash={name:'Dashboard',tab:'FF1F3864',fit:true,noGrid:true,widths:[...DASHK.map(k=>DW[k]),6],hide:[HC],rows:[],merges:[],cf:[],dv:[]};
  const R=n=>{while(dash.rows.length<n)dash.rows.push([]);return dash.rows[n-1]};
  const put=(r,c,o)=>{R(r)[c]=o};
  const fill=(r,c0,c1,sty)=>{for(let c=c0;c<=c1;c++)if(!R(r)[c])put(r,c,{v:'',s:sty})};
  const span=(r,c0,c1,o)=>{put(r,c0,o);fill(r,c0+1,c1,o.s);if(c1>c0)dash.merges.push(`${C(c0)}${r}:${C(c1)}${r}`)};
  span(1,0,nd-1,{v:'Daily Planning Dashboard (Sample Data), '+A.TODAY_SHORT,s:'title'});R(1).h=26;
  span(2,0,nd-1,{v:'Decision is the action an item needs. Status is how urgent it is, and "Needs attention" means anything flagged. Pick one of each in the two yellow cells. The four boxes count the items for the status you picked, and the list rebuilds itself. Sample data, not Mattel data. If Excel opens this in Protected View, click Enable Editing first.',s:'note'});R(2).h=34;
  put(4,0,{v:'Decision',s:'label'});span(4,1,2,{v:D0,s:'pick'});
  span(4,3,4,{v:'Status',s:'label'});span(4,5,7,{v:S0,s:'pick'});R(4).h=24;
  dash.dv.push({ref:'B4',title:'Decision',prompt:'Pick a decision to filter the list.',list:'"'+[ALLD,...DECL].join(',')+'"'},{ref:'F4',title:'Status',prompt:'Pick a status to filter the list.',list:'"'+STATL.join(',')+'"'});
  const BOX=[[0,2],[3,7],[8,11],[12,nd-1]];
  BOX.forEach(([c0,c1],i)=>{const lab=DECL[i],it=allRows.filter(r=>dName(r)===lab&&statOK(r)),dol=sumD(it);
    span(6,c0,c1,{v:lab,s:'boxT'});
    span(7,c0,c1,{f:`COUNTIFS(${rDec},${C(c0)}6,${rSM},1)`,v:it.length,s:'boxN'});
    span(8,c0,c1,{f:`SUMIFS(${rng('dollars')},${rDec},${C(c0)}6,${rSM},1)`,v:dol,s:'boxS'});
    dash.cf.push({ref:`${C(c0)}6:${C(c1)}8`,rules:[{type:'expression',dxf:5,formula:`$B$4=$${C(c0)}$6`}]})});
  R(6).h=22;R(7).h=40;R(8).h=20;
  /* portfolio snapshot: live formulas over the Master List */
  const K=st.res.kpi,AC=E.accuracyTotal(A.snap()),attn=allRows.filter(r=>r.headline).length;
  span(10,0,nd-1,{v:'Portfolio Snapshot (all items, not filtered by the picks above)',s:'sect'});R(10).h=22;
  const sumP=allRows.reduce((t,r)=>t+r.metrics.onHand*r.price,0);
  const TILE=[
   [[0,1],'Items Tracked',{f:`COUNTA(${rng('sku')})`,v:K.items,s:'boxN'},{f:`COUNTIF(${rAtt},"Yes")&" need attention today"`,v:attn+' need attention today'}],
   [[2,2],'Units On Hand',{f:`SUM(${rng('onhand')})`,v:K.onHand,s:'boxN'},{f:`TEXT(SUMPRODUCT(${rng('onhand')},${rng('price')})/1000000,"$0.00")&"M at unit price"`,v:'$'+(sumP/1e6).toFixed(2)+'M at unit price'}],
   [[3,5],'On Order',{f:`SUM(${rng('transit')})+SUM(${rng('openpo')})`,v:K.transit+K.openPO,s:'boxN'},{f:`TEXT(SUM(${rng('transit')}),"#,##0")&" transit + "&TEXT(SUM(${rng('openpo')}),"#,##0")&" PO"`,v:E.fmtNum(K.transit)+' transit + '+E.fmtNum(K.openPO)+' PO'}],
   [[6,8],'Weeks Of Supply',{f:`(SUM(${rng('onhand')})+SUM(${rng('transit')}))/SUM(${rng('fcstwk')})`,v:K.wos,s:'boxN1'},{f:`COUNTIFS(${rng('wos')},"<4",${rng('onhand')},">=0",${rng('fcstwk')},">0")&" items under 4 weeks, "&COUNTIF(${rng('wos')},">${ovr}")&" over ${ovr}"`,v:K.lowCover+' items under 4 weeks, '+K.highCover+' over '+ovr}],
   [[9,11],'Forecast Accuracy',{f:"'Forecast Accuracy'!C2",v:1-AC.wmape,s:'boxPct'},{f:`"Miss (WMAPE) "&TEXT('Forecast Accuracy'!D2,"0.0%")&", last 13 weeks"`,v:'Miss (WMAPE) '+(AC.wmape*100).toFixed(1)+'%, last 13 weeks'}],
   [[12,nd-1],'Forecast Bias',{f:"'Forecast Accuracy'!E2",v:AC.bias,s:'boxPctS'},{f:`IF('Forecast Accuracy'!E2<0,"Forecast runs low (sales beat it)","Forecast runs high")`,v:AC.bias<0?'Forecast runs low (sales beat it)':'Forecast runs high'}]];
  TILE.forEach(([[c0,c1],t,val_,sub])=>{span(11,c0,c1,{v:t,s:'boxT'});span(12,c0,c1,val_);span(13,c0,c1,Object.assign({s:'boxS'},sub))});
  R(11).h=22;R(12).h=40;R(13).h=20;
  /* totals line + list header */
  const first=17,last=16+N,matched0=allRows.filter(dashMatch);
  span(15,0,2,{v:'Items matching your choices:',s:'label'});put(15,3,{f:`COUNT(${rShow})`,v:run,s:'int'});
  span(15,4,6,{v:'Total $ at stake:',s:'label'});put(15,7,{f:`SUM(${C(DASHK.indexOf('dollars'))}${first}:${C(DASHK.indexOf('dollars'))}${last})`,v:sumD(allRows.filter(dashMatch)),s:'money0'});span(15,8,10,{v:'No decision needed:',s:'label'});put(15,11,{f:'IF($B$4="All decisions",D15-A7-D7-I7-M7,0)',v:matched0.filter(r=>!r.decision).length,s:'int'});R(15).h=24;
  DASHK.forEach((k,c)=>put(16,c,{v:dh(k),s:'head'}));R(16).h=34;
  const STY={status:'ctr',sku:'ctr',product:'txt',onhand:'int',onorder:'int',wos:'dec1',fcstwk:'int',salesvs:'pctS',stockout:'ctr',nextarr:'ctr',peakcover:'ctr',nextpromo:'ctr',gap:'int',dollars:'money0',going:'txt',note:'txt',conf:'ctr'};
  const matched=allRows.filter(dashMatch);
  for(let i=0;i<N;i++){const row=first+i,src=matched[i],hc=`$${C(HC)}${row}`;
    put(row,HC,{f:`IFERROR(MATCH(${i+1},${rShow},0),"")`,v:src?i+1+0:'',s:'txt'});
    DASHK.forEach((k,c)=>{const rg=rng(k);let v=src?val(k,src):'';if(k==='dollars'&&src)v=Math.round(src.dollars>0?src.dollars:0);
      put(row,c,{f:`IF(${hc}="","",IF(INDEX(${rg},${hc})="","",INDEX(${rg},${hc})))`,v:v,s:STY[k]})});
    R(row).h=46}
  // helper cell shows the position in the Master List, not the running number
  matched.forEach((r,i)=>{R(first+i)[HC].v=allRows.indexOf(r)+1});
  const TN=['At risk','Medium','Watch','Overstocked','No risk'];
  dash.cf.push({ref:`A${first}:A${last}`,rules:TN.map((t,i)=>({type:'cellIs',op:'equal',dxf:i,formula:`"${A.tn(t)}"`}))});
  dash.cf.push(...cfList(DASHK,first,last));
  dash.freeze=4;
  const sheets=[dash,mkL(sheetRows(rowsMode),'Today',cols),dataSheet,plan,accSheet,season,promoSheet,
   {name:'Since Yesterday',fit:true,widths:[16,32,11,70,46],rows:[hdr(['Change','Product','SKU','Detail','Note']),...since.map((r,i)=>[...r.map(t=>({v:t,s:'txt'})),{f:`IFERROR(IF(INDEX(${rng('note')},MATCH($C${i+2},${rng('sku')},0))="","",INDEX(${rng('note')},MATCH($C${i+2},${rng('sku')},0))),"")`,v:val('note',A.rowOf(r[2])),s:'txt'}])],freeze:1},
   {name:'Notes',fit:true,widths:[11,30,20,15,20,64,11,9,14],rows:[hdr(['SKU','Product','About','Type','Reason','Note','Who','Date','Accepted Gap (Units)']),...notes.map(r=>r.map((t,i)=>i===8&&t!==''?{v:t,s:'int'}:{v:t,s:'txt'}))],freeze:1},
   {name:'Recipe',fit:true,widths:[30,110],rows:[hdr(['Setting','What It Is Set To']),...rec.map(r=>[{v:r[0],s:'bold'},{v:r[1],s:'txt'}]),[{v:'How The Tabs Connect',s:'bold'},{v:'Notes are typed on the Notes tab. The Master List pulls each item\'s first note by SKU. Dashboard, Today and Promos And Peaks read every column from the Master List by SKU, and 12-Week Plan and Since Yesterday read their Note column from it. Update the Notes tab or the Master List and those tabs follow. Do not delete or move the SKU column.',s:'txt'}],
   [{v:'Dashboard',s:'bold'},{v:'Two dropdown pickers (decision and status) drive the four count boxes and the list. Hidden columns on the Master List sheet and on the Dashboard feed it, so do not delete them.',s:'txt'}]],freeze:1}];
  const blob=MiniXlsx.build(sheets),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='Daily-Planning-Sheet-SAMPLE-'+A.TODAY_ISO+'.xlsx';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
  return sheets;
}
/* ---------- home ---------- */
const ROUTES={
 manual:['Manual Export','You export the files yourself. No connection needed.','You export the data from your source systems yourself (Anaplan and Tableau in this example, or any other source) and put the files in the shared folder. This is also how history gets in: export the past three years of weekly sales once, save them as the reference file, and every daily run compares against it.','Export access in each source, and your company\'s OK to use the data with the AI tool. Nothing to set up.'],
 folder:['Automated Export','Your sources export on a schedule.','Each source exports on a schedule instead of by hand and saves the file into the shared folder. The AI reads the newest files, checks them and saves the finished sheet back there. It works with any approved AI tool and any source that can export a file. Anaplan and Tableau do not save straight into SharePoint on their own, so one small step is needed to move each export into the folder.','A scheduled export in each source, and a way to save it to the shared folder. Set it up yourself if you have the access. If it is blocked on your side, ask IT to set it up.'],
 copilot:['Copilot Connection','Direct connection, if your company allows it.','Microsoft Copilot can reach some sources directly, without a folder. Anaplan names Copilot as a supported client. For Tableau, Microsoft offers a Tableau Cloud connector, but it is built to find and ask about dashboards, and Microsoft does not say it exposes the full numbers. This needs a test on one real dashboard.','Copilot access to each source, and a quick test to see what it can actually read. Turn it on yourself if you can. If it is blocked, ask IT.'],
 chatgpt:['ChatGPT Connection','Direct connection, if your company allows it.','ChatGPT can connect straight to Tableau, because Tableau lists ChatGPT as a supported client. Anaplan does not list ChatGPT, so it needs a custom connector built for it or an outside bridge before ChatGPT can pull from it. Each person signs in with their own account, and a pasted API key does not work.','A connector for each source: Tableau\'s already exists, Anaplan needs a custom connector or an outside bridge. ChatGPT scheduled tasks cannot take file uploads, so a daily unattended run is not confirmed. Set it up yourself if allowed. If it is blocked, ask IT.'],
};
let route='manual';
function miniSheet(){
  const rows=sheetRows('attn').slice(0,3);
  return `<div class="mini-sheet" aria-hidden="true">${rows.map(r=>`<div class="ms-r"><span class="ms-st ${({'At risk':'t-risk','Medium':'t-med','Watch':'t-watch','Overstocked':'t-much'})[r.tier]||'t-ok'}">${esc(val('status',r))}</span><span class="ms-n">${esc(val('product',r))}</span><span class="ms-d">${esc(r.id)}</span></div>`).join('')}</div>`;
}
function renderHome(){
  const r=ROUTES[route];
  $('#v-home').innerHTML=`<div class="page">
  <div class="hero"><h1>Your Daily Planning Sheet, Built By AI From The Data You Already Have</h1>
  <p>Four steps. No code. You explain what you want to the AI in plain words, and an Excel sheet shows up each morning.</p></div>
  <div class="steps">
   <div class="card step s1"><div class="shead"><div class="num">1</div><h2>Connect Your Data</h2></div><p>Pick how your files reach the AI. What each one means is on the right.</p>
    <div class="s1-body"><div class="routes" role="group" aria-label="Ways to connect">${Object.keys(ROUTES).map(k=>`<button class="route" data-route="${k}" aria-pressed="${route===k}">${ROUTES[k][0].replace(' Connection','')}</button>`).join('')}</div>
    <div class="routebox" id="routebox"><h3>${r[0]}</h3><div class="conf" style="margin-bottom:6px">${r[1]}</div><p>${r[2]}</p><p><b>What it needs:</b> ${r[3]}</p></div></div></div>
   <div class="card step"><div class="shead"><div class="num">2</div><h2>Prompt Your AI Agent</h2></div><p>Most of the work happens here.</p>
    <ul class="mini"><li>Show examples of sheets you like, for exact formatting</li><li>Blend documents into one custom format</li><li>Explain how to combine the data and what you want out of it. This is also where the voice of the customer (VOC) comes in.</li></ul>
    <button class="btn pri go" data-nav="custom">See Example Prompts</button></div>
   <div class="card step"><div class="shead"><div class="num">3</div><h2>Get Your Sheet</h2></div><p>A formatted Excel file every morning. It opens on a dashboard of what needs you, with stock counts, weeks of supply, stock-out dates, promo and peak cover, and notes.</p>
    ${miniSheet()}
    <div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri go" data-nav="sheet">See The Sheet</button><button class="btn dl go" id="h-dl">Download Sheet</button></div></div>
   <div class="card step"><div class="shead"><div class="num">4</div><h2>Customize</h2><span class="optl">Optional, anytime</span></div><p>Tell the agent what you are not seeing or want to change. It can always be adjusted.</p>
    <div class="quotes"><p class="quote">“I don't see the supplier lead time.”</p><p class="quote">“Add who owns each item.”</p><p class="quote">“Show me last year's sales for the same weeks.”</p></div><button class="btn go" data-nav="custom">Try It Now</button></div>
  </div>
  <h2 class="sec-h">What Connects To What</h2>
  <p class="pg-sub" style="margin-top:0">Checked against each company's own pages in November 2026. Shown for Anaplan and Tableau, the two sources in this example. Any other source works the same way: if it can export a file, it can go in the shared folder.</p>
  <div class="card mx-wrap"><table class="mx"><thead><tr class="grp"><th></th><th colspan="2">Files Land In The Shared Folder</th><th colspan="2">Direct Connection To The AI</th></tr><tr><th></th><th>Manual Export</th><th>Automated Export</th><th>Copilot</th><th>ChatGPT</th></tr></thead><tbody>
   <tr><th>Anaplan</th><td class="yes"><b>✔ Yes</b><span>You export the file by hand, if your login has export access.</span></td><td class="part"><b>▲ Partly</b><span>Scheduled exports go to Amazon S3, Azure Blob or Google BigQuery, not SharePoint. A step is needed to move the file.</span></td><td class="yes"><b>✔ Yes</b><span>Anaplan's AI Gateway names Microsoft Copilot. Licensing is not stated.</span></td><td class="no"><b>✕ No direct connection</b><span>Needs a custom connector or an outside bridge built first.</span></td></tr>
   <tr><th>Tableau</th><td class="yes"><b>✔ Yes</b><span>You export the view data by hand, if your login has export permission.</span></td><td class="part"><b>▲ Partly</b><span>Subscriptions are email images or PDFs. Data comes through Prep file output or the REST API. A step is needed to move the file.</span></td><td class="part"><b>▲ Partly</b><span>Microsoft's connector finds and answers questions about dashboards. It does not say the full numbers are included. Tableau Cloud only.</span></td><td class="yes"><b>✔ Yes</b><span>Tableau lists ChatGPT as a supported client. Read-only, with a sign-in per person.</span></td></tr>
  </tbody></table></div>
  <div class="card rule" style="margin-top:16px"><b>Which One To Pick?</b><span>Use whichever one works for you today. Manual export needs no setup. Automated export or a direct connection removes the daily manual step. Try setting it up yourself first, and ask IT only if something is blocked.</span></div>
  <p style="margin-top:18px"><button class="btn pri" data-nav="options">See Setup Options And Limits</button></p>
  </div>`;
  const h=$('#v-home');
  $$('[data-route]',h).forEach(b=>b.onclick=()=>{route=b.dataset.route;renderHome()});
  $$('[data-nav]',h).forEach(b=>b.onclick=()=>go(b.dataset.nav));
  $('#h-dl').onclick=downloadXlsx;
}
function renderOptions(){
  $('#v-options').innerHTML=`<div class="page"><div class="pg-h"><h1>Setup Options</h1></div>
  <p class="pg-sub">This is the detail behind Step 1. It lists every way to connect, how to run it each morning, how to bring Anaplan and Tableau together, and why history matters. Checked against each company's own pages in November 2026.</p>
  <h2 class="sec-h" style="margin-top:8px">Ways To Connect</h2>
  <div class="card mx-wrap"><table class="mx"><thead><tr><th>Option</th><th>Anaplan</th><th>Tableau</th><th>Main Limit</th></tr></thead><tbody>
   <tr><th>Manual Export<small>You put the files in the shared folder</small></th><td class="yes"><b>✔ Yes</b><span>You export the file by hand, if your login has export access.</span></td><td class="yes"><b>✔ Yes</b><span>You export the view data by hand, if your login has export permission.</span></td><td>Manual every day. Also how history is loaded.</td></tr>
   <tr><th>Automated Export<small>Sources put the files in the shared folder</small></th><td class="part"><b>▲ Partly</b><span>Exports to S3, Azure Blob or BigQuery. A step moves them to the folder.</span></td><td class="part"><b>▲ Partly</b><span>Prep file output or REST API. A step moves them to the folder.</span></td><td>One step per source to move the file. You or IT sets it up.</td></tr>
   <tr><th>Copilot<small>Direct, no folder needed</small></th><td class="yes"><b>✔ Yes</b><span>Named by Anaplan.</span></td><td class="part"><b>▲ Partly</b><span>Finds and answers about dashboards.</span></td><td>Full Tableau numbers not stated. Licensing for Anaplan not stated.</td></tr>
   <tr><th>ChatGPT<small>Direct, no folder needed</small></th><td class="no"><b>✕ No direct connection</b><span>Needs a custom connector or bridge.</span></td><td class="yes"><b>✔ Yes</b><span>Listed by Tableau.</span></td><td>Scheduled tasks cannot take file uploads.</td></tr>
   <tr><th>Split: ChatGPT And Copilot<small>Both save to the folder, Copilot merges</small></th><td class="no"><b>✕ Not until built</b><span>Anaplan connector must be built first.</span></td><td class="yes"><b>✔ Yes</b><span>Through ChatGPT.</span></td><td>Two tools to approve. Saving files from ChatGPT to the folder is not confirmed.</td></tr>
   <tr><th>Keep Separate<small>One sheet per system</small></th><td class="yes"><b>✔ Yes</b><span>Its own sheet.</span></td><td class="yes"><b>✔ Yes</b><span>Its own sheet.</span></td><td>No flags that need both systems.</td></tr>
  </tbody></table></div>
  <p class="conf" style="margin:8px 0 0">Manual export and automated export are two ways to fill the same shared folder. ChatGPT and Copilot connect to the systems directly and skip the folder.</p>
  <h2 class="sec-h">Ways To Run It Each Morning</h2>
  <p class="pg-sub" style="margin-top:0">Three possible paths, from simplest to most automatic. Each one has limits, listed honestly.</p>
  <div class="paths">
   <div class="card path"><span class="tagp">Simplest</span><h3>A. You Ask Each Morning</h3><p>Open the AI, point it at the files in the shared folder, and ask for the sheet. Takes a minute.</p>
    <p class="lim"><b>Limits:</b> Someone has to do it every day. Wording can change the result a little, so save a standard request.</p></div>
   <div class="card path"><span class="tagp">Same Every Day</span><h3>B. Scheduled, Same Sheet Every Day</h3><p>A scheduled flow in Microsoft's cloud copies a template, loads the files, applies the colors and flags, and saves the sheet in the folder. No prompt, and your computer can be off.</p>
    <p class="lim"><b>Limits:</b> Needs permission to run the flow, plus a one-time build and test. Ask IT if it is blocked. Each Microsoft piece is documented, but the full chain still needs a pilot. Changes mean updating the script.</p></div>
   <div class="card path"><span class="tagp">Most Flexible</span><h3>C. A Scheduled AI Agent</h3><p>An AI agent runs on a schedule and uses judgment, such as writing the morning summary.</p>
    <p class="lim"><b>Limits:</b> Runs use credits, use the builder's sign-in, and admins can block them. Output can vary day to day, and building a formatted Excel file this way is not confirmed.</p></div>
  </div>
  <div class="card rule"><b>Built Once, Then Repeated</b><span><b>1.</b> Write down the files and rules</span><span class="arrow">→</span><span><b>2.</b> AI builds it with real files</span><span class="arrow">→</span><span><b>3.</b> Test against known items</span><span class="arrow">→</span><span><b>4.</b> Save it and schedule it</span></div>
  <h2 class="sec-h">Ways To Get Two Sources Into One Sheet</h2>
  <p class="pg-sub" style="margin-top:0">Anaplan and Tableau are the example here. Any two sources work the same way. Merged or separate, there are several paths, and which one is open depends on what your company allows.</p>
  <div class="paths four">
   <div class="card path"><span class="tagp">One Tool</span><h3>1. Copilot Reaches Both</h3><p>Copilot connects to Anaplan and to Tableau and builds one merged sheet.</p>
    <p class="lim"><b>Limits:</b> Anaplan names Copilot as a client. Microsoft's Tableau connector finds and answers questions about dashboards, and Microsoft does not say it includes the full numbers. Needs a test.</p></div>
   <div class="card path"><span class="tagp">Two Tools</span><h3>2. Split Pulls, Then Merge</h3><p>ChatGPT pulls Tableau, which it supports. Anaplan needs a custom connector or an outside bridge before ChatGPT can pull it. Both results go to the shared folder, and Copilot merges them into the sheet.</p>
    <p class="lim"><b>Limits:</b> Two tools to approve. Building the Anaplan connector is real work. Saving files from ChatGPT into the folder is not confirmed.</p></div>
   <div class="card path"><span class="tagp">Any Tool</span><h3>3. Exports To A Shared Folder</h3><p>Both systems put their files in the shared folder, by hand or on a schedule, and one AI merges them.</p>
    <p class="lim"><b>Limits:</b> A step moves each export into the folder, set up by you or IT. Tableau subscriptions are email images or PDFs, so data comes through Prep or the API.</p></div>
   <div class="card path"><span class="tagp">No Merge</span><h3>4. Keep Them Separate</h3><p>One sheet from Anaplan and one from Tableau, reviewed side by side.</p>
    <p class="lim"><b>Limits:</b> No cross-system flags, such as sales above forecast with low stock. A planner joins them by hand.</p></div>
  </div>
  <div class="card hist"><h3>Why History Is Needed For Accurate Reports</h3>
   <p>Several flags only work with past sales by week. Without history, the sheet can show today but cannot judge it.</p>
   <ul><li><b>Short vs last year:</b> compares supply to what the same weeks needed last year.</li><li><b>Promo repeat:</b> measures how much last year's promo lifted sales.</li><li><b>New item forecast:</b> compares to how similar past launches sold.</li><li><b>Stock-outs:</b> removes weeks last year when sales were capped by empty shelves.</li></ul>
   <p class="conf">The demo uses three years of weekly history. With no connection, export it by hand once, save it as the reference file in the shared folder, and refresh it when needed. Every daily run reads it.</p></div>
  <h2 class="sec-h">Who Does What</h2><p class="pg-sub" style="margin-top:0">Three roles, each with a clear job.</p>
  <div class="who"><div class="card"><h3>You</h3><p>Say what you need and what you are not seeing. Decide what to do about each flagged item.</p></div>
   <div class="card"><h3>The AI</h3><p>Reads the files, checks them, builds the sheet, writes the morning summary, and keeps your preferences.</p></div>
   <div class="card"><h3>IT, If Something Is Blocked</h3><p>We do not know yet what is blocked. Try it yourself first. If your access is blocked, IT sets it up or opens it up.</p></div></div>
  <details class="card it"><summary>If You Need IT: What Each System Can Do</summary>
   <p><b>Automated export route</b></p><ul>
    <li><b>Anaplan:</b> Its scheduled integrations (CloudWorks) export to Amazon S3, Azure Blob or Google BigQuery. SharePoint and OneDrive are not listed, so a step is needed to move the file.</li>
    <li><b>Tableau:</b> Scheduled subscriptions are email only, as a PNG image or PDF, not a data file. Other options are Tableau Prep flows that output files, or the REST API, which returns summary-level view data as CSV to people with export permission.</li>
    <li><b>Excel:</b> The Power Automate Excel connector cannot create a workbook or format one directly. It can add rows to a copy of a template and run Office Scripts.</li></ul>
   <p><b>ChatGPT route</b></p><ul>
    <li><b>Tableau:</b> Tableau's own documentation lists ChatGPT as a supported client of its connector. Sign-in is per person, and the connector is read-only.</li>
    <li><b>Anaplan:</b> Anaplan's AI Gateway does not name ChatGPT. It needs a custom connector or an outside bridge.</li>
    <li><b>Limits:</b> ChatGPT connectors need a hosted server and a sign-in per person. Scheduled tasks allow 10 active tasks and no file uploads, so unattended daily runs are not confirmed.</li></ul>
   <p><b>Copilot route</b></p><ul>
    <li><b>Anaplan:</b> The AI Gateway names Microsoft Copilot as a client. Its page is inconsistent on read-only versus write-back, and does not state licensing.</li>
    <li><b>Tableau:</b> Microsoft's Tableau Cloud connector indexes published sheets and details such as name, project, workbook and tags. It needs Tableau Cloud (not Server), a Microsoft 365 AI admin and a Tableau site admin. Microsoft's pages do not say whether the numbers behind a dashboard are included.</li>
    <li><b>Daily runs:</b> Copilot Studio agents can run on a repeating schedule. Runs use Copilot Credits, use the maker's sign-in, and admins can block them.</li>
    <li><b>Not confirmed:</b> That Copilot can produce a fully formatted Excel file on its own. This is the first thing to test in a pilot.</li></ul>
   <p class="conf">Last checked November 2026 from the vendors' own pages. Confirm with IT before relying on any of this.</p>
   <p class="conf">Sources: <a href="https://help.anaplan.com/cloudworks-96f951fe-52fc-45a3-b6cb-16b7fe38e1aa" target="_blank" rel="noopener">Anaplan CloudWorks</a> · <a href="https://help.tableau.com/current/online/en-us/subscribe_user.htm" target="_blank" rel="noopener">Tableau subscriptions</a> · <a href="https://help.tableau.com/current/online/en-us/prep_conductor_schedule_flow_task.htm" target="_blank" rel="noopener">Tableau Prep flows</a> · <a href="https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/" target="_blank" rel="noopener">Excel connector</a> · <a href="https://www.anaplan.com/platform/anaplan-ai-gateway/" target="_blank" rel="noopener">Anaplan AI Gateway</a> · <a href="https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/tableau-cloud-deployment" target="_blank" rel="noopener">Tableau connector for Copilot</a> · <a href="https://learn.microsoft.com/microsoft-copilot-studio/authoring-triggers-about" target="_blank" rel="noopener">Copilot Studio triggers</a></p></details>
  <details class="card it"><summary>Extras</summary><p class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="x-load">Replay Today's Data Check</button><button class="btn" id="x-flow">Data Flow Map</button><button class="btn" id="x-email">Daily Email Preview</button><button class="btn" id="x-set">Advanced Thresholds</button><button class="btn" id="x-csv">Download CSV</button><button class="btn" id="x-reset">Reset Demo</button></p></details>
  </div>`;
  const o=$('#v-options');
  $$('[data-nav]',o).forEach(b=>b.onclick=()=>go(b.dataset.nav));
  $('#x-load').onclick=()=>A.openLoad(true);$('#x-flow').onclick=()=>A.openFlow();$('#x-email').onclick=A.openEmail;
  $('#x-set').onclick=A.openSettings;$('#x-csv').onclick=A.downloadCsv;$('#x-reset').onclick=()=>{cols=DEFAULT.slice();saveCols();msgs=[hello()];rowsMode='attn';A.reset();renderAll()};
}
/* ---------- customize ---------- */
const hello=()=>({w:'ai',t:'Hi. Tell me what you are not seeing in your daily sheet, and I will change it. In this demo, tap one of the examples below or type your own.'});
let msgs=[hello()];
const SUG=['I need the supplier lead time.','Show me last year\'s sales for the same weeks.','Add who owns each item.','Add the ABC class.','Add the peak months and promo status.','Add forecast accuracy for each item.','Add a column for my notes.','Remove confidence.','Show all items, not just the ones that need attention.'];
const PAT=[['peakcover',/peak cover|thin (cover|stock)|cover into (the )?peak|enough (stock )?for (the )?peak/],['peak',/peak|seasonal|spike|busy (month|season)/],['lift',/lift|promo (impact|effect)/],['nextpromo',/next promo|when .*promo|promo (date|week|calendar)/],['promo',/promo/],['abc',/\babc\b/],['acc',/accuracy|forecast (error|miss)|\bbias\b/],['transit',/in transit|on the water|inbound/],['openpo',/open po|purchase order|\bpos?\b(?! (data|file))/],['nextarr',/next arrival|when .*arriv|\beta\b|delivery date/],['orderby',/order by|when (do i|should i) order/],['stockout',/stock.?out|run out|when .*(out of stock|run out)/],['salesvs',/sales vs|vs forecast|forecast vs|actual vs/],['fcstwk',/forecast (per|a|each) week|weekly forecast|forecast units/],['sales4',/last (3|three) weeks|recent sales/],['ship',/shipped|sell.?in|sell.?through|channel/],['price',/unit price|price|cost/],['gap',/unit gap|how many (units )?short|units short/],['wos',/weeks? of (stock|supply|cover)|how many weeks|wos|\bcover\b/],['ly',/last year|same weeks/],['lt',/lead ?time/],['supplier',/supplier|vendor/],['onhand',/on hand|inventory|how much stock|stock (we have|on)/],['onorder',/on order/],['supply',/total supply|supply units/],['owner',/owner|who owns|responsible|assigned/],['note',/\bnotes?\b|comment/],['conf',/confidence|how sure/],['dollars',/dollar|\$|money|value/],['sub',/subcategor|category|\bline\b/],['todo',/what to do|next step|action/]];
const RM=/remove|hide|drop|don'?t need|do not need|get rid|take out|without|delete/;
function reply(text){
  const t=text.toLowerCase();
  if(/show all|all items|every (item|sku)|not just/.test(t)){rowsMode='all';return 'Done. The sheet now shows all items, not just the ones that need attention. Your recipe is updated.'}
  if(/only.*attention|needs? attention/.test(t)&&!/add|column/.test(t)){rowsMode='attn';return 'Done. The sheet shows only the items that need attention.'}
  const hit=PAT.find(p=>p[1].test(t));
  if(hit){const k=hit[0],C=COLS[k],has=cols.includes(k);
    if(RM.test(t)){if(C.core)return `I would keep "${C.h}" because the sheet is hard to read without it. I can hide any of the other columns.`;
      if(!has)return `"${C.h}" is not in your sheet right now.`;cols=cols.filter(x=>x!==k);saveCols();return `Done. I removed "${C.h}" from the sheet and from your recipe.`}
    if(has)return `"${C.h}" is already in your sheet.`;
    cols.push(k);saveCols();
    return `Done. I added "${C.h}" ${C.src||''}. I saved it in your recipe, so tomorrow's sheet has it too. <a href="#" data-see>See it in the sheet</a>`}
  return 'I only know a few requests in this demo. In the real chat you would explain it in your own words, and the AI works out which data to use. If the data is not in your files, it asks you where to find it or what file to add.';
}
function renderCustom(){
  $('#v-custom').innerHTML=`<div class="page"><div class="pg-h"><h1>Customize</h1></div>
  <p class="pg-sub">You shape the sheet by talking to the AI, not by editing settings. Start with a full prompt about what you want, then adjust anytime by saying what you are not seeing. It remembers for next time.</p>
  <div class="chat-wrap"><div class="leftcol"><div class="card chat"><div class="chat-h"><span>Chat With The AI</span><span class="conf">Demo only: simulated replies</span></div>
   <div class="msgs" id="msgs" aria-live="polite">${msgs.map(m=>`<div class="msg ${m.w}">${m.w==='you'?esc(m.t):m.t}</div>`).join('')}</div>
   <div class="sug">${SUG.map((s,i)=>`<button class="chip" data-sug="${i}">${esc(s)}</button>`).join('')}</div>
   <form class="chat-in" id="chat-f"><input type="text" id="chat-t" placeholder="Type what you are not seeing" aria-label="Message"><button class="btn pri" type="submit">Send</button></form></div>
   <div class="card recipe" style="margin-top:14px"><h3>Example Prompts To Start With</h3><ul class="mini"><li><b>Match a format:</b> “Here are two sheets I like. Make the daily sheet look exactly like the first, with the color rules from the second.”</li><li><b>Blend documents:</b> “Combine the layout of this report with the columns from that one.”</li><li><b>Combine data:</b> “Join the Anaplan forecast and the Tableau sales by SKU, and flag any item where sales are above forecast and stock is low.”</li></ul></div></div>
  <div><div class="card recipe"><h3>Your Recipe</h3><p class="conf" style="margin:0 0 8px">The AI's memory of how your sheet is built. Scheduled runs read it every morning.</p>
   <ol>${cols.map(k=>`<li>${esc(COLS[k].h)}</li>`).join('')}</ol>
   <p style="margin:10px 0 0"><b>Rows:</b> ${rowsMode==='all'?'All items':'Items that need attention'}</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri" data-nav="sheet">Preview The Sheet</button><button class="btn" id="c-reset">Reset Columns</button></div></div>
   <div class="card recipe" style="margin-top:14px"><h3>How This Works In Real Life</h3><ol><li>You describe what you want, or what you are not seeing, in your own words.</li><li>The AI finds the field in your data, or asks you where it lives.</li><li>It updates the recipe and rebuilds the sheet.</li><li>Tomorrow's scheduled run uses the saved recipe.</li></ol>
   <p style="margin:10px 0 0"><button class="btn sm" id="c-adv">Advanced Thresholds</button></p></div></div></div></div>`;
  const v=$('#v-custom'),box=$('#msgs');box.scrollTop=box.scrollHeight;
  const send=t=>{if(!t.trim())return;msgs.push({w:'you',t});msgs.push({w:'ai',t:reply(t)});renderCustom();renderSheet()};
  $$('[data-sug]',v).forEach(b=>b.onclick=()=>send(SUG[b.dataset.sug]));
  $('#chat-f').onsubmit=e=>{e.preventDefault();send($('#chat-t').value)};
  $$('[data-see]',v).forEach(a=>a.onclick=e=>{e.preventDefault();go('sheet')});
  $$('[data-nav]',v).forEach(b=>b.onclick=()=>go(b.dataset.nav));
  $('#c-reset').onclick=()=>{cols=DEFAULT.slice();rowsMode='attn';saveCols();msgs=[hello()];renderCustom();renderSheet()};
  $('#c-adv').onclick=A.openSettings;
}
/* ---------- routing ---------- */
const VIEWS=['home','sheet','custom','visual','options'];
function go(v){
  if(!VIEWS.includes(v))v='home';A.closeAll();
  VIEWS.forEach(x=>$('#v-'+x).classList.toggle('on',x===v));
  $$('.nav button').forEach(b=>{if(b.dataset.nav===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(v==='sheet')renderSheet();if(v==='custom')renderCustom();if(v==='visual')A.renderApp();
  if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);window.scrollTo(0,0);
  const h=$('header.top');if(h)document.documentElement.style.setProperty('--hh',h.offsetHeight+'px');
}
function renderAll(){renderHome();renderOptions();renderSheet();renderCustom();A.renderApp()}
$$('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.nav));
addEventListener('hashchange',()=>go(location.hash.slice(1)));
renderAll();go(location.hash.slice(1)||'home');
window.__shell={go,downloadXlsx,cols:()=>cols,reply,COLS};
})();
