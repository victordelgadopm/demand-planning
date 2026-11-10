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
   <div class="xl"><div class="xl-bar"><span class="fx">fx</span><b>Daily Planning Sheet (Sample Data) ${esc(A.snap().meta.asOf)}</b><span class="mute" style="color:#555">${count}</span><span style="flex:1"></span>
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
  a.href=URL.createObjectURL(blob);a.download='Daily-Planning-Sheet-SAMPLE-'+A.snap().meta.today+'.xlsx';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);
}
/* ---------- home ---------- */
const ROUTES={
 live:['Live Connection','Best when it exists','The AI connects straight to Anaplan or Tableau and reads fresh numbers each morning. Both companies now publish connectors, but whether your approved AI tool is allowed to use them is a question for IT.','IT approves the access. Nothing to build on the planning side.'],
 folder:['Shared Folder','The safe default','Anaplan and Tableau can already save a scheduled export to a folder. The AI opens the newest files each morning, checks them, and saves the finished sheet back in the same folder.','One folder that both the export and the AI can reach.'],
 email:['Scheduled Email','Works, with a catch','A scheduled report arrives in a mailbox the AI can read. Tableau emails are often a picture and a link instead of the data, so ask for an attached data export.','A mailbox the AI is allowed to read.'],
 manual:['Drag And Drop','Good for week one','You drop the files into the chat each morning. No IT work at all, so it is the fastest way to prove the idea.','Nothing. You can start today.']};
