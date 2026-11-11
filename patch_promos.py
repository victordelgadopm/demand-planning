"""Adds a realistic promo calendar to the sample data. Reads data/data.base.json, writes data/data.json."""
import json
d=json.load(open('data/data.base.json'))
BF='Black Friday Doorbuster at Big-Box Retailer';CW='Cyber Week Online Deal';HF='Holiday Feature at Big-Box Retailer';GG='Holiday Gift Guide Feature'
# id: (promo name, last-year weeks, this-year weeks-ahead, confirmed this year, last-year lift)
PLAN={
 'FD-1063':(BF,[48],[2],True,.55),'FD-1070':(HF,[50,51],[4,5],True,.40),'SM-1049':(CW,[49],[3],True,.35),'SM-1060':(GG,[49,50],[3,4],True,.45),
 'BB-1031':(BF,[48],[2],True,.45),'PH-1029':(HF,[49,50],[3,4],True,.50),'AC-1031':(CW,[49],[3],True,.35),'CD-1033':(GG,[50,51],[4,5],True,.25),
 'FD-1082':(BF,[48,49],[],None,.50),'SM-1068':(CW,[49],[],None,.35),'BB-1037':(GG,[50,51],[],None,.30),
 'PH-1035':('New: '+HF,[],[3,4],True,0),'AC-1038':('New: Black Friday Online Deal',[],[2],True,0),'CD-1035':('New: Gift Guide Feature',[],[4,5],True,0)}
for snap in ('today','yesterday'):
    for s in d[snap]['skus']:
        if s['id'] not in PLAN: continue
        name,ly,ty,conf,lift=PLAN[s['id']]
        s['promo']={'ly':[{'w':w,'name':name} for w in ly],'ty':[{'h':h,'confirmed':conf,'name':name} for h in ty]}
        for w in ly: s['pos']['y2025'][w-1]=int(round(s['pos']['y2025'][w-1]*(1+lift)))
NOTES=[
 ('FD-1026','missed_order','Supplier update','Asked the supplier for a rush option. Waiting on a quote for a split air shipment.','Planner A','Nov 6'),
 ('PH-1011','late_po','Supplier update','Supplier confirmed the PO arrives Jan 11. Asked if part of it can ship earlier. Reply due this week.','Planner B','Nov 7'),
 ('FD-1029','promo_repeat','Promo update','Nov 30 promo is confirmed with the retailer. Asked the supplier to pull in the shortfall before the promo week.','Planner A','Nov 6'),
 ('BB-1015','promo_repeat','Waiting on Sales','Nov 30 promo is not confirmed yet. Holding the order until Sales hears back from the retailer.','Planner A','Nov 7'),
 ('AC-1010','late_po','Follow-up','Cover is thin for the Nov 16 to Dec 14 peak. Rechecking after Black Friday sales.','Planner C','Nov 5'),
 ('AC-1018','overstock','Follow-up','Marketing has a January markdown planned. Pause new orders until it runs.','Planner C','Nov 4'),
 ('SM-1033','channel_fill','Waiting on Sales','Asked Sales for the retailers\' weeks of stock before shipping more.','Planner C','Nov 5'),
 ('BB-1022','check_data','Data issue','Negative on hand sent back to the warehouse system owner for a recount.','Planner A','Nov 7'),
 ('FD-1039','pos_outpacing','Follow-up','Sales are running ahead of forecast. Asked the forecast owner to lift the next 4 weeks.','Planner A','Nov 6'),
 ('SM-1046','check_data','Data issue','Supplier lead time is missing. Asked the buyer for the quoted lead time.','Planner C','Nov 3'),
 ('SM-1060','promo','Promo update','Promo confirmed for Nov 30. Supply covers the base forecast plus last year\'s lift.','Planner C','Nov 4'),
 ('BB-1037','promo','Promo update','Last year\'s promo is not repeating, per Sales. Do not plan a lift.','Planner A','Nov 3'),
 ('CD-1035','promo','Promo update','First promo for this item, so there is no lift history. Watching sell-through in week 1.','Planner B','Nov 8')]
nid=max([n['id'] for n in d['seedNotes']]+[0])
for sku,flag,reason,text,who,date in NOTES:
    nid+=1; d['seedNotes'].append({'t':'create','id':nid,'sku':sku,'flag':flag,'reason':reason,'text':text,'who':who,'date':date,'kind':'comment'})
json.dump(d,open('data/data.json','w'),separators=(',',':'))
print('tagged',len(PLAN))
