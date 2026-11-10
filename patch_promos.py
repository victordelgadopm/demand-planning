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
json.dump(d,open('data/data.json','w'),separators=(',',':'))
print('tagged',len(PLAN))
