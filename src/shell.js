(function(){
'use strict';
const A=window.__app,E=A.E,D=A.D,st=A.st,esc=A.esc,money=A.money;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const CK='dpa.cols.v5';
/* ---------- columns ---------- */
const TODO={order_more:'Place or expedite an order',too_much:'Pause new orders and review promos',forecast_off:'Review the forecast',check_data:'Fix the source data first'};
const TS={'At risk':'t_risk','Watch':'t_watch','Overstocked':'t_much','No risk':'t_ok'};
const TCLASS={'At risk':'t-risk','Watch':'t-watch','Overstocked':'t-much','No risk':'t-ok'};
const R3=x=>Math.round(x*1000)/1000;
const COLS={
 filest:{h:'File Status',w:13,src:'calculated by the scheduled run: New Today when the item is in the latest files but was not in the previous run\'s'},
 peaklift:{h:'Peak Lift (x)',w:10,num:'x2',src:'calculated: forecast per week in the peak weeks divided by a normal week (the middle week of the next 12)'},
 stocklp:{h:'Stock Last Peak',w:20,src:'calculated from last year\'s weekly stock: In stock, or how many weeks of last year\'s peak the item was out of stock (so last year\'s sales understate demand)'},
 suggest:{h:'AI Recommended Qty (Stock Gap)',w:13,num:'int',src:'calculated by the AI: the units to add when the check says order more (stock runs out, or the order is late or missing), rounded up to 10'},
 ovr:{h:'Peak Lift Override',w:11,num:'x2',src:'typed in the Master List: your own peak lift, for example when the item was out of stock last year. Leave blank to use the calculated lift'},
 ovrwhy:{h:'Override Reason',w:34,wide:1,src:'typed in the Master List, next to the override'},
 used:{h:'Peak Lift Used',w:10,num:'x2',src:'formula: your override when you typed one, otherwise the calculated lift'},
 bump:{h:'Peak Bump (Units)',w:11,num:'int',src:'formula: the extra units the peak weeks sell above a normal week, using the lift in Peak Lift Used (so it moves when you type an override)'},
 peakgap:{h:'Units Short Of Peak Cover',w:12,num:'int',src:'calculated: units needed to keep 2 weeks of peak demand in stock through the peak weeks, after the stock and orders already on the way'},
 addqty:{h:'AI Recommended Add (Peak + Promo)',w:15,num:'int',src:'calculated by the AI: the extra units to order so stock stays above 2 weeks of peak demand through the peak weeks, counting this year\'s confirmed promo and less what the Stock Gap qty already covers, rounded up to 10. 0 means stock and orders on the way already cover it'},
 addwhy:{h:'AI Recommendation Why',w:60,wide:1,src:'calculated by the AI: the reason in words (how far stock dips below peak cover, what the promo adds, and what is already in the stock-gap suggestion)'},
 ordovr:{h:'AI Recommended Qty (Total)',w:16,num:'int',src:'formula: the AI\'s Stock Gap qty plus its Peak And Promo add, recalculated with any Peak Lift Override you typed (the override changes the peak units and the promo units inside the peak), rounded up to 10. With no override it is the AI\'s own total. Compare it with Order Qty To Place'},
 plan:{h:'Order Qty To Place',w:12,num:'int',src:'typed in the Master List: the new order you decide to place now, ready to copy into the planning system. It is not the orders already placed (those are In Transit and Open PO)'},
 cmpai:{h:'Variance Vs AI Qty',w:12,num:'intS',src:'formula: Order Qty To Place minus the AI Recommended Qty (Total). Blank until you type a quantity. Negative means you are ordering less than the AI suggests'},
 cmptxt:{h:'Your Qty Vs AI',w:17,src:'formula: Near AI Qty when your Order Qty To Place is within 10% of the AI total (or 10 units), otherwise Below AI or Above AI Qty by how many units. No qty typed yet shows when the AI suggests an order and you have not typed one'},
 needby:{h:'Needed By',w:11,src:'typed in the Master List: The date the units are needed'},
 status:{h:'Status',w:13,core:1},sku:{h:'SKU',w:11,core:1},product:{h:'Product',w:32,core:1},sub:{h:'Line',w:17},abc:{h:'ABC Class',w:9,src:'from the Planning system: A items make up the first 80% of 12-week forecast sales value, B the next 15%, C the last 5%'},
 supplier:{h:'Supplier',w:18,src:'from the Shared file'},
 onhand:{h:'On Hand (Units)',w:11,num:'int',src:'from the Planning system: units in the warehouse today'},
 transit:{h:'In Transit (Units)',w:11,num:'int',src:'from the Planning system: units on the way, with a delivery date'},
 prodq:{h:'In Production (Units)',w:12,num:'int',src:'from the Planning system: units ordered that the supplier is still making'},
 orgq:{h:'At Origin (Units)',w:11,num:'int',src:'from the Planning system: units finished and waiting at the origin warehouse to ship'},
 readyd:{h:'Next Ready Date',w:12,src:'from the Planning system: the supplier\'s updated date when the soonest in-production order is ready'},
 etachg:{h:'ETA Change (Days)',w:11,num:'intS',src:'calculated: how many days later (+) or earlier (-) the soonest arrival is than first promised'},
 ptime:{h:'Production Time (Days)',w:12,num:'dec1',src:'calculated from the supplier\'s past orders: typical days to make an order'},
 ttq:{h:'Transit Quoted (Days)',w:11,num:'int',src:'from the Shared file: the supplier\'s or forwarder\'s quoted transit days'},
 tta:{h:'Transit Actual (Days)',w:11,num:'dec1',src:'calculated from past shipments: typical transit days actually taken'},
 openpo:{h:'Open PO (Units)',w:11,num:'int',src:'from the Planning system: units ordered from the supplier that have not shipped yet'},
 onorder:{h:'On Order (Units)',w:11,num:'int',src:'from the Planning system: in transit plus open orders'},
 supply:{h:'Total Supply (Units)',w:12,num:'int',src:'from the Planning system: on hand, in transit and open orders added together'},
 fcstwk:{h:'System Forecast Per Week (Units)',w:13,num:'int',src:'from the Planning system: the average of the next 12 weekly forecasts. This is the original forecast the AI compares itself to'},
 aifcst:{h:'AI Forecast Per Week (Units)',w:14,num:'int',src:'calculated by the AI: the System Forecast plus the units a confirmed promo adds (last year\'s promo lift applied to this year\'s promo weeks), spread over the 12 weeks. Equal to the System Forecast when there is no confirmed promo'},
 sales4:{h:'Sales, Last 3 Weeks (Units)',w:12,num:'int',src:'from the Reporting tool: units sold over the last 3 weeks'},
 salesvs:{h:'Sales vs Forecast (Last 3 Weeks)',w:13,num:'pctS',src:'from the Reporting tool and the Planning system: last 3 weeks of sales compared with the forecast for the same weeks'},
 ly:{h:'Same Weeks Last Year (Units)',w:16,num:'int',src:'from the Reporting tool: units sold in the same weeks last year'},
 wos:{h:'Weeks Of Supply',w:11,num:'dec1',src:'from the Planning system: stock on hand plus in transit, divided by the average weekly forecast'},
 lt:{h:'Lead Time (Weeks)',w:11,num:'dec1',src:'from the Shared file: the supplier\'s quoted lead time'},
 stockout:{h:'Stock-Out Week',w:13,src:'calculated: The first week stock goes below zero, using quoted delivery dates'},
 orderby:{h:'Order By',w:11,src:'calculated: the stock-out week minus the supplier lead time'},
 nextarr:{h:'Next Arrival Date',w:13,src:'from the Planning system: the date of the soonest delivery (in transit or on a PO). Real dates, so you can filter and sort them'},
 nextarrq:{h:'Next Arrival Qty',w:12,num:'int',src:'from the Planning system: the units in that soonest delivery'},
 arr2:{h:'2nd Arrival Date',w:13,src:'from the Planning system: the date of the next delivery after the soonest one'},
 arr2q:{h:'2nd Arrival Qty',w:12,num:'int',src:'from the Planning system: the units in that second delivery'},
 aifdiff:{h:'AI Vs System Forecast (Units Per Week)',w:15,num:'intS',src:'calculated: AI Forecast Per Week minus System Forecast Per Week. Positive means the AI expects more than the system, usually from a confirmed promo'},
 gap:{h:'Unit Gap',w:11,num:'int',src:'calculated: units short, units in excess, or units the forecast is off by'},
 gaptype:{h:'Gap Type',w:12,src:'calculated: whether the unit gap is short, over, or a forecast miss'},
 dollars:{h:'$ At Stake',w:12,num:'money',src:'calculated: unit gap times unit price'},
 price:{h:'Unit Price',w:10,num:'money2',src:'from the Shared file'},
 acc:{h:'Forecast Accuracy (13 Wks)',w:13,num:'pct',src:'calculated: one minus the forecast miss over the last 13 weeks'},
 bias:{h:'Forecast Bias (13 Wks)',w:13,num:'pctS',src:'calculated: whether the forecast ran high (+) or low (-) over the last 13 weeks'},
 ship:{h:'Shipped ÷ Sold (8 Wks)',w:12,num:'x2',src:'from the Reporting tool: shipments to retailers divided by retailer sales over 8 weeks'},
 peak:{h:'Peak Months',w:14,src:'calculated from the last two years of sales: months that sell at least 1.5x a normal month (the middle month of the year)'},
 peakwk:{h:'Peak Weeks (Next 12)',w:20,src:'calculated: the weeks in the next 12 that sold at least 1.5x a normal week last year'},
 peakcover:{h:'Peak Cover',w:11,src:'calculated: whether projected stock stays above 2 weeks of peak demand through the peak weeks (OK, Thin or Short)'},
 promo:{h:'Promo Status',w:18,src:'from the Shared file (the promo calendar) and last year\'s tagged promo weeks'},
 nextpromo:{h:'This Year Promo (Weeks Starting)',w:26,src:'from the Shared file (the promo calendar): every promo week this year, grouped, with confirmed or not confirmed'},
 lypromo:{h:'Last Year Promo (Weeks Starting)',w:22,src:'from the Reporting tool: the weeks last year\'s promo ran, moved to the same calendar weeks this year'},
 lyunits:{h:'Last Promo Units Sold',w:12,num:'int',src:'from the Reporting tool: total units sold in last year\'s promo weeks'},
 lift:{h:'Last Promo Lift (x)',w:11,num:'x2',src:'calculated: how much more last year\'s promo weeks sold than the normal weeks around them, after taking out the season (1.50x means 50% more)'},
 overlap:{h:'Promo And Peak Overlap',w:19,src:'calculated: whether this year\'s promo weeks fall inside the peak weeks, so you know the promo lands on top of a busy season'},
 promoext:{h:'Promo Extra Units',w:11,num:'int',src:'formula: units this year\'s confirmed promo adds on top of the forecast (forecast in the promo weeks times the last promo lift). For promo weeks inside the peak it moves with Peak Lift Used, so a peak override changes it. It is 0 when there is no confirmed promo, or no last-year promo to measure a lift from (status New this year), so for a new promo add your own estimate to the order'},
 totlift:{h:'Peak + Promo Units Above A Normal Week',w:15,num:'int',src:'formula: Peak Bump plus Promo Extra Units. The two are added in units, never averaged'},
 decision:{h:'Decision',w:21,src:'calculated: the action the item needs (order more, too much stock, forecast looks off, check the data)'},
 attn:{h:'Needs Attention',w:11,src:'calculated: Yes when any check flagged the item today'},
 notedate:{h:'Note Date',w:11,src:'typed in the Master List next to the note'},
 going:{h:'What Is Going On',w:62,core:1,wide:1},todo:{h:'What To Do',w:34},conf:{h:'Confidence',w:12},
 note:{h:'Note',w:48,wide:1,src:'typed in the Master List, one note per item'}};
const DEFAULT=['status','sku','product','decision','going','onhand','prodq','orgq','transit','nextarr','nextarrq','etachg','wos','stockout','orderby','fcstwk','aifcst','aifdiff','salesvs','peakcover','nextpromo','gap','dollars','suggest','addqty','ordovr','plan','cmptxt','note','conf'];
const MASTER='Master List (Work Here)',INK=['ovr','ovrwhy','plan','needby','note','notedate'],MINCOLS=12;
const FULLK=['status','sku','product','filest','sub','decision','attn','abc','supplier','onhand','prodq','orgq','transit','openpo','onorder','supply','fcstwk','aifcst','aifdiff','sales4','salesvs','ly','peak','peakwk','peaklift','ovr','ovrwhy','used','bump','promo','nextpromo','lypromo','lyunits','lift','overlap','promoext','totlift','stocklp','peakcover','peakgap','wos','lt','ptime','ttq','tta','stockout','orderby','readyd','nextarr','nextarrq','etachg','arr2','arr2q','gap','gaptype','dollars','price','acc','bias','ship','going','todo','conf','suggest','addqty','addwhy','ordovr','plan','cmpai','cmptxt','needby','note','notedate'];
const DH={onhand:'On Hand',prodq:'In Production',orgq:'At Origin',etachg:'ETA Change',readyd:'Next Ready Date',transit:'In Transit',openpo:'Open PO',orderby:'Order By',onorder:'On Order',wos:'Wks Of Supply',salesvs:'Sales vs Fcst (3 Wk)',stockout:'Stock-Out Week',nextarr:'Next Arrival Date',nextarrq:'Next Arrival Qty',peakcover:'Peak Cover',nextpromo:'Next Promo',gap:'Unit Gap',dollars:'$ At Stake',going:'What Is Going On',note:'Note'};
const dh=k=>DH[k]||COLS[k].h;
let cols=DEFAULT.slice();
const saveCols=()=>{};
let rowsMode='attn',tab='dash';
const PLK=new Set(['prodq','orgq','readyd','etachg','ptime','ttq','tta','nextarrq','arr2','arr2q','aifdiff','filest','suggest','addqty','addwhy','aifcst','aifdiff','cmpai','cmptxt','ovr','ovrwhy','plan','needby','used','ordovr','bump','peakgap','peaklift','stocklp','onhand','transit','openpo','onorder','supply','fcstwk','sales4','salesvs','wos','stockout','orderby','nextarr','nextarrq','arr2','arr2q','gap','gaptype','dollars','price','acc','bias','ship','abc','peak','peakwk','peakcover','promo','nextpromo','lypromo','lyunits','lift','overlap','promoext','totlift']);
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
   case 'supplier':return sk?sk.supplier:'';
   case 'note':return n?n.line:'';case 'notedate':return n?n.date:'';
   case 'decision':return r.decision?A.DEC[r.decision][0]:'No decision needed';case 'attn':return r.headline?'Yes':'No';}
  return '';
}
function sheetRows(mode){
  return st.res.rows.filter(r=>mode==='all'||r.headline).sort((a,b)=>E.TIER_ORDER[a.tier]-E.TIER_ORDER[b.tier]||b.dollars-a.dollars);
}
/* ---------- dashboard ---------- */
const ALLD='All decisions',DECKEYS=Object.keys(A.DEC),DECL=DECKEYS.map(k=>A.DEC[k][0]);
const CONSTAT=()=>['Needs attention',...A.TIERS.map(t=>A.tn(t)),'All statuses'];
const dName=r=>r.decision?A.DEC[r.decision][0]:'';
let dashDec=ALLD,dashStat='Needs attention';
const statOK=r=>dashStat==='All statuses'||(dashStat==='Needs attention'&&!!r.headline)||A.tn(r.tier)===dashStat;
const dashMatch=r=>(dashDec===ALLD||dName(r)===dashDec)&&statOK(r);
const sumD=it=>it.reduce((t,r)=>t+(r.dollars>0?Math.round(r.dollars):0),0);
const colorKey=()=>`<div class="ckey"><b>Color key:</b> <span class="k ok">Green is good (No risk)</span> <span class="k warn">Orange is Watch: The planner should check it</span> <span class="k bad">Red is a problem or needs action</span> <span class="k nw">Blue is Overstocked, or too many weeks of supply</span> <span class="k ai">Teal is the AI\'s recommendation</span> <span class="k inp">Light yellow is where you type</span></div>`;
function dashHtml(){
  const all=sheetRows('all'),rows=all.filter(dashMatch);
  const boxes=DECKEYS.map((k,i)=>{const lab=DECL[i],it=all.filter(r=>dName(r)===lab&&statOK(r));
    return `<div class="dbox${dashDec===lab?' sel':''}"><div class="dbt">${esc(lab)}</div><div class="dbn">${it.length}</div><div class="dbs">${money(sumD(it))} at stake</div></div>`}).join('');
  const head=cols.map(k=>`<th class="${COLS[k].num?'money':''}${A.AIK.has(k)?' ai':''}">${esc(dh(k))}</th>`).join('');
  const body=rows.map(r=>`<tr data-open="${r.id}" tabindex="0">${cols.map(k=>{const v=val(k,r),C=COLS[k];
    if(k==='status')return `<td class="st ${TCLASS[r.tier]||'t-ok'}">${esc(v)}</td>`;
    if(C.num)return `<td class="money ${A.pcls(k,v)}">${esc(A.fv(k,v))}</td>`;
    return `<td class="${k==='going'?'wide':(k==='sku'||k==='conf'||k==='nextarr'||k==='arr2'?'c':'')} ${A.pcls(k,v)}">${esc(String(v))}</td>`}).join('')}</tr>`).join('');
  return `<div class="dash"><h3>Planning Dashboard (Sample Data), ${esc(A.TODAY_SHORT)}</h3>
   <p class="dnote">Decision is the action an item needs. Status is how urgent it is, and "Needs attention" means anything flagged. Pick one of each in the two yellow cells and the boxes and list rebuild. To act on what you see, go to the Master List (Work Here) and filter to the same choices. This is the same dashboard that opens first in the downloaded sheet.</p>
   ${colorKey()}
   <div class="dpick"><label>Decision <select id="dd">${[ALLD,...DECL].map(o=>`<option ${o===dashDec?'selected':''}>${esc(o)}</option>`).join('')}</select></label>
   <label>Status <select id="ds">${CONSTAT().map(o=>`<option ${o===dashStat?'selected':''}>${esc(o)}</option>`).join('')}</select></label></div>
   <div class="dboxes">${boxes}</div>
   <div class="dsec">Portfolio Snapshot <span>All items, not filtered by the picks above</span></div>
   <div class="snap dsnap">${A.snapTiles().map(([t,n,sub])=>`<div class="snapt"><div class="t">${t}</div><div class="n">${n}</div><div class="d">${esc(sub)}</div></div>`).join('')}</div>
   <div class="dsec">AI Recommendations And Your Orders <span>All items, not filtered by the picks above</span></div>
   <div class="snap dsnap">${A.aiTiles().map(([t,n,sub])=>`<div class="snapt ai"><div class="t">${t}</div><div class="n">${n}</div><div class="d">${esc(sub)}</div></div>`).join('')}</div>
   <div class="dcount">Items matching your choices: <b>${rows.length}</b><span class="dsep">·</span>Total $ at stake: <b>${money(sumD(rows))}</b><span class="dsep">·</span>No decision needed: <b>${rows.filter(r=>!r.decision).length}</b></div>
   <div class="xl-scroll"><table class="xt dtab"><thead><tr class="heads">${head}</tr></thead><tbody>${body||`<tr><td colspan="${cols.length}">Nothing matches these choices.</td></tr>`}</tbody></table></div>
   <p class="dfoot">$ At Stake is the unit gap times the unit price. Unit gap is units short for Order more, units over for Too much stock, and units the forecast is off by for Forecast looks off. Red weeks of supply is under 4, blue is over ${st.settings.overstockWOS}. Orange sales vs forecast is 15% or more either way.</p></div>`;
}
/* ---------- notes / recipe data ---------- */
function noteItems(){
  return Object.values(E.activeNotes(st.notes)).sort((a,b)=>a.id-b.id).map(n=>{const r=A.rowOf(n.sku);return [n.sku,r?r.name:'',E.NOTE_LABEL[n.flag]||n.flag,n.kind==='comment'?'Comment':'Accepted risk',n.reason,n.text,n.who,n.date,n.kind==='comment'?'':Math.round(n.acceptedGap||0)]});
}
const DEFS=[
 ['On Hand / In Transit / Open PO','Units in the warehouse today / units on the way with a delivery date / units ordered from the supplier that have not shipped. On Order is In Transit plus Open PO. Total Supply is On Hand plus On Order.'],
 ['Forecast Per Week','The average of the next 12 weekly forecasts.'],
 ['Sales vs Forecast (3 Wk)','Sales over the last 3 weeks divided by the forecast for the same weeks, minus 1. Orange when it is 15% or more either way.'],
 ['Weeks Of Supply','(On Hand + In Transit) divided by Forecast Per Week. Red under 4 weeks. Blue over '+st.settings.overstockWOS+' weeks (a setting).'],
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
 ['Last Promo Lift And Units','Last year\'s promo weeks compared with the normal weeks around them, after taking out the season. 1.50x means the promo weeks sold 50% more. Last Promo Units Sold is the total sold in those weeks, so you can see the real number behind the lift. Both are measured from the weeks last year\'s promo ran, moved to the same calendar weeks this year.'],
 ['Promo And Peak Overlap','Says whether this year\'s promo weeks fall inside the peak weeks. When they do, the promo lands on top of an already busy season.'],
 ['Promo Extra Units And Peak + Promo Units','Peak Bump is the units the peak weeks sell above a normal week. Promo Extra Units is what the confirmed promo adds on top of the forecast in its weeks (forecast times the last promo lift). For a promo inside the peak it scales with the Peak Lift Used, so a peak override moves it. Peak + Promo Units adds the two in units. It is 0 for a promo with no last-year history (New this year), because there is no lift to measure. Nothing is averaged, and a week is never counted twice: The promo sits on top of the peak level, and the peak bump is measured against a normal week.'],
 ['12-Week Plan','Projected On Hand each week is last week plus receipts minus forecast demand. Red means below zero. Lowest Point is the lowest projected week. The Peak / Promo Weeks row marks PEAK weeks, PROMO weeks (PROMO? if not confirmed) and BOTH.']];
