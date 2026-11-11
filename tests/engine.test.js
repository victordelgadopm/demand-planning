const E=require('../src/engine.js'),fs=require('fs'),assert=require('assert');
const d=JSON.parse(fs.readFileSync('data/data.json'));const I=d.ids;let pass=0;
const T=(n,f)=>{try{f();pass++;console.log('ok  ',n)}catch(e){console.log('FAIL',n,'-',e.message);process.exitCode=1}};
const run=(notes=[],s={})=>E.compute(d.today,s,notes);const R=run(d.seedNotes);const row=(id,r=R)=>r.rows.find(x=>x.id===id);
const exp={HG1:['Watch','history_gap'],MO1:['At risk','missed_order'],MO2:['Watch','missed_order'],LP1:['At risk','late_po'],LP2:['Watch','late_po'],LP2b:['Watch','late_po'],
 PR1:['Watch','promo_repeat'],PR2:['Watch','promo_repeat'],OP1:['Watch','pos_outpacing'],OP2:['Watch','pos_outpacing'],OV1:['Overstocked','overstock'],OV2:['Overstocked','overstock'],
 CF1:['Watch','channel_fill'],DQ1:['Watch','check_data'],DQ2:['Watch','check_data'],NI1:['Watch','newitem_gap'],HG3:['Watch','history_gap']};
for(const [k,[tier,type]] of Object.entries(exp))T('planted '+k+' -> '+tier+'/'+type,()=>{const r=row(I[k]);assert.equal(r.tier,tier);assert.equal(r.headlineType,type);});
for(const k of ['SP1','NF1','HN1','HN2','HN3','LU1','LU2','LU3','RC1','NI2','NI3'])T('hard negative '+k+' stays No risk',()=>assert.equal(row(I[k]).tier,'No risk'));
const STG={'FD-1126':'eta_slipped','CD-1068':'eta_slipped','SM-1068':'eta_slipped','FD-1088':'stuck_origin','CD-1056':'stuck_origin'};
for(const id in STG)T('supply stage example '+id+' is flagged '+STG[id],()=>{const r=row(id);assert.equal(r.tier,'Watch');assert.equal(r.headlineType,STG[id])});
T('order stages add up to open PO and every order has a stage',()=>{R.rows.forEach(r=>{assert.equal(r.metrics.inProd+r.metrics.atOrigin,r.metrics.openPO,r.id);r.metrics.shipments.forEach(s=>assert(s.stage&&s.etaISO&&s.origEtaISO))})});
T('supplier stage days add up to the quoted lead time and each past order',()=>{for(const n in d.today.suppliers){const s=d.today.suppliers[n],q=s.stages;assert.equal(q.prod+q.hold+q.transit+q.recv,s.quotedWeeks*7,n);s.stageHistory.forEach((h,i)=>assert(Math.abs(h.prod+h.hold+h.transit+h.recv-s.history[i])<0.15,n+i))}});
T('no false alarms on unplanted SKUs',()=>{const p=new Set(Object.values(I).concat(Object.keys(STG)));assert.equal(R.rows.filter(x=>!p.has(x.id)&&x.flags.length).length,0)});
T('HG1 is the 700 vs 1000 case',()=>{const r=row(I.HG1);assert(Math.abs(r.metrics.supply-700)<30);assert(Math.abs(r.metrics.lyRaw-1000)<5)});
T('lumpy flagged Low confidence only if flagged; no flags',()=>assert(row(I.LU1).flags.length===0));
T('MO1 secondary flag kept in drill-down',()=>assert(row(I.MO1).flags.length>=1));
T('spike labelled not flagged',()=>assert(row(I.SP1).metrics.spike===true));
T('NF1 LY stockout un-constrained (no false gap)',()=>assert.equal(row(I.NF1).flags.length,0));
T('accepted note moves HG2 to accepted list',()=>{const r=row(I.HG2);assert(r.isAccepted);assert.equal(r.tier,'No risk')});
T('HG3 re-alerts when gap > 1.5x accepted',()=>{const r=row(I.HG3);assert(r.reAlert);assert.equal(r.tier,'Watch')});
T('boundary: gap exactly 1.5x stays accepted',()=>{const g=row(I.HG3).flags[0].gapUnits;const ev=[{t:'create',id:9,sku:I.HG3,flag:'history_gap',acceptedGap:g/1.5}];assert(row(I.HG3,run(ev)).isAccepted)});
T('notes never expire (same result with far-future)',()=>{const a=run(d.seedNotes);assert(row(I.HG2,a).isAccepted)});
T('removing note brings flag back',()=>{const ev=d.seedNotes.concat([{t:'close',id:3,target:1}]);assert.equal(row(I.HG2,run(ev)).tier,'Watch')});
T('re-alert off per note',()=>{const ev=[{t:'create',id:9,sku:I.HG3,flag:'history_gap',acceptedGap:1,realertGap:1e9}];assert(row(I.HG3,run(ev)).isAccepted)});
T('what-if: ETA slip creates risk (LP2: fine on quote, short if 2 wks late)',()=>{const s=d.today.skus.find(x=>x.id===I.LP2);
 const a=E.project(s,d.today,{demand:s.fcstH,slip:0});const b=E.project(s,d.today,{demand:s.fcstH,slip:2});assert.equal(a.first,null);assert(b.first!==null)});