let route='live';
function renderHome(){
  const r=ROUTES[route];
  $('#v-home').innerHTML=`<div class="page">
  <div class="hero"><h1>Your Daily Planning Sheet, Built By AI From The Data You Already Have</h1>
  <p>Three steps. No code. You talk to the AI in plain words, and an Excel sheet shows up each morning.</p></div>
  <div class="steps">
   <div class="card step"><div class="num">1</div><h2>Connect Your Data</h2><p>Choose how your files reach the AI.</p>
    <div class="routes" role="group" aria-label="Ways to connect">${Object.keys(ROUTES).map(k=>`<button class="route" data-route="${k}" aria-pressed="${route===k}">${ROUTES[k][0]}</button>`).join('')}</div>
    <p class="ex">Pick one to read how it works below.</p></div>
   <div class="card step"><div class="num">2</div><h2>Tell It What You Are Not Seeing</h2><p>Talk to the AI like a coworker. It adjusts the sheet and remembers.</p>
    <p class="ex">“I don't see how many weeks of stock we have.”</p><button class="btn pri go" data-nav="custom">Try It Now</button></div>
   <div class="card step"><div class="num">3</div><h2>Get Your Sheet</h2><p>A formatted Excel file every morning, with the items that need you at the top.</p>
    <div class="row" style="display:flex;gap:8px;flex-wrap:wrap" ><button class="btn pri go" data-nav="sheet">See The Sheet</button><button class="btn dl go" id="h-dl">Download Excel</button></div></div>
  </div>
  <div class="card routebox" id="routebox"><h3>${r[0]} <span class="conf">${r[1]}</span></h3><p>${r[2]}</p><p><b>What it needs:</b> ${r[3]}</p></div>
  <div class="card rule" style="margin-top:16px"><b>Which One To Pick?</b><span>Try them in this order:</span><span><b>1.</b> Live connection</span><span class="arrow">→</span><span><b>2.</b> Shared folder</span><span class="arrow">→</span><span><b>3.</b> Email</span><span class="mute">Use drag and drop to start on day one.</span></div>
  <div class="who"><div class="card"><h3>You</h3><p>Say what you need and what you are not seeing. Decide what to do about each flagged item.</p></div>
   <div class="card"><h3>The AI</h3><p>Reads the files, checks them, builds the sheet, writes the morning summary, and keeps your preferences.</p></div>
   <div class="card"><h3>IT</h3><p>Approves one way to get the data in. That is the only thing they have to do.</p></div></div>
  <details class="card it"><summary>For The IT Conversation: What Connects To What</summary>
   <ul>
    <li><b>Tableau:</b> Tableau publishes an official connector for Tableau Cloud. Each person signs in with their own Tableau login. Tableau's setup guide lists ChatGPT and Claude.</li>
    <li><b>Anaplan:</b> Anaplan's AI Gateway offers a connector that names Claude, Gemini and Microsoft Copilot. ChatGPT is not named. Outside bridges exist, but each one is another vendor to approve.</li>
    <li><b>ChatGPT connectors:</b> They need a hosted server, and each person signs in with their own account. A pasted API key does not work. Writing back to a system is limited to some business plans.</li>
    <li><b>ChatGPT scheduled tasks:</b> Up to 10 active tasks, and they cannot take file uploads. For an unattended daily run, the files need to sit where the AI can reach them.</li>
    <li><b>Bottom line:</b> If no approved live connection exists, the shared folder and email routes have no such limit. The AI only needs permission to read one folder or mailbox.</li>
   </ul>
   <p class="conf">Vendor pages change often. Last checked November 2026. Confirm with IT before relying on any of this.</p>
   <p class="conf">Sources: <a href="https://mcp.tableau.com" target="_blank" rel="noopener">Tableau hosted connector</a> · <a href="https://www.anaplan.com/platform/anaplan-ai-gateway/" target="_blank" rel="noopener">Anaplan AI Gateway</a> · <a href="https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-connectors" target="_blank" rel="noopener">OpenAI connectors help</a> · <a href="https://help-lb.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt" target="_blank" rel="noopener">OpenAI scheduled tasks</a> · <a href="https://www.cdata.com/ai/connect/anaplan-to-chatgpt/" target="_blank" rel="noopener">CData bridge for Anaplan</a></p></details>
  <details class="card it"><summary>Extras</summary><p class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="x-load">Replay Today's Data Check</button><button class="btn" id="x-flow">Data Flow Map</button><button class="btn" id="x-email">Daily Email Preview</button><button class="btn" id="x-set">Advanced Thresholds</button><button class="btn" id="x-csv">Download CSV</button><button class="btn" id="x-reset">Reset Demo</button></p></details>
  </div>`;
  const h=$('#v-home');
  $$('[data-route]',h).forEach(b=>b.onclick=()=>{route=b.dataset.route;renderHome()});
  $$('[data-nav]',h).forEach(b=>b.onclick=()=>go(b.dataset.nav));
  $('#h-dl').onclick=downloadXlsx;$('#x-load').onclick=()=>A.openLoad(true);$('#x-flow').onclick=()=>A.openFlow();$('#x-email').onclick=A.openEmail;
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
  <p class="pg-sub">You change the sheet by talking to the AI, not by editing settings. Say what you are not seeing, and it adds the column and remembers for next time.</p>
  <div class="chat-wrap"><div class="card chat"><div class="chat-h"><span>Chat With The AI</span><span class="conf">Demo only: simulated replies</span></div>
   <div class="msgs" id="msgs" aria-live="polite">${msgs.map(m=>`<div class="msg ${m.w}">${m.w==='you'?esc(m.t):m.t}</div>`).join('')}</div>
   <div class="sug">${SUG.map((s,i)=>`<button class="chip" data-sug="${i}">${esc(s)}</button>`).join('')}</div>
   <form class="chat-in" id="chat-f"><input type="text" id="chat-t" placeholder="Type what you are not seeing" aria-label="Message"><button class="btn pri" type="submit">Send</button></form></div>
  <div><div class="card recipe"><h3>Your Recipe</h3><p class="conf" style="margin:0 0 8px">The AI's memory of how your sheet is built. Scheduled runs read it every morning.</p>
   <ol>${cols.map(k=>`<li>${esc(COLS[k].h)}</li>`).join('')}</ol>
   <p style="margin:10px 0 0"><b>Rows:</b> ${rowsMode==='all'?'All items':'Items that need attention'}</p>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri" data-nav="sheet">Preview The Sheet</button><button class="btn" id="c-reset">Reset Columns</button></div></div>
   <div class="card recipe" style="margin-top:14px"><h3>How This Works In Real Life</h3><ol><li>You describe what you are not seeing, in your own words.</li><li>The AI finds the field in your data, or asks you where it lives.</li><li>It updates the recipe and rebuilds the sheet.</li><li>Tomorrow's scheduled run uses the saved recipe.</li></ol>
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
const VIEWS=['home','sheet','custom','visual'];
function go(v){
  if(!VIEWS.includes(v))v='home';A.closeAll();
  VIEWS.forEach(x=>$('#v-'+x).classList.toggle('on',x===v));
  $$('.nav button').forEach(b=>{if(b.dataset.nav===v)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(v==='sheet')renderSheet();if(v==='custom')renderCustom();if(v==='visual')A.renderApp();
  if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);window.scrollTo(0,0);
  const h=$('header.top');if(h)document.documentElement.style.setProperty('--hh',h.offsetHeight+'px');
}
function renderAll(){renderHome();renderSheet();renderCustom();A.renderApp()}
$$('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.nav));
addEventListener('hashchange',()=>go(location.hash.slice(1)));
renderAll();go(location.hash.slice(1)||'home');
window.__shell={go,downloadXlsx,cols:()=>cols,reply,COLS};
})();