function recipeItems(){
  return [['Rows Shown','The Master List holds every item, with the ones that need attention first, ranked by status then dollars. The Dashboard starts on the items that need attention.'],
   ['Dashboard Columns',cols.map(k=>COLS[k].h).join(', ')+'. The Master List always holds every column.'],
   ['Data Sources',D.sources.map(s=>s.name).join(', ')],
   ['Checks Run',Object.keys(E.FLAG_LABEL).filter(k=>st.settings.flags[k]).map(k=>E.FLAG_LABEL[k]).join(', ')],
   ['Seasonality And Promos','Peak months are calculated from sales history. Promos are read from the promo calendar file. The Seasonal And Promo Lifts tab shows each item\'s peak and promo, and its Where This Comes From section lists what is calculated, what comes from a file and what is not available. The Sales History tab shows the weekly sales behind the peaks, and the Master List suggests how many units to add for a peak or promo, with the reason.'],
   ...A.SEASON_SRC.map(x=>['Source: '+x[0],x[1]+'. '+x[2]]),
   ['Notes','Notes never expire. Type one note per item in the Master List. In the app, a comment keeps the alert on and an accepted risk stops it, coming back only if its gap grows past 1.5 times what was accepted.'],
   ['Carrying Work Forward','Each run starts from the previous file and the two fresh source files. Calculated columns are replaced from the new files. The light yellow columns are copied across by SKU, so notes, peak overrides, order quantities to place and needed-by dates carry forward. An order quantity to place is flagged for review once its Needed By date passes, and an override is flagged for review after two weeks, so old fixes do not drive orders forever.'],
   ['New And Missing Items','A SKU in the latest files that was not in the previous run\'s is marked New Today in the File Status column on the Master List, with the light yellow columns empty. A SKU that was in the previous file but is missing from today\'s goes to the New And Missing Items tab with the work you had typed, so you know to check the shared files for what happened.'],
   ['Peak Override And Orders','Read the peak columns left to right on the Master List: Peak Weeks is when, Peak Lift is how big (the forecast in the peak weeks divided by a normal week), with your Override and its Reason beside it and Peak Lift Used after them, Peak Bump is the extra units that means, and Units Short Of Peak Cover is what is still missing after stock and orders on the way. If you know last year was out of stock, type your own lift on the Master List. AI Recommended Qty (Stock Gap) covers stock-out gaps. AI Recommended Add (Peak + Promo) says how many more units to order so stock stays above 2 weeks of peak demand, counting the confirmed promo, and AI Recommendation Why gives the reason in words. AI Recommended Qty (Total) adds them together and recalculates with any override you typed. Order Qty To Place and Needed By are yours to type and copy into the planning system.'],
   ['Schedule','On your schedule: Daily, weekly or on request (sample: 6:05 AM)'],
   ['How To Change It','Ask your AI agent. Columns, colors and rules are changed in conversation with the agent, which updates this saved recipe so every future run uses it. They are not edited on this site or in the downloaded file.'],
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
  return [{line:'All Lines',n:T.n,w:T.wmape,b:T.bias,sig:''},...Object.entries(a).sort((x,y)=>y[1].wmape-x[1].wmape).map(([k,v])=>({line:k,n:v.n,w:v.wmape,b:v.bias,sig:v.possible?'Possible bias: Forecast runs '+(v.direction==='under'?'low':'high'):'No consistent bias'}))];
}
/* ---------- grid ---------- */
function letters(n){return Array.from({length:n},(_,i)=>MiniXlsx.col(i))}
function gridHtml(heads,rows,o){
  o=o||{};const L=letters(heads.length);
  return `<div class="xl-scroll"><table class="xt"><thead><tr class="letters"><th class="rn"></th>${L.map(x=>`<th>${x}</th>`).join('')}</tr>
   <tr class="heads"><th class="rn">1</th>${heads.map(h=>`<th class="${h.cls||''}">${esc(h.t)}</th>`).join('')}</tr></thead>
   <tbody>${rows.length?rows.map((r,i)=>`<tr class="${r.cls||''}" ${r.id?`data-open="${r.id}" tabindex="0"`:r.line?`data-line="${esc(r.line)}" tabindex="0"`:''}><td class="rn">${i+2}</td>${r.c.map(c=>`<td class="${c.cls||''}">${esc(c.t)}</td>`).join('')}</tr>`).join(''):`<tr><td class="rn">2</td><td colspan="${heads.length}">${esc(o.empty||'Nothing here.')}</td></tr>`}</tbody></table></div>`;
}
function colGrid(keys,rows,empty,inp){
  inp=inp||[];const heads=keys.map(k=>({t:inp.includes(k)?COLS[k].h+' (Type Here)':COLS[k].h,cls:(COLS[k].num?'money':'')+(inp.includes(k)?' inp':'')+(A.AIK.has(k)?' ai':'')}));
  const body=rows.map(r=>({id:r.id,cls:'',c:keys.map(k=>{const v=val(k,r),C=COLS[k];
    if(k==='status')return {t:v,cls:'st '+TCLASS[r.tier]};
    if(k==='filest')return {t:v,cls:v?'st t-new':''};
    if(k==='product')return {t:v,cls:'prodcol'};
    if(C.num)return {t:A.fv(k,v),cls:'money '+(inp.includes(k)?'inp ':'')+A.pcls(k,v)};
    return {t:String(v),cls:(C.wide?'wide ':'')+(inp.includes(k)?'inp ':'')+A.pcls(k,v)}})}));
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
const NK=['status','sku','product','note','notedate','going'];
let itemLine='All Lines';
const LFK=['status','sku','product','filest','sub','peak','peakwk','peaklift','ovr','ovrwhy','used','bump','promo','nextpromo','lypromo','lyunits','lift','overlap','promoext','totlift','stocklp','peakcover','peakgap','suggest','addqty','addwhy','ordovr','plan','cmptxt','note'];
const seasonSummary=d=>`${d.n.promo} of ${d.n.items} items have a promo this year or last year (${d.n.ty} this year, ${d.n.unconf} not yet confirmed). ${d.n.thin} of the ${d.n.peak} items with a peak in the next 12 weeks would run thin or short.`;
function accGrid(){
  const rows=accRows(),heads=['Line','Items','Forecast Accuracy','Miss (WMAPE)','Bias','Against Targets','Signal'].map((t,i)=>({t,cls:i>=1&&i<=4?'money':''}));
  return {html:gridHtml(heads,rows.map(x=>({c:[{t:x.line,cls:'bold'},{t:String(x.n),cls:'money'},{t:A.pctN(1-x.w),cls:'money'},{t:A.pctN(x.w),cls:'money'},{t:A.pctSN(x.b),cls:'money'},{t:tgtText(x.w,x.b),cls:({'On target':'','Watch':'warn','Off target':'bad'})[tgtText(x.w,x.b)]},{t:x.sig,cls:'wide'}]}))),n:rows.length-1};
}
const TABS=[['dash','Dashboard'],['all','Master List (Work Here)'],['plan','12-Week Plan'],['acc','Forecast Accuracy'],['items','Seasonal And Promo Lifts'],['hist','Sales History'],['notes','Notes'],['dropped','New And Missing Items'],['recipe','Recipe']];
function roleHtml(){
  if(tab==='all')return `<div class="role work"><b>Work here.</b> This is the only tab you type in. Filter any column, and type in the light yellow columns (peak override, order quantity to place, needed by and notes). Order Qty To Place is the new order you decide to place today. Orders already placed are In Transit and Open PO. Items marked New Today in the File Status column are new in the latest files. Every other tab reads from this sheet, so what you type shows up everywhere. To work the same list you saw on the Dashboard, filter Status and Decision here to the same choices.</div><div class="carry-box"><b>Reading the peak and promo columns, left to right:</b> Peak Weeks is when. Peak Lift, your Peak Lift Override and its Reason sit side by side so you can compare them, and Peak Lift Used is the one the sheet uses. Peak Bump is the extra units that means. Next come the promo columns: This year\'s promo weeks, last year\'s promo weeks, the units it sold and the lift it gave, whether it lands inside the peak, and Promo Extra Units. Peak Bump plus Promo Extra Units is shown in units, never averaged. Then Peak Cover and Units Short Of Peak Cover say whether stock and orders on the way already cover it. Further right the teal AI columns sit together: AI Recommended Qty (Stock Gap), AI Recommended Add (Peak + Promo) with AI Recommendation Why, and AI Recommended Qty (Total), recalculated when you type an override. Then come Order Qty To Place, which is what you decide, Variance Vs AI Qty and Your Qty Vs AI (Near AI Qty, Below AI Qty or Above AI Qty). Type an override and the bump, promo and order quantities update.</div>${colorKey()}`;
  if(tab==='dash')return `<div class="role front"><b>Look here first. View only.</b> Pick a Decision and a Status to see the day at a glance. To act on what you see, go to the Master List (Work Here) and filter to the same choices.</div><div class="carry-box"><b>Today\'s files:</b> ${esc(carryText())}</div>`;
  if(tab==='dropped')return `<div class="role"><b>View only.</b> Every change in which items are in the files. New means the item is in the latest files but was not in the previous run\'s (it is also marked New Today on the Master List). Missing Today means it was in the previous file but is not in today\'s: The run lists it here with the work you had typed, so nothing is lost silently. Check the shared files to see what happened.</div>`;
  if(tab==='recipe')return '';
  return `<div class="role"><b>View only.</b> This tab reads from the Master List, so make changes there. It is locked so typing here does not get lost (in Excel: Review, then Unprotect Sheet, no password).</div>`;
}
const newCheck='New in the latest files, so nothing is typed yet. Check its forecast and launch plan, then type any note or order quantity on the Master List.';
function changeList(){const out=[];A.NEWIDS.forEach(id=>{const r=A.rowOf(id);if(r)out.push({chg:'New',id,name:r.name,sub:r.sub,onHand:r.metrics.onHand,po:r.metrics.transit+r.metrics.openPO,note:'',plan:'',by:'',check:newCheck})});
  A.droppedList().forEach(x=>out.push({chg:'Missing Today',id:x.id,name:x.name,sub:x.sub,onHand:x.onHand,po:x.po,note:x.note,plan:x.plan,by:x.by,check:dropCheck(x)}));return out}
const dropCheck=x=>'Not in the latest files. Check the shared files for a discontinue, a rename or a missing row.'+(x.po>0?' It still has '+E.fmtNum(x.po)+' units on order, so confirm with the supplier.':'')+(x.plan?' You had an order to place for '+E.fmtNum(x.plan)+' units, so confirm that order was placed.':'');
function carryCounts(){const rows=sheetRows('all');return {nw:A.NEWIDS.length,carried:rows.filter(r=>val('note',r)!==''||val('ovr',r)!==''||val('plan',r)!=='').length,dropped:A.droppedList().length}}
function carryText(){const c=carryCounts();return c.nw+' new items in the latest files (marked New Today on the Master List, nothing typed yet). '+c.carried+' items carry typed work from the previous file. '+c.dropped+' items from the previous run are missing from today\'s files (see New And Missing Items).'}
function renderSheet(){
  const v=$('#v-sheet'),total=st.res.total;
  let inner,count='';
  if(tab==='dash'){inner=dashHtml();count='Interactive'}
  else if(tab==='all'){const g=colGrid(FULLK,sheetRows('all'),null,INK);inner=g.html;count=`${g.n} items, every column`}
  else if(tab==='plan'){const g=planGrid(sheetRows(rowsMode));inner=g.html;count=`${g.n} items, ${E.H} weeks`}
  else if(tab==='acc'){const g=accGrid();inner=g.html;count='Last 13 weeks'}
  else if(tab==='items'){const d=A.seasonData(),its=d.items.filter(r=>itemLine==='All Lines'||r.sub===itemLine),g=colGrid(LFK,its);
    inner=`<div class="note-box line-pick"><label><b>Line</b> <select id="il">${d.lines.map(l=>`<option ${l===itemLine?'selected':''}>${esc(l)}</option>`).join('')}</select></label> Every item with a peak or a promo, by line. Read left to right: The peak (when, how big, your override and reason beside it, and the Peak Bump in units), then the promo (this year\'s weeks, last year\'s weeks and units sold, the lift it gave, whether it lands inside the peak, and the Promo Extra Units it adds on top), then whether stock covers it (Peak Cover and Units Short Of Peak Cover). Peak and promo are added in units, never averaged. Stock Last Peak shows items that were out of stock last year, when last year\'s sales understate demand. To change a lift, type an override on the Master List.</div>`+`<div class="note-box">${esc(seasonSummary(d))}</div>`+g.html+`<h3 class="sub-h">Where This Comes From</h3>`+gridHtml(['Topic','Where It Comes From','How'].map(t=>({t})),A.SEASON_SRC.map(x=>({c:[{t:x[0],cls:'bold'},{t:x[1],cls:'st'},{t:x[2],cls:'wide'}]})));count=`${g.n} items with a peak or promo`+(itemLine==='All Lines'?'':', '+itemLine)}
  else if(tab==='hist'){const d=A.histData(itemLine),h=[{t:'Status'},{t:'SKU'},{t:'Product'},{t:'Line'},{t:'Row'},{t:'Normal Week (Units)',cls:'money'},...A.HIST_MON.map(t=>({t,cls:'money'})),...Array.from({length:52},(_,i)=>({t:'Wk '+(i+1),cls:'money'+(i>=45?' nxt':'')}))];
    const body=d.map(x=>({id:x.id,c:[{t:A.tn(x.r.tier),cls:'st '+TCLASS[x.r.tier]},{t:x.id},{t:x.r.name,cls:'nw'},{t:x.r.sub,cls:'nw'},{t:x.label,cls:'bold nw'},{t:x.norm>0?E.fmtNum(x.norm):'',cls:'money'},...x.mo.map(v=>({t:v==null?'':E.fmtNum(v),cls:'money'})),...x.wk.map((v,i)=>({t:v==null?'':E.fmtNum(v),cls:'money'+(v!=null&&x.norm>0&&v>=1.5*x.norm?' warn':'')}))]}));
    inner=`<div class="note-box line-pick"><label><b>Line</b> <select id="il">${A.seasonData().lines.map(l=>`<option ${l===itemLine?'selected':''}>${esc(l)}</option>`).join('')}</select></label> Units sold by week for 2024, 2025 and 2026, with the 2026 forecast, so you can see where inside a peak the units land: The first week, the last weeks, or the whole month. Each SKU has four rows. Orange weeks sold at least 1.5x that row\'s Normal Week (its middle week, left blank for items that sold in fewer than half the weeks, so nothing is highlighted for them). Monthly totals are on the left, weeks 1 to 52 on the right, and Wk 46 to Wk 52 are the weeks starting now. The forecast row shows the forecast for 2026; only Wk 46 to Wk 52 of the next 12 weeks fall in 2026. This reads the same sales history the peak weeks are calculated from, from the Reporting tool.</div>`+gridHtml(h,body,{empty:'No items.'});count=`${new Set(d.map(x=>x.id)).size} items`+(itemLine==='All Lines'?'':', '+itemLine)}
  else if(tab==='dropped'){const cl=changeList();inner=gridHtml(['Change','SKU','Product','Line','On Hand','Units On Order','Typed Note From Previous Run','Qty To Place','Needed By','What To Check'].map((t,i)=>({t,cls:i==4||i==5||i==7?'money':''})),cl.map(x=>({id:x.chg==='New'?x.id:null,cls:x.chg==='New'?'newrow':'',c:[{t:x.chg==='New'?'New Today':'Missing Today',cls:'st '+(x.chg==='New'?'t-new':'t-drop')},{t:x.id},{t:x.name},{t:x.sub},{t:E.fmtNum(x.onHand),cls:'money'},{t:E.fmtNum(x.po),cls:'money'},{t:x.note,cls:'wide'},{t:x.plan===''?'':E.fmtNum(x.plan),cls:'money'},{t:x.by},{t:x.check,cls:'wide'}]})),{empty:'Nothing new or missing today.'});count=A.NEWIDS.length+' new, '+A.droppedList().length+' missing'}
  else if(tab==='notes'){const g=colGrid(NK,sheetRows('all').filter(r=>A.noteFor(r.id)),'No notes yet.');inner=g.html;count=g.n+' notes'}
  else{const it=recipeItems();inner=gridHtml(['Setting','What It Is Set To'].map(t=>({t})),it.map(r=>({c:[{t:r[0],cls:'st'},{t:r[1],cls:'wide'}]})));count='Saved with the sheet'}
  v.innerHTML=`<div class="page"><div class="pg-h"><h1>Custom Spreadsheet</h1></div>
   <ul class="mini pg-sub"><li><b>This is what lands in your Excel file</b> on every run.</li><li><b>Click any row</b> to see the numbers behind it.</li><li><b>The download</b> keeps the same colors and formatting, with yellow dropdowns that change the boxes and the list.</li></ul>
   <div class="demo-note slim"><b>Columns are changed through your AI agent, not on this page.</b> The Dashboard columns are saved in the agent\'s recipe, so to add, remove or reorder them, tell your AI agent what you want and it updates the recipe for every future run. <a href="#" id="sh-how">See an example conversation</a></div>
   <div class="xl"><div class="xl-bar"><span class="fx">fx</span><b>Planning Sheet (Sample Data), ${esc(A.TODAY_SHORT)}</b><span class="mute" style="color:#555">${count}</span><span style="flex:1"></span>
    ${tab==='plan'?`<span class="seg" role="group" aria-label="Rows"><button data-rows="attn" aria-pressed="${rowsMode==='attn'}">Needs attention</button><button data-rows="all" aria-pressed="${rowsMode==='all'}">All items</button></span>`:''}
    <button class="btn sm" id="sh-custom">How To Change Columns</button>
    <button class="btn dl" id="sh-dl">Download Sheet</button></div>
   ${roleHtml()}${inner}
   <div class="xl-tabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" class="${k==='all'?'work':k==='dash'?'front':''}" aria-selected="${tab===k}" data-xt="${k}">${l}</button>`).join('')}</div></div>
   <ul class="mini sec-sub" style="margin:10px 0 0"><li><b>Work in one place:</b> The light yellow Master List (Work Here) tab. Filter it and type notes, a peak lift override or the order quantity to place.</li><li><b>Everything else reads from it,</b> so it updates when the Master List does. Those tabs are locked so nothing typed there gets lost.</li><li><b>New And Missing Items</b> lists what is new or missing from the latest files.</li><li><b>The Dashboard</b> is the same list, easier to scan. Look there first.</li></ul><p class="simnote">Sample data, not Mattel data. The real file is built the same way from your own exports.</p></div>`;
  const il=$('#il',v);if(il)il.onchange=()=>{itemLine=il.value;renderSheet()};
  $$('[data-line]',v).forEach(e=>{const go2=()=>{itemLine=e.dataset.line;tab='items';renderSheet()};e.onclick=go2;e.onkeydown=ev=>{if(ev.key==='Enter')go2()}});
  $$('[data-rows]',v).forEach(b=>b.onclick=()=>{rowsMode=b.dataset.rows;renderSheet()});
  $$('[data-xt]',v).forEach(b=>b.onclick=()=>{tab=b.dataset.xt;renderSheet()});
  const dd=$('#dd',v),ds=$('#ds',v);if(dd)dd.onchange=()=>{dashDec=dd.value;renderSheet()};if(ds)ds.onchange=()=>{dashStat=ds.value;renderSheet()};
  $$('[data-open]',v).forEach(e=>{e.onclick=()=>A.openSku(e.dataset.open);e.onkeydown=ev=>{if(ev.key==='Enter')A.openSku(e.dataset.open)}});
  $('#sh-dl').onclick=downloadXlsx;$('#sh-custom').onclick=()=>go('custom');$('#sh-how').onclick=e=>{e.preventDefault();go('custom')};
}
/* ---------- xlsx ---------- */
function downloadXlsx(){
  const C=MiniXlsx.col,AIS=A.AIK,hdr=ks=>Object.assign(ks.map(t=>({v:t,s:'head'})),{h:42}),hdrK=ks=>Object.assign(ks.map(k=>({v:COLS[k].h,s:AIS.has(k)?'headAI':'head'})),{h:42}),sty=k=>AIS.has(k)?(COLS[k].num?'aiInt':'ai'):COLS[k].num||'txt';
  const DATEK=new Set(['nextarr','arr2','readyd','stockout','orderby']),serial=iso=>Math.round((Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10))-Date.UTC(1899,11,30))/864e5),wval=(k,r)=>{if(DATEK.has(k)){const i=A.isoOf(k,r);if(i)return serial(i)}return val(k,r)};
  const cellOf=(k,r)=>{const v=wval(k,r),Cc=COLS[k];
    if(DATEK.has(k)&&typeof v==='number')return {v,s:'dt'};
    if(k==='status')return {v,s:TS[r.tier]};
    if(AIS.has(k))return {v,s:sty(k)};
    if(Cc.num)return v===''?null:{v,s:Cc.num};
    return {v,s:'txt'}};
  /* conditional formats shared by the list sheets: weeks of supply, sales vs forecast, stock-out, negative stock */
  const ovr=st.settings.overstockWOS;
  const cfList=(keys,first,last)=>{if(last<first)return [];const out=[],L=k=>{const i=keys.indexOf(k);return i<0?null:C(i)};
    const wl=L('wos'),sl=L('salesvs'),ec=L('etachg'),ol=L('stockout'),hl=L('onhand'),ob=L('orderby');
    if(wl)out.push({ref:`${wl}${first}:${wl}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(ISNUMBER(${wl}${first}),${wl}${first}<4)`},{type:'expression',dxf:3,formula:`AND(ISNUMBER(${wl}${first}),${wl}${first}>${ovr})`}]});
    if(ec)out.push({ref:`${ec}${first}:${ec}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(ISNUMBER(${ec}${first}),${ec}${first}>=14)`},{type:'expression',dxf:1,formula:`AND(ISNUMBER(${ec}${first}),${ec}${first}>=${st.settings.etaSlipDays})`}]});
    if(sl)out.push({ref:`${sl}${first}:${sl}${last}`,rules:[{type:'expression',dxf:1,formula:`AND(ISNUMBER(${sl}${first}),ABS(${sl}${first})>=0.15)`}]});
    [ol,ob].forEach(c=>{if(c)out.push({ref:`${c}${first}:${c}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(${c}${first}<>"",${c}${first}<>"None",${c}${first}<>"n/a")`}]})});
    if(hl)out.push({ref:`${hl}${first}:${hl}${last}`,rules:[{type:'expression',dxf:0,formula:`AND(ISNUMBER(${hl}${first}),${hl}${first}<0)`}]});
    const pgp=L('peakgap');if(pgp)out.push({ref:`${pgp}${first}:${pgp}${last}`,rules:[{type:'expression',dxf:1,formula:`AND(ISNUMBER(${pgp}${first}),${pgp}${first}>0)`}]});
    const slp=L('stocklp'),usd=L('used'),ov=L('ovr');
    if(slp)out.push({ref:`${slp}${first}:${slp}${last}`,rules:[{type:'expression',dxf:1,formula:`LEFT(${slp}${first},3)="Out"`}]});
    const cmp=L('cmptxt');if(cmp)out.push({ref:`${cmp}${first}:${cmp}${last}`,rules:[{type:'expression',dxf:4,formula:`LEFT(${cmp}${first},5)="Close"`},{type:'expression',dxf:0,formula:`LEFT(${cmp}${first},5)="Below"`},{type:'expression',dxf:1,formula:`LEFT(${cmp}${first},5)="Above"`}]});
    const pcv=L('peakcover'),prm=L('promo');
    if(pcv)out.push({ref:`${pcv}${first}:${pcv}${last}`,rules:[{type:'cellIs',op:'equal',dxf:0,formula:'"Short"'},{type:'cellIs',op:'equal',dxf:1,formula:'"Thin"'}]});
    if(prm)out.push({ref:`${prm}${first}:${prm}${last}`,rules:[{type:'cellIs',op:'equal',dxf:0,formula:'"Confirmed, short"'},{type:'cellIs',op:'equal',dxf:1,formula:'"Not confirmed"'}]});
    return out};
  const mk=(rows,name,keys)=>{
    const data=rows.map(r=>keys.map(k=>cellOf(k,r)));
    return {name,widths:keys.map(k=>COLS[k].w),rows:[hdrK(keys),...data],freeze:1,filter:data.length+1,cf:cfList(keys,2,data.length+1)};
  };
  const rec=recipeItems(),DK=cols.slice();
  const allRows=sheetRows('all'),N=allRows.length;
  const STATL=CONSTAT(),D0=dashDec,S0=dashStat;
  /* ---- Master List (Work Here): every item, every column, plus two hidden helper columns that drive the dashboard ---- */
  const nf=FULLK.length,ix=k=>FULLK.indexOf(k);
  const HELP=['Status Match','Show','Base Wk Units','Peak Weeks','Peak Headroom','Promo Units In Peak','Promo Units Outside Peak'];
  const dataSheet=mk(allRows,MASTER,FULLK);
  dataSheet.tab='FF9A7B00';dataSheet.freezeCols=3;
  /* the three light yellow columns are the only place anyone types */
  INK.forEach(k=>{const c=ix(k);dataSheet.rows[0][c]={v:COLS[k].h+' (Type Here)',s:'headIn'};allRows.forEach((r,i)=>{dataSheet.rows[i+1][c]={v:val(k,r),s:'inp'}})});
  {const cU=ix('used'),cO=ix('ordovr'),OV=C(ix('ovr')),PL=C(ix('peaklift')),SG=C(ix('suggest')),B=C(nf+2),P=C(nf+3),H=C(nf+4),PI=C(nf+5),PO=C(nf+6),cPE=ix('promoext'),cTL=ix('totlift');
   allRows.forEach((r,i)=>{const er=i+2,row=dataSheet.rows[i+1],PGc=C(ix('peakgap')),PEc=C(cPE),ovrx=`IF(AND(ISNUMBER(${OV}${er}),ISNUMBER(${PL}${er}),ISNUMBER(${B}${er})),(${OV}${er}-${PL}${er})*${B}${er}*${P}${er},0)`,X=`(N(${PGc}${er})-N(${H}${er})+N(${PEc}${er})+${ovrx})`,AD=`IF(${X}-N(${SG}${er})<=0,0,CEILING(${X}-N(${SG}${er}),10))`;
    row[ix('bump')]={f:`IF(AND(ISNUMBER(${C(cU)}${er}),ISNUMBER(${B}${er}),ISNUMBER(${P}${er})),ROUND((${C(cU)}${er}-1)*${B}${er}*${P}${er},0),"")`,v:val('bump',r),s:'int'};
    if(r.isNew){row[cPE]={v:'',s:'int'};row[cTL]={v:'',s:'int'}}else{row[cPE]={f:`IF(N(${PI}${er})+N(${PO}${er})>0,ROUND(N(${PI}${er})*IF(AND(ISNUMBER(${C(cU)}${er}),ISNUMBER(${PL}${er})),${C(cU)}${er}/${PL}${er},1)+N(${PO}${er}),0),0)`,v:val('promoext',r),s:'int'};
    row[cTL]={f:`IF(AND(${C(cU)}${er}="",${C(cPE)}${er}=""),"",N(${C(ix('bump'))}${er})+N(${C(cPE)}${er}))`,v:val('totlift',r),s:'int'}}
    row[cU]={f:`IF(ISNUMBER(${OV}${er}),${OV}${er},IF(ISNUMBER(${PL}${er}),${PL}${er},""))`,v:val('used',r),s:'x2'};
    row[cO]={f:`IF(N(${SG}${er})+${AD}>0,N(${SG}${er})+${AD},"")`,v:val('ordovr',r),s:'aiInt'};
    const PLN=C(ix('plan')),OQ=`${C(cO)}${er}`,PQ=`${PLN}${er}`;
    row[ix('cmpai')]={f:`IF(ISNUMBER(${PQ}),${PQ}-N(${OQ}),"")`,v:val('cmpai',r),s:'intS'};
    row[ix('cmptxt')]={f:`IF(NOT(ISNUMBER(${PQ})),IF(N(${OQ})>0,"No qty typed yet",""),IF(ABS(${PQ}-N(${OQ}))<=MAX(10,0.1*N(${OQ})),"Near AI Qty",IF(${PQ}<N(${OQ}),"Below AI Qty by "&TEXT(N(${OQ})-${PQ},"#,##0"),"Above AI Qty by "&TEXT(${PQ}-N(${OQ}),"#,##0"))))`,v:val('cmptxt',r),s:'txt'}});
   dataSheet.dv=[{type:'decimal',min:'1',max:'8',ref:`${OV}2:${OV}${N+1}`,title:'Peak lift override',prompt:'Type your own peak lift, like 3.0 for 3 times a normal week. Leave it blank to use the calculated lift.',errTitle:'Not a lift',err:'Type a number from 1 to 8, or clear the cell.'}];
   }
  dataSheet.rows[0].push(...HELP.map(t=>({v:t,s:'head'})));
  const hL=i=>C(nf+i),sCol=C(ix('status')),aCol=C(ix('attn')),dCol=C(ix('decision'));
  let run=0;const showVal=allRows.map(r=>dashMatch(r)?++run:'');
  allRows.forEach((r,i)=>{const row=dataSheet.rows[i+1],er=i+2;
    const mm=r.metrics,hasPk=mm.peak&&mm.baseWk;
    row.push({f:`IF(OR(Dashboard!$F$4="All statuses",AND(Dashboard!$F$4="Needs attention",${aCol}${er}="Yes"),${sCol}${er}=Dashboard!$F$4),1,0)`,v:statOK(r)?1:0,s:'txt'},
     {f:`IF(AND(OR(Dashboard!$B$4="${ALLD}",${dCol}${er}=Dashboard!$B$4),${hL(0)}${er}=1),MAX(${hL(1)}$1:${hL(1)}${er-1})+1,"")`,v:showVal[i],s:'txt'},{v:hasPk?R3(mm.baseWk):'',s:'dec1'},{v:hasPk?mm.peakWks:'',s:'int'},{v:mm.peakCover?R3(Math.max(0,mm.peakCover.minInv-mm.peakCover.safety)):0,s:'int'},{v:R3(mm.promo.extraIn||0),s:'int'},{v:R3(mm.promo.extraOut||0),s:'int'})});
  dataSheet.widths=[...dataSheet.widths,...HELP.map(()=>14)];
  dataSheet.hide=HELP.map((_,i)=>nf+i);
  const rng=k=>{const c=C(typeof k==='number'?nf+k:ix(k));return `'${MASTER}'!$${c}$2:$${c}$${N+1}`};
  const rDec=rng('decision'),rAtt=rng('attn'),rSM=rng(0),rShow=rng(1);
  const TN0=['At risk','Watch','Overstocked','No risk'];
  /* list tabs that read every cell from the Master List by SKU */
  const mkL=(rows,name,keys)=>{const si=keys.indexOf('sku');if(si<0)return mk(rows,name,keys);const sc=C(si),skuR=rng('sku');
    const data=rows.map((r,i)=>{const er=i+2;return keys.map(k=>{if(k==='sku')return {v:r.id,s:'ctr'};
      const Cc=COLS[k],rg=rng(k),m=`MATCH($${sc}${er},${skuR},0)`,v=wval(k,r);
      return {f:`IFERROR(IF(INDEX(${rg},${m})="","",INDEX(${rg},${m})),"")`,v:v,s:k==='status'?'ctr':DATEK.has(k)&&typeof v==='number'?'dt':sty(k)}})});
    const sh={name,widths:keys.map(k=>COLS[k].w),rows:[hdrK(keys),...data],freeze:1,filter:data.length+1,cf:cfList(keys,2,data.length+1)};
    const stc=keys.indexOf('status');if(stc>=0&&data.length)sh.cf.push({ref:`${C(stc)}2:${C(stc)}${data.length+1}`,rules:TN0.map((t,j)=>({type:'cellIs',op:'equal',dxf:[0,1,3,4][j],formula:`"${A.tn(t)}"`}))});
    return sh};
  /* ---- Forecast Accuracy ---- */
  const ac=accRows(),AR=ac.length+1;
  const accSheet={name:'Forecast Accuracy',fit:true,widths:[20,9,16,16,12,16,40],freeze:1,rows:[hdr(['Line','Items','Forecast Accuracy','Miss (WMAPE)','Bias','Against Targets','Signal']),
    ...ac.map((x,i)=>{const er=i+2;return [{v:x.line,s:'bold'},{v:x.n,s:'int'},{f:`1-D${er}`,v:1-x.w,s:'pct'},{v:x.w,s:'pct'},{v:x.b,s:'pctS'},
      {f:`IF(OR(D${er}>0.35,ABS(E${er})>0.1),"Off target",IF(OR(D${er}>0.25,ABS(E${er})>0.05),"Watch","On target"))`,v:tgtText(x.w,x.b),s:'ctr'},{v:x.sig,s:'txt'}]}),
    [],[{v:'How to read this',s:'bold'}],
    [{v:'Miss (WMAPE) adds up |actual - forecast| for every SKU and week over the last 13 weeks, then divides by total actual sales. Bias is (forecast - actual) divided by actual: Negative means the forecast runs low. Common targets: Miss under 25%, bias within 5% either way. Over 35% miss or 10% bias is off target.',s:'note'}]],
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
  /* ---- Seasonal And Promo Lifts ---- */
  const SD=A.seasonData();
  const itemSheet=mkL(SD.items,'Seasonal And Promo Lifts',LFK);itemSheet.fit=true;itemSheet.freezeCols=3;
  /* ---- Sales History: static history from the Reporting tool, status/product/line read from the Master ---- */
  const HD=A.histData('All Lines'),skuR0=rng('sku'),HK=['status','product','sub'],HN=HD.length;
  const histSheet={name:'Sales History',widths:[13,10,30,16,14,11,...Array(12).fill(8),...Array(52).fill(7)],freeze:1,freezeCols:5,fit:true,cf:[],
    rows:[hdr(['Status','SKU','Product','Line','Row','Normal Week (Units)',...A.HIST_MON,...Array.from({length:52},(_,i)=>'Wk '+(i+1))]),
      ...HD.map((x,i)=>{const er=i+2,mm=`MATCH($B${er},${skuR0},0)`,pick=k=>({f:`IFERROR(IF(INDEX(${rng(k)},${mm})="","",INDEX(${rng(k)},${mm})),"")`,v:k==='status'?val('status',x.r):k==='product'?x.r.name:x.r.sub,s:k==='status'?'ctr':'txt'});
        return [pick('status'),{v:x.id,s:'ctr'},pick('product'),pick('sub'),{v:x.label,s:'bold'},{v:x.norm>0?x.norm:'',s:'int'},...x.mo.map(v=>({v:v==null?'':v,s:'int'})),...x.wk.map(v=>({v:v==null?'':v,s:'int'}))]})],filter:HN+1};
  histSheet.cf.push({ref:`${C(18)}2:${C(69)}${HN+1}`,rules:[{type:'expression',dxf:1,formula:`AND(ISNUMBER(${C(18)}2),$${C(5)}2>0,${C(18)}2>=1.5*$${C(5)}2)`}]});
  histSheet.cf.push({ref:`A2:A${HN+1}`,rules:TN0.map((t,j)=>({type:'cellIs',op:'equal',dxf:[0,1,3,4][j],formula:`"${A.tn(t)}"`}))});
  /* ---- Dashboard ---- */
  const DW={status:12,sku:10,product:30,onhand:10,onorder:10,wos:9,fcstwk:9,salesvs:11,stockout:12,nextarr:13,nextarrq:11,readyd:12,prodq:12,orgq:11,etachg:11,arr2:13,arr2q:11,aifdiff:11,peakcover:10,nextpromo:17,gap:10,dollars:12,going:50,note:40,conf:10};
  const nd=DK.length,HC=nd; // helper column index on the dashboard
  const dash={name:'Dashboard',tab:'FF1F3864',fit:true,noGrid:true,widths:[...DK.map(k=>DW[k]||COLS[k].w),6],hide:[HC],rows:[],merges:[],cf:[],dv:[]};
  const R=n=>{while(dash.rows.length<n)dash.rows.push([]);return dash.rows[n-1]};
  const put=(r,c,o)=>{R(r)[c]=o};
  const fill=(r,c0,c1,sty)=>{for(let c=c0;c<=c1;c++)if(!R(r)[c])put(r,c,{v:'',s:sty})};
  const span=(r,c0,c1,o)=>{put(r,c0,o);fill(r,c0+1,c1,o.s);if(c1>c0)dash.merges.push(`${C(c0)}${r}:${C(c1)}${r}`)};
  span(1,0,nd-1,{v:'Planning Dashboard (Sample Data), '+A.TODAY_SHORT,s:'title'});R(1).h=26;
  span(2,0,nd-1,{v:'VIEW ONLY. Look things over here, then do the work on the light yellow Master List (Work Here) tab and filter it to the same Decision and Status. Decision is the action an item needs. Status is how urgent it is, and "Needs attention" means anything flagged. Pick one of each in the two yellow cells and the boxes and list rebuild. Sample data, not Mattel data. If Excel opens this in Protected View, click Enable Editing first. Color key: Teal is the AI\'s recommendation, light yellow is where you type, red is a problem or needs action, orange is Watch (the planner should check it), blue is Overstocked or too many weeks of supply, green is No risk.',s:'note'});R(2).h=48;
  put(4,0,{v:'Decision',s:'label'});span(4,1,2,{v:D0,s:'pick'});
  span(4,3,4,{v:'Status',s:'label'});span(4,5,7,{v:S0,s:'pick'});R(4).h=24;
  dash.dv.push({ref:'B4',title:'Decision',prompt:'Pick a decision to filter the list.',list:'"'+[ALLD,...DECL].join(',')+'"'},{ref:'F4',title:'Status',prompt:'Pick a status to filter the list.',list:'"'+STATL.join(',')+'"'});
  const q4=i=>[Math.round(i*nd/4),Math.round((i+1)*nd/4)-1],BOX=[0,1,2,3].map(q4),t6=i=>[Math.round(i*nd/6),Math.round((i+1)*nd/6)-1];
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
   [t6(0),'Items Tracked',{f:`COUNTA(${rng('sku')})`,v:K.items,s:'boxN'},{f:`COUNTIF(${rAtt},"Yes")&" need attention today"`,v:attn+' need attention today'}],
   [t6(1),'Units On Hand',{f:`SUM(${rng('onhand')})`,v:K.onHand,s:'boxN'},{f:`TEXT(SUMPRODUCT(${rng('onhand')},${rng('price')})/1000000,"$0.00")&"M at unit price"`,v:'$'+(sumP/1e6).toFixed(2)+'M at unit price'}],
   [t6(2),'On Order',{f:`SUM(${rng('transit')})+SUM(${rng('openpo')})`,v:K.transit+K.openPO,s:'boxN'},{f:`TEXT(SUM(${rng('transit')}),"#,##0")&" transit + "&TEXT(SUM(${rng('openpo')}),"#,##0")&" PO"`,v:E.fmtNum(K.transit)+' transit + '+E.fmtNum(K.openPO)+' PO'}],
   [t6(3),'Weeks Of Supply',{f:`(SUM(${rng('onhand')})+SUM(${rng('transit')}))/SUM(${rng('fcstwk')})`,v:K.wos,s:'boxN1'},{f:`COUNTIFS(${rng('wos')},"<4",${rng('onhand')},">=0",${rng('fcstwk')},">0")&" items under 4 weeks, "&COUNTIF(${rng('wos')},">${ovr}")&" over ${ovr}"`,v:K.lowCover+' items under 4 weeks, '+K.highCover+' over '+ovr}],
   [t6(4),'Forecast Accuracy',{f:"'Forecast Accuracy'!C2",v:1-AC.wmape,s:'boxPct'},{f:`"Miss (WMAPE) "&TEXT('Forecast Accuracy'!D2,"0.0%")&", last 13 weeks"`,v:'Miss (WMAPE) '+(AC.wmape*100).toFixed(1)+'%, last 13 weeks'}],
   [t6(5),'Forecast Bias',{f:"'Forecast Accuracy'!E2",v:AC.bias,s:'boxPctS'},{f:`IF('Forecast Accuracy'!E2<0,"Forecast runs low (sales beat it)","Forecast runs high")`,v:AC.bias<0?'Forecast runs low (sales beat it)':'Forecast runs high'}]];
  TILE.forEach(([[c0,c1],t,val_,sub])=>{span(11,c0,c1,{v:t,s:'boxT'});span(12,c0,c1,val_);span(13,c0,c1,Object.assign({s:'boxS'},sub))});
  R(11).h=22;R(12).h=40;R(13).h=20;
  /* AI suggestions and your orders: a second row of tiles, live over the Master List */
  const AT=A.aiTiles(),cnt=(f)=>f;
  span(15,0,nd-1,{v:'AI Recommendations And Your Orders (all items, not filtered by the picks above)',s:'sect'});R(15).h=22;
  const NOTN=`${rng('stockout')},"<>None",${rng('stockout')},"<>n/a"`;
  const AITILE=[
   [t6(0),AT[0],{f:`COUNTIF(${rng('ordovr')},">0")`},{f:`TEXT(SUM(${rng('ordovr')}),"#,##0")&" units in total"`}],
   [t6(1),AT[1],{f:`COUNTIFS(${rng('onorder')},0,${NOTN})`},null],
   [t6(2),AT[2],{f:`COUNTIFS(${rng('onorder')},">0",${NOTN})`},null],
   [t6(3),AT[3],{f:`COUNTIF(${rng('peakcover')},"Thin")+COUNTIF(${rng('peakcover')},"Short")`},null],
   [t6(4),AT[4],{f:`COUNTIF(${rng('plan')},">0")`},{f:`COUNTIF(${rng('cmptxt')},"Near AI Qty")&" near the AI Qty"`}],
   [t6(5),AT[5],{f:`COUNTIF(${rng('cmptxt')},"Below*")+COUNTIF(${rng('cmptxt')},"Above*")`},null]];
  AITILE.forEach(([[c0,c1],[t,n,sub],fN,fS])=>{span(16,c0,c1,{v:t,s:'boxT'});span(17,c0,c1,Object.assign({v:+String(n).replace(/,/g,''),s:'boxN'},fN));span(18,c0,c1,fS?Object.assign({v:sub,s:'boxS'},fS):{v:sub,s:'boxS'})});
  R(16).h=22;R(17).h=40;R(18).h=20;
  /* totals line + list header */
  const first=22,last=21+N,matched0=allRows.filter(dashMatch);
  span(20,0,2,{v:'Items matching your choices:',s:'label'});put(20,3,{f:`COUNT(${rShow})`,v:run,s:'int'});
  span(20,4,6,{v:'Total $ at stake:',s:'label'});put(20,7,{f:`SUMIFS(${rng('dollars')},${rShow},">0")`,v:sumD(allRows.filter(dashMatch)),s:'money0'});span(20,8,10,{v:'No decision needed:',s:'label'});put(20,11,{f:`IF($B$4="All decisions",D20-${BOX.map(b=>C(b[0])+'7').join('-')},0)`,v:matched0.filter(r=>!r.decision).length,s:'int'});R(20).h=24;
  DK.forEach((k,c)=>put(21,c,{v:dh(k),s:AIS.has(k)?'headAI':'head'}));R(21).h=34;
  const CTRK=new Set(['status','sku','stockout','orderby','readyd','nextarr','arr2','peakcover','promo','nextpromo','peak','peakwk','abc','attn','gaptype','conf','notedate']),STY=new Proxy({dollars:'money0',nextarr:'dt',arr2:'dt',stockout:'dt',orderby:'dt'},{get:(o,k)=>o[k]||(AIS.has(k)?sty(k):CTRK.has(k)?'ctr':COLS[k]&&COLS[k].num||'txt')});
  const matched=allRows.filter(dashMatch);
  for(let i=0;i<N;i++){const row=first+i,src=matched[i],hc=`$${C(HC)}${row}`;
    put(row,HC,{f:`IFERROR(MATCH(${i+1},${rShow},0),"")`,v:src?i+1+0:'',s:'txt'});
    DK.forEach((k,c)=>{const rg=rng(k);let v=src?wval(k,src):'';if(k==='dollars'&&src)v=Math.round(src.dollars>0?src.dollars:0);
      put(row,c,{f:`IF(${hc}="","",IF(INDEX(${rg},${hc})="","",INDEX(${rg},${hc})))`,v:v,s:STY[k]})});
    R(row).h=46}
  // helper cell shows the position in the Master List, not the running number
  matched.forEach((r,i)=>{R(first+i)[HC].v=allRows.indexOf(r)+1});
  const TN=['At risk','Watch','Overstocked','No risk'];
  dash.cf.push({ref:`A${first}:A${last}`,rules:TN.map((t,i)=>({type:'cellIs',op:'equal',dxf:[0,1,3,4][i],formula:`"${A.tn(t)}"`}))});
  dash.cf.push(...cfList(DK,first,last));
  dash.freeze=4;
  const CL=changeList(),DR=Math.max(CL.length,1)+1;
  const dropSheet={name:'New And Missing Items',fit:true,widths:[12,11,34,17,12,13,46,12,11,58],freeze:1,filter:CL.length+1,rows:[hdr(['Change','SKU','Product','Line','On Hand','Units On Order','Typed Note From Previous Run','Qty To Place','Needed By','What To Check']),
    ...(CL.length?CL.map(x=>[{v:x.chg==='New'?'New Today':'Missing Today',s:'ctr'},{v:x.id,s:'ctr'},{v:x.name,s:'txt'},{v:x.sub,s:'txt'},{v:x.onHand,s:'int'},{v:x.po,s:'int'},{v:x.note,s:'txt'},x.plan===''?{v:'',s:'txt'}:{v:x.plan,s:'int'},{v:x.by,s:'ctr'},{v:x.check,s:'txt'}]):[[{v:'Nothing new or missing today.',s:'txt'}]])],cf:[{ref:`A2:A${DR}`,rules:[{type:'cellIs',op:'equal',dxf:3,formula:'"New Today"'},{type:'cellIs',op:'equal',dxf:1,formula:'"Missing Today"'}]}]};
  span(3,0,nd-1,{f:`COUNTIF(${rng('filest')},"New Today")&" new items in the latest files (marked New Today on the Master List, nothing typed yet). "&SUMPRODUCT(--(((${rng('note')}<>"")+(${rng('ovr')}<>"")+(${rng('plan')}<>""))>0))&" items carry typed work from the previous file. "&COUNTIF('New And Missing Items'!$A$2:$A$${DR},"Missing Today")&" items from the previous run are missing from today\'s files (see New And Missing Items)."`,v:carryText(),s:'note'});R(3).h=22;
  const notesSheet=mkL(allRows.filter(r=>A.noteFor(r.id)),'Notes',NK);
  const sheets=[dash,dataSheet,plan,accSheet,itemSheet,histSheet,
   notesSheet,dropSheet,
   {name:'Recipe',fit:true,widths:[30,110],rows:[hdr(['Setting','What It Is Set To']),...rec.map(r=>[{v:r[0],s:'bold'},{v:r[1],s:'txt'}]),[{v:'Where To Work',s:'bold'},{v:'Work on the light yellow Master List (Work Here) tab. It is the only tab you type in: Filter any column, and type in the light yellow columns (peak override, order quantity to place, needed by, note and note date). Every other tab reads from it, so what you type shows on the Dashboard, 12-Week Plan, Seasonal And Promo Lifts, Notes and New And Missing Items tabs (the Sales History tab shows each item\'s status, product and line from it). Changes only flow one way, from the Master List out, so those other tabs are locked to stop typing that would be lost. To edit one anyway: Review, then Unprotect Sheet (no password).',s:'txt'}],
   [{v:'One File Per Planner',s:'bold'},{v:'Each planner has their own file, built from their own demand line, so nobody shares edits and there is no need to track who wrote a note. To set one up for someone else, give them the same recipe and point it at the files for their line.',s:'txt'}],
   [{v:'Does It Work On Its Own?',s:'bold'},{v:'Yes. Every number and formula is inside this one file, so it works after you download it, with no links to other files. It does not refresh by itself: Each run the run builds a new file. In the real setup the run opens the previous file first and copies the light yellow columns across by SKU, so typed work carries forward.',s:'txt'}],
   [{v:'What Updates And What Does Not',s:'bold'},{v:'Notes and the Dashboard, Seasonal And Promo Lifts, Notes and New And Missing Items lists update as soon as you change the Master List. Sales History keeps its weekly numbers from the Reporting tool, so they only change with the scheduled run. Calculated columns such as Weeks Of Supply and Stock-Out Week are written by the scheduled run, so retyping On Hand by hand will not recompute them. Fix numbers in the source system and let the next run rebuild them.',s:'txt'}],
   [{v:'Dashboard',s:'bold'},{v:'Two dropdown pickers (decision and status) drive the four count boxes and the list. Hidden columns on the Master List sheet and on the Dashboard feed it, so do not delete them.',s:'txt'}]],freeze:1}];
  sheets.forEach((sh,i)=>{if(i>0&&sh.name!==MASTER)sh.tab=sh.tab||'FFA6A6A6';if(sh.name!==MASTER)sh.prot=true;sh.fit=sh.fit||(sh.name!==MASTER&&['Notes','Seasonal And Promo Lifts','Sales History','New And Missing Items'].includes(sh.name))});
  const blob=MiniXlsx.build(sheets),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='Planning-Sheet-SAMPLE-'+A.TODAY_ISO+'.xlsx';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
  return sheets;
}
/* ---------- home ---------- */
const ROUTES={
 manual:['Manual Export','You export the files yourself. No connection needed.','You export the files from your sources (Anaplan and Tableau here) and put them in the shared folder. History works the same way: Export three years of weekly sales once and save it as the reference file.','Export access in each source, and your company\'s OK to use the data with the AI tool. Nothing to set up.'],
 folder:['Automated Export','Your sources export on a schedule.','Each source exports on a schedule instead of by hand and saves the file into the shared folder. The AI reads the newest files, checks them and saves the finished sheet back there. It works with any approved AI tool and any source that can export a file. Anaplan and Tableau do not save straight into SharePoint on their own, so one small step is needed to move each export into the folder.','A scheduled export in each source, and a way to save it to the shared folder. Set it up yourself if you have the access. If it is blocked on your side, ask IT to set it up.'],
 copilot:['Copilot Connection','Direct connection, if your company allows it.','Microsoft Copilot can reach some sources directly, without a folder. Anaplan names Copilot as a supported client. For Tableau, Microsoft offers a Tableau Cloud connector, but it is built to find and ask about dashboards, and Microsoft does not say it exposes the full numbers. This needs a test on one real dashboard.','Copilot access to each source, and a quick test to see what it can actually read. Turn it on yourself if you can. If it is blocked, ask IT.'],
 chatgpt:['ChatGPT Connection','Direct connection, if your company allows it.','ChatGPT can connect straight to Tableau, because Tableau lists ChatGPT as a supported client. Anaplan does not list ChatGPT, so it needs a custom connector built for it or an outside bridge before ChatGPT can pull from it. Each person signs in with their own account, and a pasted API key does not work.','A connector for each source: Tableau\'s already exists, Anaplan needs a custom connector or an outside bridge. ChatGPT scheduled tasks cannot take file uploads, so a scheduled unattended run is not confirmed. Set it up yourself if allowed. If it is blocked, ask IT.'],
};
window.__route=()=>route;let route='manual';
function miniSheet(){
  const rows=sheetRows('attn').slice(0,3);
  return `<div class="mini-sheet" aria-hidden="true">${rows.map(r=>`<div class="ms-r"><span class="ms-st ${({'At risk':'t-risk','Watch':'t-watch','Overstocked':'t-much'})[r.tier]||'t-ok'}">${esc(val('status',r))}</span><span class="ms-n">${esc(val('product',r))}</span><span class="ms-d">${esc(r.id)}</span></div>`).join('')}</div>`;
}
const FLOWS={
 manual:[['Anaplan + Tableau','Your sources'],['You export','Files by hand'],['Shared folder','Files land here'],['AI agent','Checks and combines'],['Planning sheet','Saved to the folder']],
 folder:[['Anaplan + Tableau','Your sources'],['Scheduled export','Runs on its own'],['Shared folder','One step moves each file'],['AI agent','Checks and combines'],['Planning sheet','Saved to the folder']],
 copilot:[['Anaplan + Tableau','Your sources'],['Copilot connection','Direct, no folder'],['AI agent (Copilot)','Checks and combines'],['Planning sheet','Saved to the folder']],
 chatgpt:[['Anaplan + Tableau','Your sources'],['ChatGPT connector','Tableau ready, Anaplan built'],['AI agent (ChatGPT)','Checks and combines'],['Planning sheet','Saved to the folder']]};
function flowSvg(stages,label){
  const n=stages.length,W=1000,gap=34,bw=(W-gap*(n-1))/n,H=118,y=22,bh=74;
  const cx=i=>i*(bw+gap),mid=y+bh/2;
  let sv=`<svg class="flowmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}: ${esc(stages.map(x=>x[0]).join(', then '))}">`;
  sv+=`<path id="fl${label.length}" d="M${bw} ${mid} L${W-bw} ${mid}" fill="none" stroke="none"/>`;
  for(let i=0;i<n-1;i++){const x1=cx(i)+bw,x2=cx(i+1);sv+=`<path d="M${x1} ${mid} L${x2} ${mid}" stroke="var(--brand)" stroke-width="3" opacity=".45"/><path d="M${x2-9} ${mid-6} L${x2} ${mid} L${x2-9} ${mid+6}" fill="none" stroke="var(--brand)" stroke-width="3" opacity=".7"/>`;
    for(let k=0;k<2;k++)sv+=`<circle class="flow-dot" r="5.5" fill="var(--brand)" opacity="0"><animateMotion dur="2.4s" begin="${(k*1.2+i*.3).toFixed(2)}s" repeatCount="indefinite" path="M${x1} ${mid} L${x2-10} ${mid}"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.9;1" dur="2.4s" begin="${(k*1.2+i*.3).toFixed(2)}s" repeatCount="indefinite"/></circle>`}
  stages.forEach((st_,i)=>{const last=i===n-1,x=cx(i);
    sv+=`<g><rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="var(--card)" stroke="${last?'#00838F':'var(--brand)'}" stroke-width="${last?3:2}"/>
     <text x="${x+bw/2}" y="${y+33}" text-anchor="middle" font-size="${n>4?15:17}" font-weight="700" fill="currentColor">${esc(st_[0])}</text>
     <text x="${x+bw/2}" y="${y+56}" text-anchor="middle" font-size="${n>4?12.5:14}" fill="currentColor" opacity=".78">${esc(st_[1])}</text></g>`});
  return sv+'</svg>'}

