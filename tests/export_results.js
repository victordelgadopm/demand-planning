const E=require('../src/engine.js'),fs=require('fs');const d=JSON.parse(fs.readFileSync('data/data.json'));
const R=E.compute(d.today,{},d.seedNotes);
const y=E.compute(d.yesterday,{},d.seedNotes);
fs.writeFileSync('data/results.json',JSON.stringify({rows:R.rows.map(r=>({id:r.id,tier:r.tier,decision:r.decision,headline:r.headline,dollars:r.dollars,confidence:r.headline?r.confidence:'',accepted:r.acceptedFlags.length>0,reAlert:r.reAlert,metrics:{wos:r.metrics.wos,needHist:r.metrics.needHist,lyRaw:r.metrics.lyRaw,supply:r.metrics.supply,needPlan:r.metrics.needPlan,lt:r.metrics.lt}})),diff:E.diff(y,R),acc:E.accuracy(d.today)}));
console.log('ok');