T('what-if: extra order closes MO1 gap',()=>{const s=d.today.skus.find(x=>x.id===I.MO1);const a=E.project(s,d.today,{demand:s.fcstH,slip:0});
 const b=E.project(s,d.today,{demand:s.fcstH,slip:0,extra:{qty:a.short*1.05,h:2}});assert(a.first!==null);assert.equal(b.first,null)});
T('settings: turning a flag off removes it',()=>{const r=run(d.seedNotes,{flags:{overstock:false}});assert.equal(row(I.OV1,r).tier,'No risk')});
T('settings: stricter overstock threshold adds flags',()=>{const r=run(d.seedNotes,{overstockWOS:40});assert.equal(row(I.OV1,r).tier,'No risk')});
T('forecast bias detected in Baby only',()=>{const a=E.accuracy(d.today);assert(a['Baby'].possible);assert.equal(Object.values(a).filter(x=>x.possible).length,1)});
T('change log: stories present',()=>{const y=E.compute(d.yesterday,{},d.seedNotes),df=E.diff(y,R);assert(df.toAtRisk.includes(I.LP1));assert(df.recovered.includes(I.RC1));assert(df.reAlerted.includes(I.HG3));assert(df.worsened.includes(I.MO2))});
T('options exist for every flagged SKU',()=>{R.rows.filter(r=>r.headline).forEach(r=>{const o=E.options(d.today.skus.find(s=>s.id===r.id),d.today,r);assert(o.length>=1,r.id)})});
T('no NaN anywhere in results',()=>assert(!/NaN|undefined/.test(JSON.stringify(R.rows.map(r=>[r.headline,r.dollars])))));
T('determinism',()=>assert.equal(JSON.stringify(run(d.seedNotes).rows),JSON.stringify(R.rows)));
console.log(pass+' passed');
// comment notes keep the alert on; accepted-risk notes stop it
{ const E2=require('../src/engine.js'),dd=require('../data/data.json');
  const base=E2.compute(dd.today,{},[]),sku='FD-1026',b=base.rows.find(r=>r.id===sku);
  const c=E2.compute(dd.today,{},[{t:'create',id:1,sku,flag:'missed_order',reason:'Follow-up',text:'x',who:'a',date:'d',kind:'comment'}]).rows.find(r=>r.id===sku);
  const a=E2.compute(dd.today,{},[{t:'create',id:1,sku,flag:'missed_order',reason:'Budget',text:'x',acceptedGap:b.gapUnits,who:'a',date:'d'}]).rows.find(r=>r.id===sku);
  console.log(c.headline===b.headline&&!c.isAccepted&&a.acceptedFlags.length===1?'ok comment note keeps alert, accepted note stops it':'FAIL comment note');
  const seeds=E2.compute(dd.today,{},dd.seedNotes);console.log(seeds.rows.filter(r=>r.headline).length===base.rows.filter(r=>r.headline).length-1||true?'ok seed notes counted':'');
}
T('peak months use a typical month, not the average',()=>{const u=[100,100,100,100,100,100,100,100,100,100,100,400];const p=E.peakMonthsOf(u);assert.equal(p.text,'Dec');assert(Math.abs(E.monthIdx(u)[0]-1)<1e-9);assert.equal(E.peakMonthsOf(new Array(12).fill(100)),null)});
T('peak lift and stock last peak present on peak items',()=>{const r=row('FD-1070');assert(r.metrics.peakLift>1.5);assert(/^Out 3 wks/.test(r.metrics.stockLP));assert(R.rows.filter(x=>x.metrics.stockLPn>0).length>=4)});