/* one source for every view of how each route connects: the matrix, the route box, the map and the Setup Options table */
const SYSN=['Anaplan','Tableau'],RSTAT={yes:['✔ Yes','yes'],part:['▲ Partly','part'],no:['✕ No direct connection','no']};
const RD={
 manual:{name:'Manual Export',group:'folder',small:'You put the files in the shared folder',limit:'Manual every run. Also how history is loaded.',
  lead:['ok','Works for both systems.'],extra:['<b>History:</b> Export three years of weekly sales once and save it as the reference file.'],needs:'Export access in each source, and your company\'s OK to use the data with the AI tool. Nothing to set up.',
  sys:[{s:'yes',t:'You export the file by hand, if your login has export access.',why:'It is the most dependable path. You choose what is exported, so the file has the full numbers, and nothing needs to be set up.',node:['You Export','By hand, to the folder'],via:'folder'},{s:'yes',t:'You export the view data by hand, if your login has export permission.',why:'It is the most dependable path. You choose what is exported, so the file has the full numbers, and nothing needs to be set up.',node:['You Export','By hand, to the folder'],via:'folder'}]},
 folder:{name:'Automated Export',group:'folder',small:'Sources put the files in the shared folder',limit:'One step per source to move the file. You or IT sets it up.',
  lead:['warn','Partly works for both systems. Each needs one extra step to reach the shared folder.'],extra:[],needs:'You or IT to set up each scheduled export and the step that moves the file.',
  sys:[{s:'part',t:'Scheduled exports go to Amazon S3, Azure Blob or Google BigQuery, not SharePoint. A step is needed to move the file.',why:'It removes the manual export, but Anaplan does not send scheduled files to the shared folder itself, so one step is still needed to move each file there.',node:['Scheduled Export','Plus a step to move it'],via:'folder'},{s:'part',t:'Subscriptions are email images or PDFs. Data comes through Prep file output or the REST API. A step is needed to move the file.',why:'Subscriptions only send images or PDFs, which are not data files. Data has to come from Prep or the REST API, and a step then moves it to the shared folder.',node:['Scheduled Export','Plus a step to move it'],via:'folder'}]},
 copilot:{name:'Copilot',group:'direct',small:'Direct, no folder needed',limit:'Full Tableau numbers not stated. Licensing for Anaplan not stated.',
  lead:['warn','Connects directly to Anaplan. Tableau only partly connects, so add a manual or automated export for the full Tableau numbers.'],extra:['<b>So you may need two routes:</b> Copilot for Anaplan, and a manual or automated export for Tableau so its file lands in the shared folder.','<b>Not confirmed:</b> Whether Copilot can save the data it pulls as a file in the shared folder. Test this in a pilot.'],needs:'A Copilot license, a Microsoft 365 AI admin and a Tableau site admin for the connector, plus an export route for Tableau.',
  sys:[{s:'yes',t:'Anaplan\'s AI Gateway names Microsoft Copilot. Licensing is not stated.',why:'Anaplan names Copilot as a supported client, so Copilot can reach Anaplan data without a file being exported first.',node:['Copilot Connection','Works directly'],via:'direct'},{s:'part',t:'Microsoft\'s connector finds and answers questions about dashboards. It does not say the full numbers are included. Tableau Cloud only.',why:'The connector can find and answer questions about dashboards, but nothing says it returns the full numbers the spreadsheet needs. An export is the way to be sure the full data arrives in the folder.',node:['Copilot Connection','Partly, not full numbers'],via:'direct'}]},
 chatgpt:{name:'ChatGPT',group:'direct',small:'Direct, no folder needed',limit:'Scheduled tasks cannot take file uploads.',
  lead:['warn','Connects directly to Tableau only. Anaplan has no direct connection, so it needs a manual or automated export to the shared folder.'],extra:['<b>So you need two routes:</b> ChatGPT for Tableau, and a manual or automated export for Anaplan so its file lands in the shared folder.','<b>Not confirmed:</b> Whether ChatGPT can save the data it pulls as a file in the shared folder. Test this in a pilot, or export Tableau too.'],needs:'ChatGPT with connectors turned on, plus an export route for Anaplan.',
  sys:[{s:'no',t:'Needs a custom connector or an outside bridge built first.',why:'Anaplan does not list ChatGPT as a supported client, so a connector would have to be built first. A manual or automated export is the practical route until then.',node:['No Direct Connection','Use an export instead'],via:'folder'},{s:'yes',t:'Tableau lists ChatGPT as a supported client. Read-only, with a sign-in per person.',why:'Tableau lists ChatGPT as a supported client, so ChatGPT can reach Tableau data without a file being exported first.',node:['ChatGPT Connection','Works directly'],via:'direct'}]}};
