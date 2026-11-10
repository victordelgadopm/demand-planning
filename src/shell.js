(function(){
'use strict';
const A=window.__app,E=A.E,D=A.D,st=A.st,esc=A.esc,money=A.money;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const CK='dpa.cols.v1';
/* ---------- columns ---------- */
const OWN={Fashion:'Planner A',Collector:'Planner B',Small:'Planner C',Baby:'Planner A',"Playsets & Houses":'Planner B',Accessories:'Planner C'};
const TODO={order_more:'Place or expedite an order',too_much:'Pause new orders and review promos',forecast_off:'Review the forecast',check_data:'Fix the source data first'};
const TS={'At risk':'t_risk','Medium':'t_med','Watch':'t_watch','Too much':'t_much','No risk':'t_ok'};
const COLS={
 status:{h:'Status',w:13,core:1},sku:{h:'SKU',w:11,core:1},product:{h:'Product',w:30,core:1},sub:{h:'Subcategory',w:17},
 going:{h:'What Is Going On',w:62,core:1,wide:1},todo:{h:'What To Do',w:34},dollars:{h:'$ At Risk',w:12,num:'money'},conf:{h:'Confidence',w:12},
 wos:{h:'Weeks Of Supply',w:12,num:'dec1',src:'from the Planning system: stock on hand plus in transit, divided by recent weekly sales'},
 lt:{h:'Lead Time (Weeks)',w:13,num:'dec1',src:'from the Shared file: the supplier\'s quoted lead time'},
 ly:{h:'Same Weeks Last Year (Units)',w:16,num:'int',src:'from the Reporting tool: units sold in the same weeks last year'},
 supply:{h:'On Hand And Ordered (Units)',w:16,num:'int',src:'from the Planning system: on hand, in transit and open orders added together'},
 supplier:{h:'Supplier',w:18,src:'from the Shared file'},
 owner:{h:'Owner (Sample)',w:14,src:'as a sample, by subcategory. Your real owner list would come from a file you share'},
 note:{h:'Note',w:48,wide:1,src:'from the notes you save on each item'}};
const DEFAULT=['status','sku','product','sub','going','todo','dollars','conf'];
let cols=(function(){try{const c=JSON.parse(localStorage.getItem(CK)||'null');if(Array.isArray(c)&&c.every(k=>COLS[k]))return c}catch(e){}return DEFAULT.slice()})();
const saveCols=()=>{try{localStorage.setItem(CK,JSON.stringify(cols))}catch(e){}};
let rowsMode='attn',tab='today';
function val(k,r){
  const m=r.metrics,sk=A.skuOf(r.id),n=r.acceptedFlags&&r.acceptedFlags[0]&&r.acceptedFlags[0].note;
  switch(k){
   case 'status':return A.tn(r.tier);case 'sku':return r.id;case 'product':return r.name;case 'sub':return r.sub;
   case 'going':return r.headline||(r.isAccepted?'Accepted risk (see note)':'No flags. Supply covers the forecast.');
   case 'todo':return r.decision?TODO[r.decision]:(r.headline?'Take a look':'');
   case 'dollars':return r.dollars>0?Math.round(r.dollars):0;case 'conf':return r.headline?r.confidence:'';
   case 'wos':return m.wos==null?'':Math.round(m.wos*10)/10;case 'lt':return m.lt&&m.lt.q!=null?m.lt.q:'';
   case 'ly':return Math.round(m.lyRaw||0);case 'supply':return Math.round(m.supply||0);
   case 'supplier':return sk?sk.supplier:'';case 'owner':return OWN[r.sub]||'Planner A';
   case 'note':return n?(n.reason+': '+n.text):'';}
  return '';
}
function sheetRows(mode){
  return st.res.rows.filter(r=>mode==='all'||r.headline).sort((a,b)=>E.TIER_ORDER[a.tier]-E.TIER_ORDER[b.tier]||b.dollars-a.dollars);
}
/* ---------- since / notes / recipe data ---------- */
function sinceItems(){
  if(!st.diff)return [];const d=st.diff,out=[],add=(t,ids)=>ids.forEach(id=>{const r=A.rowOf(id);out.push([t,r.name,r.id,r.headline||'Order was placed'])});
  add('Newly at risk',d.toAtRisk);add('Re-alert',d.reAlerted);add('New flag',d.newFlags);add('Got worse',d.worsened);add('Fixed',d.recovered);return out;
}
function noteItems(){
  return Object.values(E.activeNotes(st.notes)).map(n=>{const r=A.rowOf(n.sku);return [n.sku,r?r.name:'',E.FLAG_LABEL[n.flag]||n.flag,n.reason,n.text,n.who,n.date,Math.round(n.acceptedGap||0)]});
}
function recipeItems(){
  return [['Rows Shown','Items that need attention, ranked by status then dollars. Switch to all items any time.'],
   ['Columns',cols.map(k=>COLS[k].h).join(', ')],
   ['Data Sources',D.sources.map(s=>s.name).join(', ')],
   ['Checks Run',Object.keys(E.FLAG_LABEL).filter(k=>st.settings.flags[k]).map(k=>E.FLAG_LABEL[k]).join(', ')],
   ['Notes','Notes never expire. An accepted item comes back only if its gap grows past 1.5 times what was accepted.'],
   ['Schedule','Every morning after the files refresh (sample: 6:05 AM)'],
   ['How To Change It','Tell the AI in chat what you are not seeing. It updates this recipe.']];
}
/* ---------- grid ---------- */
function letters(n){return Array.from({length:n},(_,i)=>MiniXlsx.col(i))}
function gridHtml(heads,rows,o){
  o=o||{};const L=letters(heads.length);
  return `<div class="xl-scroll"><table class="xt"><thead><tr class="letters"><th class="rn"></th>${L.map(x=>`<th>${x}</th>`).join('')}</tr>
   <tr class="heads"><th class="rn">1</th>${heads.map(h=>`<th class="${h.cls||''}">${esc(h.t)}</th>`).join('')}</tr></thead>
   <tbody>${rows.length?rows.map((r,i)=>`<tr ${r.id?`data-open="${r.id}" tabindex="0"`:''}><td class="rn">${i+2}</td>${r.c.map(c=>`<td class="${c.cls||''}">${esc(c.t)}</td>`).join('')}</tr>`).join(''):`<tr><td class="rn">2</td><td colspan="${heads.length}">${esc(o.empty||'Nothing here.')}</td></tr>`}</tbody></table></div>`;
}
function todayGrid(){
  const rows=sheetRows(rowsMode),heads=cols.map(k=>({t:COLS[k].h,cls:COLS[k].num==='money'||COLS[k].num==='dec1'||COLS[k].num==='int'?'money':''}));
  const body=rows.map(r=>({id:r.id,c:cols.map(k=>{const v=val(k,r),C=COLS[k];
    if(k==='status')return {t:v,cls:'st '+({'At risk':'t-risk','Medium':'t-med','Watch':'t-watch','Too much':'t-much','No risk':'t-ok'})[r.tier]};
    if(k==='dollars')return {t:v?money(v):'—',cls:'money'};
    if(C.num)return {t:v===''?'':E.fmtNum?String(C.num==='dec1'?v:E.fmtNum(v)):String(v),cls:'money'};
    return {t:v,cls:C.wide?'wide':''}})}));
  return {html:gridHtml(heads,body,{empty:'Nothing needs attention.'}),n:rows.length};
}
function renderSheet(){
  const v=$('#v-sheet'),total=st.res.total;
  let inner,count='';
  if(tab==='today'){const g=todayGrid();inner=g.html;count=`${g.n} of ${total} items`}
  else if(tab==='since'){const it=sinceItems();inner=gridHtml(['Change','Product','SKU','Detail'].map(t=>({t})),it.map(r=>({id:r[2],c:r.map(t=>({t}))})),{empty:'Nothing changed since yesterday.'});count=it.length+' changes'}
  else if(tab==='notes'){const it=noteItems();inner=gridHtml(['SKU','Product','Flag','Reason','Note','Who','Date','Accepted Gap (Units)'].map(t=>({t})),it.map(r=>({id:r[0],c:r.map(t=>({t:String(t)}))})),{empty:'No notes yet.'});count=it.length+' notes'}
  else{const it=recipeItems();inner=gridHtml(['Setting','What It Is Set To'].map(t=>({t})),it.map(r=>({c:[{t:r[0],cls:'st'},{t:r[1],cls:'wide'}]})));count='Saved with the sheet'}
  v.innerHTML=`<div class="page"><div class="pg-h"><h1>Daily Sheet</h1></div>
   <p class="pg-sub">This is what lands in your Excel file every morning. Click any row to see the numbers behind it. Download it to open in Excel with the same colors and formatting.</p>
   <div class="xl"><div class="xl-bar"><span class="fx">fx</span><b>Daily Planning Sheet (Sample Data), ${esc(A.TODAY_SHORT)}</b><span class="mute" style="color:#555">${count}</span><span style="flex:1"></span>
    ${tab==='today'?`<span class="seg" role="group" aria-label="Rows"><button data-rows="attn" aria-pressed="${rowsMode==='attn'}">Needs attention</button><button data-rows="all" aria-pressed="${rowsMode==='all'}">All items</button></span>`:''}
    <button class="btn sm" id="sh-custom">Add or remove columns</button>
    <button class="btn dl" id="sh-dl">Download Excel</button></div>
   ${inner}
   <div class="xl-tabs" role="tablist">${[['today','Today'],['since','Since Yesterday'],['notes','Notes'],['recipe','Recipe']].map(([k,l])=>`<button role="tab" aria-selected="${tab===k}" data-xt="${k}">${l}</button>`).join('')}</div></div>
   <p class="simnote">Sample data, not Mattel data. The real file is built the same way from your own exports.</p></div>`;
  $$('[data-rows]',v).forEach(b=>b.onclick=()=>{rowsMode=b.dataset.rows;renderSheet()});
  $$('[data-xt]',v).forEach(b=>b.onclick=()=>{tab=b.dataset.xt;renderSheet()});
  $$('[data-open]',v).forEach(e=>{e.onclick=()=>A.openSku(e.dataset.open);e.onkeydown=ev=>{if(ev.key==='Enter')A.openSku(e.dataset.open)}});
  $('#sh-dl').onclick=downloadXlsx;$('#sh-custom').onclick=()=>go('custom');
}
/* ---------- xlsx ---------- */
function downloadXlsx(){
  const hdr=ks=>Object.assign(ks.map(t=>({v:t,s:'head'})),{h:32});
  const mk=(rows,name,onlyCols)=>{
    const ws=cols.map(k=>COLS[k].w);
    const data=rows.map(r=>cols.map(k=>{const v=val(k,r),C=COLS[k];
      if(k==='status')return {v,s:TS[r.tier]};if(k==='dollars')return {v,s:'money'};
      if(C.num)return v===''?null:{v,s:C.num};return {v,s:'txt'}}));
    return {name,widths:ws,rows:[hdr(cols.map(k=>COLS[k].h)),...data],freeze:1,filter:data.length+1};
  };
  const since=sinceItems(),notes=noteItems(),rec=recipeItems();
  const sheets=[mk(sheetRows('attn'),'Today'),mk(sheetRows('all'),'All Items'),
   {name:'Since Yesterday',widths:[16,32,11,70],rows:[hdr(['Change','Product','SKU','Detail']),...since.map(r=>r.map(t=>({v:t,s:'txt'})))],freeze:1},
   {name:'Notes',widths:[11,30,18,20,60,10,10,14],rows:[hdr(['SKU','Product','Flag','Reason','Note','Who','Date','Accepted Gap (Units)']),...notes.map(r=>r.map((t,i)=>i===7?{v:t,s:'int'}:{v:t,s:'txt'}))],freeze:1},
   {name:'Recipe',widths:[22,110],rows:[hdr(['Setting','What It Is Set To']),...rec.map(r=>[{v:r[0],s:'bold'},{v:r[1],s:'txt'}])],freeze:1}];
  const blob=MiniXlsx.build(sheets),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='Daily-Planning-Sheet-SAMPLE-'+A.TODAY_ISO+'.xlsx';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
}
/* ---------- home ---------- */
const ROUTES={
 manual:['Manual Export','You export the files yourself. No connection needed.','You export the data from Anaplan and Tableau yourself and put the files in the shared folder. No connection and no IT build are needed. You still need your company\'s OK to use the data with the AI tool. This is also how history gets in: export the past three years of weekly sales once, save them as the reference file, and every daily run compares against it.','Your own export access in each system, and your company\'s OK to use the data with the AI tool. Nothing for IT to build.'],
 folder:['Automated Export','The systems export on a schedule.','Anaplan and Tableau each export their data on a schedule, so nobody does it by hand. Like a manual export, the files land in the shared folder, and the AI reads the newest ones, checks them and saves the finished sheet back there. It works with any approved AI tool. Neither system saves straight into SharePoint on its own, so IT builds one small step to move each export into the folder (details on the Setup Options page).','IT to set up a scheduled export in each system, plus one step to move each export into the shared folder.'],
 copilot:['Copilot Connection','Direct connection, if your company allows it.','Microsoft Copilot can reach both systems directly, without a folder. Anaplan names Copilot as a supported client. For Tableau, Microsoft offers a Tableau Cloud connector, but it is built to find and ask about dashboards, and Microsoft does not say it exposes the full numbers. This needs a test on one real dashboard.','IT approval, plus a quick test to see what the connection can actually read.'],
 chatgpt:['ChatGPT Connection','Direct connection, if your company allows it.','ChatGPT can connect straight to Tableau, because Tableau lists ChatGPT as a supported client. Anaplan does not list ChatGPT, so it needs a custom connector built for it or an outside bridge before ChatGPT can pull from it. Each person signs in with their own account, and a pasted API key does not work.','IT approval for the Tableau connector, plus a built connector or bridge for Anaplan. ChatGPT scheduled tasks cannot take file uploads, so a daily unattended run is not confirmed.']
};
let route='manual';
function miniSheet(){
  const rows=sheetRows('attn').slice(0,3);
  return `<div class="mini-sheet" aria-hidden="true">${rows.map(r=>`<div class="ms-r"><span class="ms-st ${({'At risk':'t-risk','Medium':'t-med','Watch':'t-watch','Too much':'t-much'})[r.tier]||'t-ok'}">${esc(val('status',r))}</span><span class="ms-n">${esc(val('product',r))}</span><span class="ms-d">${esc(r.id)}</span></div>`).join('')}</div>`;
}
function renderHome(){
  const r=ROUTES[route];
  $('#v-home').innerHTML=`<div class="page">
  <div class="hero"><h1>Your Daily Planning Sheet, Built By AI From The Data You Already Have</h1>
  <p>Four steps. No code. You explain what you want to the AI in plain words, and an Excel sheet shows up each morning.</p></div>
  <div class="steps">
   <div class="card step s1"><div class="shead"><div class="num">1</div><h2>Connect Your Data</h2></div><p>Pick how your files reach the AI. What each one means is on the right.</p>
    <div class="s1-body"><div class="routes" role="group" aria-label="Ways to connect">${Object.keys(ROUTES).map(k=>`<button class="route" data-route="${k}" aria-pressed="${route===k}">${ROUTES[k][0].replace(' Connection','')}</button>`).join('')}</div>
    <div class="routebox" id="routebox"><h3>${r[0]}</h3><div class="conf" style="margin-bottom:6px">${r[1]}</div><p>${r[2]}</p><p><b>What it needs:</b> ${r[3]}</p>${(route==='manual'||route==='folder')?'<p class="same"><b>Same place either way:</b> manual and automated exports both land in the shared folder, so the AI reads them the same way.</p>':''}</div></div></div>
   <div class="card step"><div class="shead"><div class="num">2</div><h2>Prompt Your AI Agent</h2></div><p>Most of the work happens here.</p>
    <ul class="mini"><li>Show examples of sheets you like, for exact formatting</li><li>Blend documents into one custom format</li><li>Explain how to combine the data and what you want out of it. The agent hears the voice of the customer (VOC) here.</li></ul>
    <button class="btn pri go" data-nav="custom">See Example Prompts</button></div>
   <div class="card step"><div class="shead"><div class="num">3</div><h2>Get Your Sheet</h2></div><p>A formatted Excel file every morning, with the items that need you at the top.</p>
    ${miniSheet()}
    <div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri go" data-nav="sheet">See The Sheet</button><button class="btn dl go" id="h-dl">Download Excel</button></div></div>
   <div class="card step"><div class="shead"><div class="num">4</div><h2>Customize</h2><span class="optl">Optional, anytime</span></div><p>Tell the agent what you are not seeing or want to change. It can always be adjusted.</p>
    <div class="quotes"><p class="quote">“I don't see how many weeks of stock we have.”</p><p class="quote">“Add who owns each item.”</p><p class="quote">“Show me last year's sales for the same weeks.”</p></div><button class="btn go" data-nav="custom">Try It Now</button></div>
  </div>
  <h2 class="sec-h">What Connects To What</h2>
  <p class="pg-sub" style="margin-top:0">Checked against each company's own pages in November 2026.</p>
  <div class="card mx-wrap"><table class="mx"><thead><tr class="grp"><th></th><th colspan="2">Files Land In The Shared Folder</th><th colspan="2">Direct Connection To The AI</th></tr><tr><th></th><th>Manual Export</th><th>Automated Export</th><th>ChatGPT</th><th>Copilot</th></tr></thead><tbody>
   <tr><th>Anaplan</th><td class="yes"><b>✔ Yes</b><span>You export the file by hand, if your login has export access.</span></td><td class="part"><b>▲ Partly</b><span>Scheduled exports go to Amazon S3, Azure Blob or Google BigQuery, not SharePoint. IT adds a step.</span></td><td class="no"><b>✕ No direct connection</b><span>Needs a custom connector or an outside bridge built first.</span></td><td class="yes"><b>✔ Yes</b><span>Anaplan's AI Gateway names Microsoft Copilot. Licensing is not stated.</span></td></tr>
   <tr><th>Tableau</th><td class="yes"><b>✔ Yes</b><span>You export the view data by hand, if your login has export permission.</span></td><td class="part"><b>▲ Partly</b><span>Subscriptions are email images or PDFs. Data comes through Prep file output or the REST API. IT adds a step.</span></td><td class="yes"><b>✔ Yes</b><span>Tableau lists ChatGPT as a supported client. Read-only, with a sign-in per person.</span></td><td class="part"><b>▲ Partly</b><span>Microsoft's connector finds and answers questions about dashboards. It does not say the full numbers are included. Tableau Cloud only.</span></td></tr>
  </tbody></table></div>
  <div class="card rule" style="margin-top:16px"><b>Which One To Pick?</b><span>Use whichever one works for you today. Manual export needs nothing from IT. An automated export or a direct connection removes the daily manual step once your company approves it.</span></div>
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
   <tr><th>Automated Export<small>Systems put the files in the shared folder</small></th><td class="part"><b>▲ Partly</b><span>Exports to S3, Azure Blob or BigQuery. IT moves them to the folder.</span></td><td class="part"><b>▲ Partly</b><span>Prep file output or REST API. IT moves them to the folder.</span></td><td>IT builds one step per system.</td></tr>
   <tr><th>ChatGPT<small>Direct, no folder needed</small></th><td class="no"><b>✕ No direct connection</b><span>Needs a custom connector or bridge.</span></td><td class="yes"><b>✔ Yes</b><span>Listed by Tableau.</span></td><td>Scheduled tasks cannot take file uploads.</td></tr>
   <tr><th>Copilot<small>Direct, no folder needed</small></th><td class="yes"><b>✔ Yes</b><span>Named by Anaplan.</span></td><td class="part"><b>▲ Partly</b><span>Finds and answers about dashboards.</span></td><td>Full Tableau numbers not stated. Licensing for Anaplan not stated.</td></tr>
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
    <p class="lim"><b>Limits:</b> Needs IT to allow the flow and a one-time build and test. Each Microsoft piece is documented, but the full chain still needs a pilot. Changes mean updating the script.</p></div>
   <div class="card path"><span class="tagp">Most Flexible</span><h3>C. A Scheduled AI Agent</h3><p>An AI agent runs on a schedule and uses judgment, such as writing the morning summary.</p>
    <p class="lim"><b>Limits:</b> Runs use credits, use the builder's sign-in, and admins can block them. Output can vary day to day, and building a formatted Excel file this way is not confirmed.</p></div>
  </div>
  <div class="card rule"><b>Built Once, Then Repeated</b><span><b>1.</b> Write down the files and rules</span><span class="arrow">→</span><span><b>2.</b> AI builds it with real files</span><span class="arrow">→</span><span><b>3.</b> Test against known items</span><span class="arrow">→</span><span><b>4.</b> Save it and schedule it</span></div>
  <h2 class="sec-h">Ways To Get Anaplan And Tableau Into One Sheet</h2>
  <p class="pg-sub" style="margin-top:0">Merged or separate, there are several paths. Which one is open depends on what IT approves.</p>
  <div class="paths four">
   <div class="card path"><span class="tagp">One Tool</span><h3>1. Copilot Reaches Both</h3><p>Copilot connects to Anaplan and to Tableau and builds one merged sheet.</p>
    <p class="lim"><b>Limits:</b> Anaplan names Copilot as a client. Microsoft's Tableau connector finds and answers questions about dashboards, and Microsoft does not say it includes the full numbers. Needs a test.</p></div>
   <div class="card path"><span class="tagp">Two Tools</span><h3>2. Split Pulls, Then Merge</h3><p>ChatGPT pulls Tableau, which it supports. Anaplan needs a custom connector or an outside bridge before ChatGPT can pull it. Both results go to the shared folder, and Copilot merges them into the sheet.</p>
    <p class="lim"><b>Limits:</b> Two tools to approve. Building the Anaplan connector is real work. Saving files from ChatGPT into the folder is not confirmed.</p></div>
   <div class="card path"><span class="tagp">Any Tool</span><h3>3. Exports To A Shared Folder</h3><p>Both systems put their files in the shared folder, by hand or on a schedule, and one AI merges them.</p>
    <p class="lim"><b>Limits:</b> IT builds the step that moves each export into the folder. Tableau subscriptions are email images or PDFs, so data comes through Prep or the API.</p></div>
   <div class="card path"><span class="tagp">No Merge</span><h3>4. Keep Them Separate</h3><p>One sheet from Anaplan and one from Tableau, reviewed side by side.</p>
    <p class="lim"><b>Limits:</b> No cross-system flags, such as sales above forecast with low stock. A planner joins them by hand.</p></div>
  </div>
  <div class="card hist"><h3>Why History Is Needed For Accurate Reports</h3>
   <p>Several flags only work with past sales by week. Without history, the sheet can show today but cannot judge it.</p>
   <ul><li><b>Short vs last year:</b> compares supply to what the same weeks needed last year.</li><li><b>Promo repeat:</b> measures how much last year's promo lifted sales.</li><li><b>New item forecast:</b> compares to how similar past launches sold.</li><li><b>Stock-outs:</b> removes weeks last year when sales were capped by empty shelves.</li></ul>
   <p class="conf">The demo uses three years of weekly history. With no connection, export it by hand once, save it as the reference file in the shared folder, and refresh it when needed. Every daily run reads it.</p></div>
  <div class="who"><div class="card"><h3>You</h3><p>Say what you need and what you are not seeing. Decide what to do about each flagged item.</p></div>
   <div class="card"><h3>The AI</h3><p>Reads the files, checks them, builds the sheet, writes the morning summary, and keeps your preferences.</p></div>
   <div class="card"><h3>IT</h3><p>Approves one way to get the data in. That is the only thing they have to do.</p></div></div>
  <details class="card it"><summary>For The IT Conversation: What Each System Can Do</summary>
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
const SUG=['I don\'t see how many weeks of stock we have.','Show me last year\'s sales for the same weeks.','I need the supplier lead time.','Add who owns each item.','Add a column for my notes.','Remove confidence.','Show all items, not just the ones that need attention.'];
const PAT=[['wos',/weeks? of (stock|supply|cover)|how many weeks|wos|\bcover\b/],['ly',/last year|same weeks/],['lt',/lead ?time/],['supplier',/supplier|vendor/],['supply',/on hand|on order|in transit|units (on|of stock)|how much stock|stock (we have|on)/],['owner',/owner|who owns|responsible|assigned/],['note',/\bnotes?\b|comment/],['conf',/confidence|how sure/],['dollars',/dollar|\$|money|value/],['sub',/subcategor|category/],['todo',/what to do|next step|action/]];
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
