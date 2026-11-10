const E=require('../src/engine.js'),fs=require('fs');
const d=JSON.parse(fs.readFileSync(process.argv[2]||'data/data.raw.json'));
const r=E.compute(d.today,{},[]);
console.log(r.tiers,JSON.stringify(Object.fromEntries(Object.entries(r.dec).map(([k,v])=>[k,v.n]))));
const ids=d.ids;
for(const [k,id] of Object.entries(ids)){const x=r.rows.find(z=>z.id===id);console.log(k.padEnd(5),id.padEnd(8),x.tier.padEnd(8),(x.headlineType||'-').padEnd(14),Math.round(x.dollars),'|',x.flags.map(f=>f.type+':'+f.tier).join(','));}
const planted=new Set(Object.values(ids));
console.log('\nUnplanted flagged:');
r.rows.filter(x=>!planted.has(x.id)&&x.flags.length).forEach(x=>console.log(x.id,x.sub,x.tier,x.flags.map(f=>f.type).join(','),x.headline));
console.log('\naccuracy',JSON.stringify(Object.fromEntries(Object.entries(E.accuracy(d.today)).map(([k,v])=>[k,[+(v.bias*100).toFixed(1),+v.t.toFixed(1),v.possible]]))));