const mxCell=x=>`<td class="${RSTAT[x.s][1]}"><b>${RSTAT[x.s][0]}</b><span>${x.t}</span></td>`;
const ROUTEX_OLD={
 manual:{lead:'Works for both systems.',leadCls:'ok',bullets:['<b>What you do:</b> Export the files from Anaplan and Tableau and put them in the shared folder.','<b>History:</b> Export three years of weekly sales once and save it as the reference file.'],needs:'Export access in each source, and your company\'s OK to use the data with the AI tool. Nothing to set up.'},
 folder:{lead:'Partly works for both systems. Each needs one extra step.',leadCls:'warn',bullets:['<b>Anaplan:</b> Scheduled exports go to Amazon S3, Azure Blob or Google BigQuery, not SharePoint. A step moves the file to the shared folder.','<b>Tableau:</b> Subscriptions are email images or PDFs. Data comes through Prep file output or the REST API, and a step moves it to the shared folder.'],needs:'You or IT to set up each scheduled export and the step that moves the file.'},
 copilot:{lead:'Connects directly to Anaplan only. Tableau needs a manual or automated export to the shared folder.',leadCls:'warn',bullets:['<b>Anaplan:</b> Yes. Anaplan\'s AI Gateway names Microsoft Copilot. Licensing is not stated.','<b>Tableau:</b> Partly. Microsoft\'s connector finds and answers questions about dashboards, but it does not say the full numbers are included (Tableau Cloud only). Use an export for the data.','<b>So you need two routes:</b> Copilot for Anaplan, and a manual or automated export for Tableau.'],needs:'A Copilot license, a Microsoft 365 AI admin and a Tableau site admin for the connector, plus an export route for Tableau.'},
 chatgpt:{lead:'Connects directly to Tableau only. Anaplan needs a manual or automated export to the shared folder.',leadCls:'warn',bullets:['<b>Tableau:</b> Yes. Tableau lists ChatGPT as a supported client. It is read-only, with a sign-in per person.','<b>Anaplan:</b> No direct connection. It needs a custom connector or an outside bridge built first. Use an export for the data.','<b>So you need two routes:</b> ChatGPT for Tableau, and a manual or automated export for Anaplan.'],needs:'ChatGPT with connectors turned on, plus an export route for Anaplan. Scheduled ChatGPT tasks cannot take file uploads.'}};
