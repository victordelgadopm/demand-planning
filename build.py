import json,re
d=json.load(open('data/data.json'))
t=open('src/index.template.html').read()
out=t.replace('/*CSS*/',open('src/style.css').read()).replace('/*DATA*/','window.__DATA__='+json.dumps(d,separators=(',',':'))+';')\
 .replace('/*ENGINE*/',open('src/engine.js').read()).replace('/*APP*/',open('src/app.js').read())
open('index.html','w').write(out)
print(len(out)//1024,'KB')
