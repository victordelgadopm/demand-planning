"""Checks the downloaded workbook's XLOOKUP formulas without Excel: structure, then an independent re-run of every lookup against the Master List, compared with the saved values."""
import openpyxl,re,sys,zipfile
P='/tmp/claude-0/t3.xlsx';L='/tmp/claude-0/t3_legacy.xlsx'
res=[]
def ok(n,c):
    res.append(c);print(('ok  ' if c else 'FAIL ')+n)
z=zipfile.ZipFile(P);xml=''.join(z.read(n).decode('utf8','ignore') for n in z.namelist() if n.startswith('xl/worksheets/'))
bare=len(re.findall(r'(?<!_xlfn\.)XLOOKUP\(',xml));pre=xml.count('_xlfn.XLOOKUP(')
ok('download uses XLOOKUP saved with the _xlfn prefix Excel needs (%d formulas)'%pre,pre>1000 and bare==0)
ok('download holds no INDEX/MATCH lookups by SKU',not re.search(r'INDEX\([^)]*MATCH\(\$',xml))
zl=zipfile.ZipFile(L);xl=''.join(zl.read(n).decode('utf8','ignore') for n in zl.namelist() if n.startswith('xl/worksheets/'))
ok('legacy twin (for the recalculation test) has INDEX/MATCH and no XLOOKUP','XLOOKUP' not in xl and 'INDEX(' in xl)
wf=openpyxl.load_workbook(P);wv=openpyxl.load_workbook(P,data_only=True)
pat=re.compile(r'^IF\(_xlfn\.XLOOKUP\((\$[A-Z]+\d+),(.+?),(.+?),""\)="","",_xlfn\.XLOOKUP\(\1,\2,\3,""\)\)$')
def rng(ref):
    m=re.match(r"^'?(.+?)'?!\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)$",ref);sh,c,r1,_,r2=m.groups();return sh,c,int(r1),int(r2)
cells=bad=0;sheets=set()
for ws in wf.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if isinstance(c.value,str) and '_xlfn.XLOOKUP' in c.value:
                m=pat.match(c.value.lstrip('='))
                if not m: bad+=1;print('unparsed',ws.title,c.coordinate,c.value[:90]);continue
                key,kr,rr=m.groups();k=ws[key.replace('$','')].value
                if isinstance(k,str) and k.startswith('='): k=wv[ws.title][key.replace('$','')].value
                sh,kc,r1,r2=rng(kr);_,rc,_,_=rng(rr);src=wv[sh]
                got=''
                for r in range(r1,r2+1):
                    if src[f'{kc}{r}'].value==k: got=src[f'{rc}{r}'].value;break
                got='' if got is None else got
                exp=wv[ws.title][c.coordinate].value;exp='' if exp is None else exp
                cells+=1;sheets.add(ws.title)
                if got!=exp and not (isinstance(got,(int,float)) and isinstance(exp,(int,float)) and abs(got-exp)<1e-9): bad+=1;print('MISMATCH',ws.title,c.coordinate,got,exp) if bad<8 else 0
ok('every XLOOKUP formula parses and re-runs to its saved value (%d cells on %d tabs, %d differences)'%(cells,len(sheets),bad),cells>1000 and bad==0)
print(sum(res),'/',len(res));sys.exit(0 if all(res) else 1)