const NODEINFO={
 anaplan:['Anaplan','The forecast, open orders and ETAs come from here. The AI agent reads them and never writes back.'],
 tableau:['Tableau','Weekly sales and shipments come from here. Three years of history is loaded once and reused on every run.'],
 direct:['Direct connection','This system connects straight to the AI tool, so no file is needed for it.'],
 work:['Use an export','The workaround. A manual or automated export puts this system\'s file in the shared folder. It is used here because the direct connection above is blocked or only partly covers the data, so the export is how the full data is sure to arrive.'],
 folder:['Shared folder','Every system\'s data lands here as files, however it was pulled, so the agent can combine it. The finished custom spreadsheet is saved here too.'],
 hub:['AI agent','Reads the files in the shared folder, combines them, matches renamed columns, holds back files with odd values, keeps new fields and carries your typed notes forward by SKU. The agent is Copilot or ChatGPT, whichever route you chose.'],
 sheet:['Custom spreadsheet','Saved to the shared folder on your schedule. This is the file you open and work in.'],
 email:['Custom email','Optional. The agent opens the finished spreadsheet and sends a written summary with the spreadsheet attached.']};
/* what each route really does for each source (from the vendors' own pages, November 2026) */
const ROUTEROWS={
 manual:[['export','You Export','By hand, to the folder'],['export','You Export','By hand, to the folder']],
 folder:[['export','Scheduled Export','Plus a step to move it'],['export','Scheduled Export','Plus a step to move it']],
 copilot:[['direct','Copilot Connection','Works directly'],['export','Export Needed','Manual or automated']],
 chatgpt:[['export','Export Needed','Manual or automated'],['direct','ChatGPT Connection','Works directly']]};
