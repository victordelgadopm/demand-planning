const E=require('./src/engine.js'),fs=require('fs');
const d=JSON.parse(fs.readFileSync('data/data.raw.json'));const I=d.ids;
const find=(s,id)=>s.skus.find(x=>x.id===id);
const y=JSON.parse(JSON.stringify(d.today));y.meta.asOf='Nov 7';
// yesterday differences
find(y,I.LP1).inv.pos[0].etaH=5;                       // supplier pushed ETA today
find(y,I.RC1).inv.pos=[];find(y,I.RC1).inv.transit=[];  // PO placed since yesterday
const mo2=find(y,I.MO2);mo2.inv.onHand=Math.round(mo2.inv.onHand*1.06); // got worse
const op1=find(y,I.OP1);op1.pos.y2026[44]=Math.round(op1.forecast26[44]*1.1); // outpacing began
find(y,I.DQ1).inv.onHand=120;                          // data issue is new today
d.yesterday=y;
const t=E.compute(d.today,{},[]);const g=id=>t.rows.find(r=>r.id===id).flags.find(f=>f.type==='history_gap').gapUnits;
const gap2=g(I.HG2),gap3=g(I.HG3);
// HG3: yesterday gap was half of today's, planner accepted that
const hg3y=find(y,I.HG3);hg3y.inv.pos[0].qty+=Math.round(gap3/2);
d.seedNotes=[
 {t:'create',id:1,sku:I.HG2,flag:'history_gap',reason:'Budget',text:'Sold a lot more last year over the holidays. This year\'s budget does not allow the same quantity and focus is on another line. Revisit only if the gap grows.',acceptedGap:Math.round(gap2),who:'Victor',date:'Oct 21'},
 {t:'create',id:2,sku:I.HG3,flag:'history_gap',reason:'Budget',text:'Holiday spike last year. Accepted the smaller buy while the budget is tight.',acceptedGap:Math.round(gap3/2),who:'Victor',date:'Oct 14'}
];
fs.writeFileSync('data/data.json',JSON.stringify(d));
const ry=E.compute(y,{},E.activeNotes?d.seedNotes:[]),rt=E.compute(d.today,{},d.seedNotes);
const df=E.diff(ry,rt);console.log(JSON.stringify(df));
console.log('tiers',rt.tiers,'accepted',rt.accepted);
const n=id=>rt.rows.find(r=>r.id===id);
console.log('HG2',n(I.HG2).isAccepted,'HG3 reAlert',n(I.HG3).reAlert,n(I.HG3).tier);
console.log('size KB',Math.round(fs.statSync('data/data.json').size/1024));