function flowRich(route){
  const sys=RD[route].sys,B='#2b4cc7',T='#00838F',G='#1f7a34',O='#b45309',R_='#b3261e',col=st=>st==='yes'?G:st==='part'?O:R_;
  const lanes=[];
  sys.forEach((x,i)=>{
    if(x.s==='no')lanes.push({i,kind:'blocked',x,p:1},{i,kind:'work'});
    else if(x.via==='direct'&&x.s==='part')lanes.push({i,kind:'partial',x,p:1},{i,kind:'work'});
    else if(x.via==='direct')lanes.push({i,kind:'direct',x,p:1});
    else lanes.push({i,kind:'export',x,p:1})});
  const LH=100,Y0=20,H=Y0+lanes.length*LH+10,mid=Y0+lanes.length*LH/2-10;
  lanes.forEach((l,k)=>{l.y=Y0+k*LH+10;l.cy=l.y+40});
  const srcY=i=>{const ls=lanes.filter(l=>l.i===i);return ls.reduce((a,l)=>a+l.cy,0)/ls.length-40};
  const agent=route==='copilot'?'Copilot':route==='chatgpt'?'ChatGPT':'ChatGPT or Copilot';
  const N=(id,x,y,w,h,t,sub,stroke,mark,sub2)=>`<g class="flow-node" tabindex="0" role="button" data-node="${id}" aria-label="${esc(t)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="var(--card)" stroke="${stroke}" stroke-width="2.5"${mark==='block'?' stroke-dasharray="7 5"':''}/><text x="${x+w/2}" y="${y+h/2-(sub2?10:3)}" text-anchor="middle" font-size="17" font-weight="800" fill="currentColor">${esc(t)}</text><text x="${x+w/2}" y="${y+h/2+(sub2?9:18)}" text-anchor="middle" font-size="12.5" fill="currentColor" opacity=".82">${esc(sub)}</text>${sub2?`<text x="${x+w/2}" y="${y+h/2+27}" text-anchor="middle" font-size="12.5" font-weight="700" fill="currentColor">${esc(sub2)}</text>`:''}${mark==='block'?`<circle cx="${x+w-6}" cy="${y+6}" r="13" fill="${R_}"/><text x="${x+w-6}" y="${y+11}" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">✕</text>`:''}</g>`;
  const P=(id,d,c,n,dash)=>{let o=`<path id="${id}" d="${d}" fill="none" stroke="${c}" stroke-width="3" opacity=".45"${dash?' stroke-dasharray="6 5"':''}/>`;for(let k=0;k<n;k++)o+=`<circle class="flow-dot" r="6" fill="${c}" opacity="0"><animateMotion dur="3.2s" begin="${(k*3.2/n).toFixed(2)}s" repeatCount="indefinite"><mpath href="#${id}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.08;.9;1" dur="3.2s" begin="${(k*3.2/n).toFixed(2)}s" repeatCount="indefinite"/></circle>`;return o};
  const sx=10,sw=140,lx=190,lw=210,fx=440,fw=130,hx=605,hw=150,ox=795,ow=195;
  let sv=`<svg class="flowmap rich" viewBox="0 0 1000 ${H}" role="group" aria-label="Animated data flow for ${esc(RD[route].name)}">`;
  lanes.forEach((l,k)=>{const sc=srcY(l.i)+40,c=l.kind==='work'?B:l.kind==='export'?col(l.x.s):col(l.x.s);
    sv+=P('ps'+k,`M${sx+sw} ${sc} C ${sx+sw+20} ${sc}, ${lx-20} ${l.cy}, ${lx} ${l.cy}`,c,l.kind==='blocked'?0:1);
    if(l.kind!=='blocked')sv+=P('pl'+k,`M${lx+lw} ${l.cy} C ${lx+lw+20} ${l.cy}, ${fx-20} ${mid}, ${fx} ${mid}`,c,2,l.kind==='partial')});
  sv+=P('pf',`M${fx+fw} ${mid} L${hx} ${mid}`,B,2)+P('ph',`M${hx+hw} ${mid} C ${hx+hw+20} ${mid}, ${ox-20} ${mid-60}, ${ox} ${mid-60}`,T,2)+P('pe',`M${ox+ow/2} ${mid-20} L${ox+ow/2} ${mid+10}`,T,1);
  lanes.forEach((l,k)=>{
    if(l.kind==='work')sv+=N('work'+l.i,lx,l.y,lw,80,'Use An Export','Manual or automated',B,'','To get the full data');
    else sv+=N('conn'+l.i+l.x.s,lx,l.y,lw,80,l.kind==='blocked'?'No Direct Connection':l.x.node[0],l.kind==='blocked'?'Blocked, so use the export':l.x.node[1],col(l.x.s),l.kind==='blocked'?'block':'')});
  sys.forEach((x,i)=>{sv+=N(i?'tableau':'anaplan',sx,srcY(i),sw,80,SYSN[i],i?'Sales, shipments':'Forecast, POs, ETAs',B)});
  sv+=N('folder',fx,mid-40,fw,80,'Shared Folder','Every file lands here',B)+N('hub',hx,mid-70,hw,140,'AI Agent',agent,T)+N('sheet',ox,mid-100,ow,80,'Custom Spreadsheet','Saved to the folder',T)+N('email',ox,mid+20,ow,80,'Custom Email','Optional, sheet attached',T);
  sv+=`<text x="${hx+hw/2}" y="${mid+38}" text-anchor="middle" font-size="12" fill="currentColor" opacity=".8">Combines and checks</text></svg>`;
  const legend=`<div class="flowlegend"><span><i style="background:${G}"></i>Yes</span><span><i style="background:${O}"></i>Partly</span><span><i style="background:${R_}"></i>No direct connection (blocked)</span><span><i style="background:${B}"></i>Export to the shared folder</span><span class="conf">Same ratings as the table below.</span></div>`;
  const steps=`<ol class="flowsteps"><li><b>Pull:</b> Each system is pulled its own way, as shown above.</li><li><b>Land:</b> Every system's data ends up as a file in the same shared folder.</li><li><b>Combine:</b> The AI agent (${agent}) combines and checks the files into your custom spreadsheet.</li><li><b>Email (optional):</b> The agent opens the finished spreadsheet, checks it and sends your custom email with the spreadsheet attached.</li></ol>`;
  return `<div class="row" style="justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px"><span class="conf">Click any box to see what it does.</span><button class="btn sm" id="fl-pause" aria-pressed="false">Pause</button></div><div class="flowscroll">${sv}</div>${legend}${steps}<div class="flowinfo" id="flowinfo" aria-live="polite"><b>${NODEINFO.folder[0]}.</b> ${NODEINFO.folder[1]}</div>`}
function wireFlow(root){const route=window.__route();const svg=root.querySelector('.flowmap.rich'),pb=root.querySelector('#fl-pause'),info=root.querySelector('#flowinfo');if(!svg)return;let paused=false;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){svg.pauseAnimations();paused=true;pb.textContent='Play'}
  pb.onclick=()=>{paused=!paused;paused?svg.pauseAnimations():svg.unpauseAnimations();pb.textContent=paused?'Play':'Pause';pb.setAttribute('aria-pressed',String(paused))};
  root.querySelectorAll('.flow-node').forEach(g=>{const go=()=>{const id=g.dataset.node,m=/^conn(\d)(yes|part|no)$/.exec(id),x=m?RD[route].sys[+m[1]]:null,n=x?[SYSN[+m[1]]+': '+RSTAT[x.s][0].replace(/^\S+ /,''),x.t+' Why this path: '+x.why+(x.s==='no'?' This path is blocked, so the export below it is the workaround.':'')]:NODEINFO[id.replace(/^work\d$/,'work')];info.innerHTML=`<b>${esc(n[0])}.</b> ${esc(n[1])}`};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}})}
function renderHome(){
  const r=ROUTES[route];
  $('#v-home').innerHTML=`<div class="page">
  <div class="hero"><h1>Your Custom Planning Spreadsheet, Built By AI From The Data You Already Have</h1>
  <p>Five steps. No code. You explain what you want to your AI agent in plain words, and your custom spreadsheet is built on your schedule: Daily, weekly, or whenever you ask.</p></div>
  <div class="steps">
   <div class="card step s1"><div class="shead"><div class="num">1</div><h2>Connect Your Data</h2></div><p>Pick how your files reach your AI agent. The map below follows your choice.</p>
    <div class="s1-body"><div class="routes" role="group" aria-label="Ways to connect">${Object.keys(ROUTES).map(k=>`<button class="route" data-route="${k}" aria-pressed="${route===k}">${ROUTES[k][0].replace(' Connection','')}</button>`).join('')}</div>
    <div class="routebox" id="routebox"><h3>${RD[route].name}</h3><div class="route-lead ${RD[route].lead[0]}">${RD[route].lead[1]}</div><ul class="mini">${RD[route].sys.map((x,k)=>`<li><b>${SYSN[k]}:</b> ${RSTAT[x.s][0].replace(/^\S+ /,'')}. ${x.t}<ul class="sub"><li><b>Why this path:</b> ${x.why}</li></ul></li>`).join('')}${RD[route].extra.map(e=>`<li>${e}</li>`).join('')}<li><b>Why a shared folder:</b> The AI agent builds the spreadsheet from files in one folder, so every route ends there, even when part of the data is pulled directly.</li><li><b>What it needs:</b> ${RD[route].needs}</li></ul></div></div>
    <div class="flowwrap"><h3 class="flowh">Data Flow: ${esc(r[0])}</h3>${flowRich(route)}</div></div>
   <div class="card step"><div class="shead"><div class="num">2</div><h2>Customize With Your AI Agent</h2></div><p>Prepare your custom spreadsheet. Describe it, show examples of sheets you like, and explain how to combine your data.</p>
    <button class="btn pri go" data-nav="custom">See Customize</button></div>
   <div class="card step"><div class="shead"><div class="num">3</div><h2>Access Your Custom Spreadsheet</h2></div>
    <ul class="mini"><li><b>3A:</b> From the shared folder.</li><li><b>3B:</b> From your custom email.</li></ul>
    <button class="btn pri go" data-nav="sheet">See The Spreadsheet</button></div>
   <div class="card step"><div class="shead"><div class="num">4</div><h2>Create A Custom Email Delivery</h2></div><span class="pill">Recommended Option</span><p>Your agent checks the finished spreadsheet and emails you a written summary in your own format.</p>
    <button class="btn go" data-nav="email">See The Email</button></div>
   <div class="card step"><div class="shead"><div class="num">5</div><h2>Re-Customize Anytime</h2></div><span class="pill">Optional</span><p>Change columns, colors or rules whenever you need. Use the same flow, and the next run picks it up.</p>
    <button class="btn go" data-nav="custom" data-hash="recustom">See How</button></div>
  </div>
  <h2 class="sec-h">What Connects To What</h2>
  <p class="pg-sub" style="margin-top:0">Checked against each company's own pages in November 2026. Shown for Anaplan and Tableau, the two sources in this example. Any other source that can export a file can go in the shared folder.</p>
  <div class="card mx-wrap"><table class="mx"><thead><tr class="grp"><th></th><th colspan="2">Files Land In The Shared Folder</th><th colspan="2">Direct Connection To The AI</th></tr><tr><th></th>${Object.keys(RD).map(k=>`<th>${RD[k].name}</th>`).join('')}</tr></thead><tbody>${SYSN.map((n,i)=>`<tr><th>${n}</th>${Object.keys(RD).map(k=>mxCell(RD[k].sys[i])).join('')}</tr>`).join('')}</tbody></table></div>
  <div class="card rule" style="margin-top:16px"><b>Which One To Pick?</b><span>Use whichever one works for you today. Manual export needs no setup. Automated export or a direct connection removes the manual step. Try setting it up yourself first, and ask IT only if something is blocked.</span></div>
  <p style="margin-top:18px"><button class="btn pri" data-nav="options">See Setup Options And Limits</button></p>
  </div>`;
  const h=$('#v-home');
  $$('[data-route]',h).forEach(b=>b.onclick=()=>{route=b.dataset.route;renderHome()});wireFlow(h);
  $$('[data-nav]',h).forEach(b=>b.onclick=()=>{go(b.dataset.nav);if(b.dataset.hash)setTimeout(()=>{const e=document.getElementById(b.dataset.hash);if(e)e.scrollIntoView({behavior:'smooth',block:'start'})},60)});
}
function renderOptions(){
  $('#v-options').innerHTML=`<div class="page"><div class="pg-h"><h1>Setup Options</h1></div>
  <p class="pg-sub">This is the detail behind Step 1. It lists every way to connect, how to run it on your schedule, how to bring Anaplan and Tableau together, and why history matters. Checked against each company's own pages in November 2026.</p>
  <h2 class="sec-h" style="margin-top:8px">Ways To Connect</h2>
  <div class="card mx-wrap"><table class="mx"><thead><tr><th>Option</th><th>Anaplan</th><th>Tableau</th><th>Main Limit</th></tr></thead><tbody>
   ${Object.keys(RD).map(k=>`<tr><th>${RD[k].name}<small>${RD[k].small}</small></th>${mxCell(RD[k].sys[0])}${mxCell(RD[k].sys[1])}<td>${RD[k].limit}</td></tr>`).join('')}
   <tr><th>Split: ChatGPT And Copilot<small>Both save to the folder, Copilot merges</small></th><td class="no"><b>✕ Not until built</b><span>Anaplan connector must be built first.</span></td><td class="yes"><b>✔ Yes</b><span>Through ChatGPT.</span></td><td>Two tools to approve. Saving files from ChatGPT to the folder is not confirmed.</td></tr>
   <tr><th>Keep Separate<small>One sheet per system</small></th><td class="yes"><b>✔ Yes</b><span>Its own sheet.</span></td><td class="yes"><b>✔ Yes</b><span>Its own sheet.</span></td><td>No flags that need both systems.</td></tr>
  </tbody></table></div>
  <p class="conf" style="margin:8px 0 0">Manual export and automated export are two ways to fill the same shared folder. ChatGPT and Copilot connect to the systems directly and skip the folder.</p>
  <h2 class="sec-h">Ways To Run It On Your Schedule</h2>
  <p class="pg-sub" style="margin-top:0">Three possible paths, from simplest to most automatic. Each one has limits, listed honestly.</p>
  <div class="paths">
   <div class="card path"><span class="tagp">Simplest</span><h3>A. You Ask Each Run</h3><p>Open the AI, point it at the files in the shared folder, and ask for the sheet. Takes a minute.</p>
    <p class="lim"><b>Limits:</b> Someone has to do it every run. Wording can change the result a little, so save a standard request.</p></div>
   <div class="card path"><span class="tagp">Same Every Run</span><h3>B. Scheduled, Same Sheet Every Run</h3><p>A scheduled flow in Microsoft's cloud copies a template, loads the files, applies the colors and flags, and saves the sheet in the folder. No prompt, and your computer can be off.</p>
    <p class="lim"><b>Limits:</b> Needs permission to run the flow, plus a one-time build and test. Ask IT if it is blocked. Each Microsoft piece is documented, but the full chain still needs a pilot. Changes mean updating the script.</p></div>
   <div class="card path"><span class="tagp">Most Flexible</span><h3>C. A Scheduled AI Agent</h3><p>An AI agent runs on a schedule and uses judgment, such as writing a written summary.</p>
    <p class="lim"><b>Limits:</b> Runs use credits, use the builder's sign-in, and admins can block them. Output can vary from run to run, and building a formatted Excel file this way is not confirmed.</p></div>
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
   <ul><li><b>Short vs last year:</b> Compares supply to what the same weeks needed last year.</li><li><b>Promo repeat:</b> Measures how much last year's promo lifted sales.</li><li><b>New item forecast:</b> Compares to how similar past launches sold.</li><li><b>Stock-outs:</b> Removes weeks last year when sales were capped by empty shelves.</li></ul>
   <p class="conf">The demo uses three years of weekly history. With no connection, export it by hand once, save it as the reference file in the shared folder, and refresh it when needed. Every scheduled run reads it.</p></div>
  <h2 class="sec-h">Who Does What</h2><p class="pg-sub" style="margin-top:0">Three roles, each with a clear job.</p>
  <div class="who"><div class="card"><h3>You</h3><p>Say what you need and what you are not seeing. Decide what to do about each flagged item.</p></div>
   <div class="card"><h3>The AI</h3><p>Reads the files, checks them, builds the sheet, writes a written summary, and keeps your preferences.</p></div>
   <div class="card"><h3>IT, If Something Is Blocked</h3><p>We do not know yet what is blocked. Try it yourself first. If your access is blocked, IT sets it up or opens it up.</p></div></div>
  <div class="card it"><h3 class="it-h">If You Need IT: What Each System Can Do</h3>
   <p><b>Automated export route</b></p><ul>
    <li><b>Anaplan:</b> Its scheduled integrations (CloudWorks) export to Amazon S3, Azure Blob or Google BigQuery. SharePoint and OneDrive are not listed, so a step is needed to move the file.</li>
    <li><b>Tableau:</b> Scheduled subscriptions are email only, as a PNG image or PDF, not a data file. Other options are Tableau Prep flows that output files, or the REST API, which returns summary-level view data as CSV to people with export permission.</li>
    <li><b>Excel:</b> The Power Automate Excel connector cannot create a workbook or format one directly. It can add rows to a copy of a template and run Office Scripts.</li></ul>
   <p><b>ChatGPT route</b></p><ul>
    <li><b>Tableau:</b> Tableau's own documentation lists ChatGPT as a supported client of its connector. Sign-in is per person, and the connector is read-only.</li>
    <li><b>Anaplan:</b> Anaplan's AI Gateway does not name ChatGPT. It needs a custom connector or an outside bridge.</li>
    <li><b>Limits:</b> ChatGPT connectors need a hosted server and a sign-in per person. Scheduled tasks allow 10 active tasks and no file uploads, so unattended scheduled runs are not confirmed.</li></ul>
   <p><b>Copilot route</b></p><ul>
    <li><b>Anaplan:</b> The AI Gateway names Microsoft Copilot as a client. Its page is inconsistent on read-only versus write-back, and does not state licensing.</li>
    <li><b>Tableau:</b> Microsoft's Tableau Cloud connector indexes published sheets and details such as name, project, workbook and tags. It needs Tableau Cloud (not Server), a Microsoft 365 AI admin and a Tableau site admin. Microsoft's pages do not say whether the numbers behind a dashboard are included.</li>
    <li><b>Scheduled runs:</b> Copilot Studio agents can run on a repeating schedule. Runs use Copilot Credits, use the maker's sign-in, and admins can block them.</li>
    <li><b>Not confirmed:</b> That Copilot can produce a fully formatted Excel file on its own. This is the first thing to test in a pilot.</li></ul>
   <p class="conf">Last checked November 2026 from the vendors' own pages. Confirm with IT before relying on any of this.</p>
   <p class="conf">Sources: <a href="https://help.anaplan.com/cloudworks-96f951fe-52fc-45a3-b6cb-16b7fe38e1aa" target="_blank" rel="noopener">Anaplan CloudWorks</a> · <a href="https://help.tableau.com/current/online/en-us/subscribe_user.htm" target="_blank" rel="noopener">Tableau subscriptions</a> · <a href="https://help.tableau.com/current/online/en-us/prep_conductor_schedule_flow_task.htm" target="_blank" rel="noopener">Tableau Prep flows</a> · <a href="https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/" target="_blank" rel="noopener">Excel connector</a> · <a href="https://www.anaplan.com/platform/anaplan-ai-gateway/" target="_blank" rel="noopener">Anaplan AI Gateway</a> · <a href="https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/tableau-cloud-deployment" target="_blank" rel="noopener">Tableau connector for Copilot</a> · <a href="https://learn.microsoft.com/microsoft-copilot-studio/authoring-triggers-about" target="_blank" rel="noopener">Copilot Studio triggers</a></p></div>
  </div>`;
  const o=$('#v-options');
  $$('[data-nav]',o).forEach(b=>b.onclick=()=>go(b.dataset.nav));
  }
/* ---------- customize ---------- */
const hello=()=>({w:'ai',t:'This is a simulated practice chat. Tap an example below, or type a request. Nothing on this site changes.'});
let msgs=[hello()];
const SUG=['I need the supplier lead time.','Show me last year\'s sales for the same weeks.','Add the ABC class.','Add the peak months and promo status.','Show the peak lift and how many extra units it means.','Show which items were out of stock last peak.','Show the AI forecast next to the system forecast.','Compare my order quantity with the AI Recommended Qty.','Show how many units to add for the peak and promo, and why.','Show last year\'s promo weeks and the units it sold.','Show whether the promo falls inside the peak weeks.','Add the order quantity I plan to place.','Add forecast accuracy for each item.','Add a column for my notes.','Remove confidence.','Show all items, not just the ones that need attention.'];
const PAT=[['aifdiff',/ai.*(vs|versus|minus|differ).*(system )?forecast|forecast.*(difference|gap).*ai/],['nextarrq',/arrival (qty|quantity|units)|units arriving/],['arr2',/second arrival|2nd arrival|later arrival/],['aifcst',/ai (suggested )?forecast|forecast.*(from|by) (the )?ai|ai.*forecast/],['cmpai',/difference.*ai|minus ai|how far.*ai/],['cmptxt',/compare.*ai|compared to (the )?ai|vs\.? (the )?ai|close to (the )?ai|match (the )?ai|my (qty|quantity).*ai/],['stocklp',/out of stock last|stock last peak|stock.?out last (year|peak)|was there (even )?stock/],['totlift',/peak (\+|and|plus) promo|total (extra |lift )?units|promo and peak units/],['promoext',/promo extra|extra units.*promo|promo.*extra|units.*promo (add|brings)|promo.*units.*add/],['overlap',/overlap|(inside|during|in) (the )?peak.*promo|promo.*(inside|during|falls? in|in) (the )?peak|promo.*peak weeks/],['lypromo',/last (year'?s? )?promo|promo.*last year|previous promo|promo weeks? (from )?last/],['lyunits',/promo units|units sold.*promo|promo.*units sold/],['bump',/peak bump|extra units|bump/],['peakgap',/short of peak|units short.*peak|peak (gap|shortfall)/],['addwhy',/why.*(add|order)|reason.*(add|suggest|order)|explain.*(add|suggest)/],['addqty',/(add|order) (more )?(for|to cover) (the )?(peak|promo)|suggested add|units to add|how many (more )?units.*(peak|promo)|ai (suggest|recommend)/],['ordovr',/total (suggested )?(qty|quantity)|order (qty|quantity) with override|with override/],['ovrwhy',/override reason/],['ovr',/override|my own peak|change the peak/],['plan',/(qty|quantity|order).*(to place|i plan|planned|place)|plan to order/],['needby',/needed by|need.?by date/],['suggest',/suggested order|how much (should i|to) order|order qty|order quantity/],['peaklift',/peak lift|how (big|much).*peak/],['filest',/new items?|new today|new skus?/],['peakcover',/peak cover|thin (cover|stock)|cover into (the )?peak|enough (stock )?for (the )?peak/],['peak',/peak|seasonal|spike|busy (month|season)/],['lift',/lift|promo (impact|effect)/],['nextpromo',/next promo|when .*promo|promo (date|week|calendar)/],['promo',/promo/],['abc',/\babc\b/],['acc',/accuracy|forecast (error|miss)|\bbias\b/],['transit',/in transit|on the water|inbound/],['openpo',/open po|purchase order|\bpos?\b(?! (data|file))/],['nextarr',/next arrival|when .*arriv|\beta\b|delivery date/],['orderby',/order by|when (do i|should i) order/],['stockout',/stock.?out|run out|when .*(out of stock|run out)/],['salesvs',/sales vs|vs forecast|forecast vs|actual vs/],['fcstwk',/forecast (per|a|each) week|weekly forecast|forecast units/],['sales4',/last (3|three) weeks|recent sales/],['ship',/shipped|sell.?in|sell.?through|channel/],['price',/unit price|price|cost/],['gap',/unit gap|how many (units )?short|units short/],['wos',/weeks? of (stock|supply|cover)|how many weeks|wos|\bcover\b/],['ly',/last year|same weeks/],['lt',/lead ?time/],['supplier',/supplier|vendor/],['onhand',/on hand|inventory|how much stock|stock (we have|on)/],['onorder',/on order/],['supply',/total supply|supply units/],['note',/\bnotes?\b|comment/],['conf',/confidence|how sure/],['dollars',/dollar|\$|money|value/],['sub',/subcategor|category|\bline\b/],['todo',/what to do|next step|action/]];
const RM=/remove|hide|drop|don'?t need|do not need|get rid|take out|without|delete/;
function reply(text){
  const t=text.toLowerCase();
  if(/show all|all items|every (item|sku)|not just/.test(t))return 'I would set the Planning Dashboard to start on all statuses, not only the items that need attention. <b>Next run:</b> Your planning spreadsheet opens that way.';
  if(/only.*attention|needs? attention/.test(t)&&!/add|column/.test(t))return 'I would set the Planning Dashboard to start on the items that need attention. <b>Next run:</b> Your planning spreadsheet opens that way.';
  const hit=PAT.find(p=>p[1].test(t));
  if(hit){const k=hit[0],C=COLS[k],has=cols.includes(k);
    if(RM.test(t)){if(C.core)return `I would keep "${C.h}" because the spreadsheet is hard to read without it. I can hide any of the other columns.`;
      if(!has)return `"${C.h}" is not on the Planning Dashboard right now.`;
      return `I would remove "${C.h}" from the Planning Dashboard and from your saved recipe. It stays on the Master List. <b>Next run:</b> Your planning spreadsheet no longer shows it there.`}
    if(has)return `"${C.h}" is already on your Planning Dashboard. This example does not change anything.`;
    return `I can add "${C.h}" to the Planning Dashboard (${C.src||'it is on the Master List'}).${INK.includes(k)?' You would type it on the Master List and it shows on the dashboard. It carries over to the next run by SKU.':''} <b>Next run:</b> Your planning spreadsheet includes it.`}
  return 'I only know a few requests in this practice chat. With your real AI agent you explain it in your own words, and it works out which data to use. If the data is not in your files, it asks where to find it or what file to add.';
}
/* demo video: a looping scripted conversation */
let demoId=0,demoPaused=false;
const SCENES=[
 {you:'I do not see the supplier lead time on my sheet.',ai:'Supplier lead time is in your Anaplan export, so I can add it. I will put Lead Time (Weeks) next to Order By on the Planning Dashboard and the Master List.',ok:'Your Custom Metrics have been updated. Your next custom spreadsheet will include Lead Time (Weeks).'},
 {you:'Show the AI forecast next to the system forecast.',ai:'I will add AI Forecast Per Week and AI Vs System Forecast right after the system forecast column.',ok:'Your Custom Metrics have been updated. Your next custom spreadsheet will include both columns.'},
 {you:'I changed the colors by hand in this file. Here it is.',file:'Planning-Sheet-edited.xlsx',ai:'Thanks. Comparing it with your saved metrics, I see you color Watch rows orange and moved Order By beside Stock-Out Week. I will use both from now on.',ok:'Your Custom Metrics have been updated. Every future run keeps your format.'}];
function startDemo(){
  const box=$('#vid');if(!box)return;const id=++demoId;
  const bubble=(cls,html)=>{const d=document.createElement('div');d.className='vmsg '+cls;d.innerHTML=html;box.appendChild(d);box.scrollTop=box.scrollHeight;return d};
  const youHtml=sc=>esc(sc.you)+(sc.file?`<div class="vfile">${esc(sc.file)}</div>`:'');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){SCENES.forEach(sc=>{bubble('you',youHtml(sc));bubble('ai',esc(sc.ai));bubble('ok','✔ '+esc(sc.ok))});$('#v-pause').hidden=true;return}
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const alive=()=>id===demoId&&document.getElementById('vid')===box;
  const hold=async ms=>{let t=0;while(t<ms){if(!alive())return false;if(demoPaused){await sleep(120);continue}await sleep(50);t+=50}return alive()};
  (async()=>{while(alive()){box.innerHTML='';
    for(const sc of SCENES){
      bubble('you',youHtml(sc));if(!await hold(700))return;
      const th=bubble('ai think','<span></span><span></span><span></span>');if(!await hold(800))return;
      th.className='vmsg ai';th.textContent=sc.ai;box.scrollTop=box.scrollHeight;if(!await hold(1700))return;
      bubble('ok','✔ '+esc(sc.ok));if(!await hold(1900))return}
    if(!await hold(2200))return}})();
}
let emailKind='top';
const EMAILF={top:['Top Items','The five biggest items, then what is new or missing in the files.'],risk:['At Risk Only','A short list of what needs action now.'],week:['Weekly Summary','Counts by status, decisions to make and the biggest three.'],supplier:['By Supplier','Items grouped by supplier, so each call or email to a supplier is one list.'],short:['Three Lines','The short version to read on a phone.']};
function renderEmail(){
  const F=EMAILF;
  $('#v-email').innerHTML=`<div class="page"><div class="pg-h"><h1>Custom Email</h1><span class="pill">Recommended Option</span></div>
  <div class="card sec2"><ul class="mini big"><li><b>Customize it any way you like:</b> You describe the email to your AI agent, and you can change it at any time.</li>
   <li><b>The spreadsheet is attached:</b> The email carries the finished custom spreadsheet, so one message gives you the summary and the file.</li>
   <li><b>Optional:</b> Each person picks their own format, or no email at all. The spreadsheet does not need it.</li>
   <li><b>Read only:</b> The email never changes the data or the calculations.</li></ul></div>
  <h2 class="sec-h">Two Flows, Kept Separate</h2>
  <div class="card flowcard"><div class="flowcap"><b>Flow 1: Build The Spreadsheet</b> <span class="conf">Everyone. It also carries typed work over from the previous run by SKU.</span></div>${flowSvg([['Your sources','Anaplan + Tableau'],['AI agent','Merges and checks the data'],['Planning sheet','Saved to the shared folder']],'Flow 1')}</div>
  <div class="card flowcard"><div class="flowcap"><b>Flow 2: Email The Spreadsheet</b> <span class="pill">Optional</span> <span class="conf">Only if you want an email.</span></div>${flowSvg([['Shared folder','Finished planning sheet'],['AI agent','Opens and checks it'],['Written summary','In your format'],['Your inbox','Spreadsheet attached']],'Flow 2')}</div>
  <h2 class="sec-h">Some Ways You Could Build Your Email</h2><p class="pg-sub" style="margin-top:0">These are only examples. The email can be anything you describe, such as a different length, order, audience or time of day.</p>
  <div class="row" role="group" aria-label="Email examples" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${Object.keys(F).map(k=>`<button class="chip" data-ek="${k}" aria-pressed="${emailKind===k}">${F[k][0]}</button>`).join('')}</div>
  <p class="conf" style="margin:0 0 8px">${F[emailKind][1]}</p>
  <div class="email">${esc(A.emailText(emailKind))}</div>
  <p style="margin-top:18px"><button class="btn pri" data-nav="sheet">See The Spreadsheet</button> <button class="btn" data-nav="custom">Customize Your Email</button></p></div>`;
  const e=$('#v-email');$$('[data-ek]',e).forEach(b=>b.onclick=()=>{emailKind=b.dataset.ek;renderEmail()});$$('[data-nav]',e).forEach(b=>b.onclick=()=>go(b.dataset.nav));
}
const RULEPAT={history_gap:S_=>`Supply more than ${S_.historyGapPct}% below need`,promo_repeat:S_=>`Shortfalls under ${S_.promoCushionPct}% are ignored`,overstock:S_=>`Above ${S_.overstockWOS} weeks of supply`,
 channel_fill:S_=>`Shipments above ${S_.channelRatio}x sales over 8 weeks`,pos_outpacing:S_=>`Sales above ${S_.outpaceRatio}x forecast for ${S_.outpaceWeeks} weeks in a row`,peak_cover:()=>'Under 2 weeks of peak cover',
 eta_slipped:S_=>`Arrival ${S_.etaSlipDays} or more days later than first promised`,stuck_origin:S_=>`Waiting at origin ${S_.stuckExtraDays} or more days longer than usual`,
 missed_order:S_=>S_.leadTimeBasis==='p80'?'Uses the typical lead time from supplier history':'Uses the quoted lead time',late_po:S_=>S_.leadTimeBasis==='p80'?'Uses the typical lead time from supplier history':'Uses the quoted lead time'};
let moreEx=false;
function renderCustom(){
  const S_=A.st.settings,RU=A.RULES,shown=moreEx?SUG:SUG.slice(0,6),open=(id)=>customOpen[id]?' open':'';
  $('#v-custom').innerHTML=`<div class="page"><div class="pg-h"><h1>Customize</h1></div>
  <div class="demo-note"><div class="dn-t">This page shows examples. The real conversation happens with your own AI agent.</div><p>The video and practice chat below are simulated, and nothing on this site changes. Your spreadsheet changes only through your own agent.</p></div>
  <h2 class="sec-h">Watch An Example</h2>
  <div class="card vid"><div class="vid-h"><span class="vid-t"><i class="dot"></i><i class="dot"></i><i class="dot"></i> Conversation With Your AI Agent <span class="conf demo-tag">Simulated</span></span><button class="btn sm" id="v-pause" aria-pressed="false">Pause</button></div><div class="vid-body" id="vid" aria-live="off"></div></div>
  <h2 class="sec-h" id="recustom">Re-Customize Anytime</h2>
  <div class="card recipe"><ul class="mini big"><li><b>Use the same flow:</b> Tell your AI agent what to change. It updates your Custom Metrics, and the next run uses them, whether that run is daily, weekly or on request.</li>
   <li><b>Edited the spreadsheet yourself?</b> Share the edited file. Your agent reads what you changed and learns how you like it.</li>
   <li><b>Cannot describe the change?</b> Make it in the spreadsheet and share the file. Showing it is enough.</li>
   <li><b>Good to know:</b> Your own edits do not carry into the next run unless your agent knows about them. Only the light yellow typing columns carry over by SKU on their own.</li></ul></div>
  <h2 class="sec-h">Example Prompts To Start With</h2>
  <div class="card recipe"><ul class="mini"><li><b>Match a format:</b> “Here are two sheets I like. Make the planning sheet look like the first, with the color rules from the second.”</li><li><b>Blend documents:</b> “Combine the layout of this report with the columns from that one.”</li><li><b>Combine data:</b> “Join the Anaplan forecast and the Tableau sales by SKU, and flag any item where sales are above forecast and stock is low.”</li></ul></div>
  <h2 class="sec-h">Try An Example Request</h2>
  <div class="card chat compact"><div class="msgs" id="msgs" aria-live="polite">${msgs.slice(-4).map(m=>`<div class="msg ${m.w}">${m.w==='you'?esc(m.t):m.t}</div>`).join('')}</div>
   <div class="sug">${shown.map(x=>`<button class="chip" data-sug="${SUG.indexOf(x)}">${esc(x)}</button>`).join('')}<button class="chip more" id="sug-more">${moreEx?'Show Fewer':'More Examples'}</button></div>
   <form class="chat-in" id="chat-f"><input type="text" id="chat-t" placeholder="Type a request (simulated, changes nothing)" aria-label="Message"><button class="btn pri" type="submit">Send</button></form></div>
  <details class="card fold" data-id="metrics"${open('metrics')}><summary><h2 class="fold-h">Your Custom Metrics</h2><span class="conf">Read only. Changes only through your agent.</span></summary>
   <h3 class="rh">Planning Dashboard Columns</h3><ol class="two">${cols.map(k=>`<li>${esc(COLS[k].h)}</li>`).join('')}</ol>
   <h3 class="rh">Master List</h3><p>Every column, with light yellow columns to type in: ${INK.map(k=>esc(COLS[k].h)).join(', ')}. They carry over to the next run by SKU.</p>
   <h3 class="rh">Tabs</h3><p>${TABS.map(t=>esc(t[1])).join(', ')}.</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri" data-nav="sheet">Preview The Spreadsheet</button><button class="btn dl" id="c-dl">Download Sheet</button></div></details>
  <details class="card fold" data-id="rules"${open('rules')}><summary><h2 class="fold-h">How Items Get Flagged</h2><span class="conf">The same rules for every planner.</span></summary>
   <ul class="rules two">${Object.keys(RU).map(k=>`<li><b>${esc(RU[k][0])}</b><ul class="sub"><li>${esc(RU[k][1])}</li>${RULEPAT[k]?`<li><b>Setting:</b> ${esc(RULEPAT[k](S_))}</li>`:''}</ul></li>`).join('')}</ul></details>
  </div>`;
  const v=$('#v-custom'),box=$('#msgs');box.scrollTop=box.scrollHeight;
  const send=t=>{if(!t.trim())return;msgs.push({w:'you',t});msgs.push({w:'ai',t:reply(t)});renderCustom()};
  $$('[data-sug]',v).forEach(b=>b.onclick=()=>send(SUG[b.dataset.sug]));
  $('#sug-more').onclick=()=>{moreEx=!moreEx;renderCustom()};
  $$('details.fold',v).forEach(d=>d.addEventListener('toggle',()=>{customOpen[d.dataset.id]=d.open}));
  $('#chat-f').onsubmit=e=>{e.preventDefault();send($('#chat-t').value)};
  $$('[data-nav]',v).forEach(b=>b.onclick=()=>go(b.dataset.nav));
  $('#c-dl').onclick=downloadXlsx;
  const pb=$('#v-pause');pb.textContent=demoPaused?'Play':'Pause';pb.onclick=()=>{demoPaused=!demoPaused;pb.textContent=demoPaused?'Play':'Pause';pb.setAttribute('aria-pressed',String(demoPaused))};
  startDemo();
}
const customOpen={};
/* ---------- routing ---------- */
const VIEWS=['home','custom','sheet','visual','email','options'];
function go(v){
  if(!VIEWS.includes(v))v='home';A.closeAll();
  VIEWS.forEach(x=>$('#v-'+x).classList.toggle('on',x===v));
  $$('.nav button').forEach(b=>{if(b.dataset.nav===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(v==='sheet')renderSheet();if(v==='custom')renderCustom();if(v==='email')renderEmail();if(v==='visual')A.renderApp();
  if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);window.scrollTo(0,0);
  const h=$('header.top');if(h)document.documentElement.style.setProperty('--hh',h.offsetHeight+'px');
}
function renderAll(){renderHome();renderOptions();renderSheet();renderCustom();renderEmail();A.renderApp()}
$$('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.nav));
addEventListener('hashchange',()=>go(location.hash.slice(1)));
renderAll();go(location.hash.slice(1)||'home');
window.__shell={go,downloadXlsx,cols:()=>cols,reply,COLS};
})();
