"""Consistency checks: nothing stale between the site, the Customize page and the downloaded workbook."""
from playwright.sync_api import sync_playwright
import openpyxl,re
R=[]
def ok(n,c):R.append(bool(c));print('ok  ' if c else 'FAIL',n)
BAD=[r'New And New',r'Planned Order',r'Noted By',r'Today tab',r'three green',r'Dropped Items|New And Dropped|dropped from|were dropped|Dropped:',r'Promos And Peaks|Seasonal Items|Seasonal Calendar|Since Yesterday, Notes|12-Week Plan|Recipe sheet|Portfolio Snapshot']
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1366,'height':850},accept_downloads=True)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/mattel-demo/dist/index.html');pg.wait_for_timeout(300)
    # 1. every Customize chip gets a real reply, never the "I only know a few requests" fallback
    pg.click('nav [data-nav=custom]');n=pg.locator('[data-sug]').count()
    bad=[]
    for i in range(n):
        pg.locator('[data-sug]').nth(i).click();pg.wait_for_timeout(80)
        t=pg.locator('#msgs').inner_text()
        if 'I only know a few requests' in t:bad.append(i)
    ok('every Customize example chip gets a real reply (%d chips)'%n,not bad)
    # 2. typed-in columns can be requested and say where they are typed
    pg.fill('#chat-t','Add the date the units are needed by.');pg.click('#chat-f button');pg.wait_for_timeout(100)
    ok('order qty request names the Master List',('Master List' in pg.locator('#msgs').inner_text()) and 'Needed By' in pg.locator('#msgs').inner_text())
    pg.evaluate("document.querySelectorAll('#v-custom details').forEach(d=>d.open=true)");rc=pg.locator('#v-custom').inner_text()
    ok('recipe panel lists Master List green columns and tabs','Master List' in rc and 'Peak Lift Override' in rc and 'New And Missing Items' in rc and 'Seasonal And Promo Lifts' in rc)
    # 3. no stale wording on any page or sheet tab
    allt=[]
    for v in ['home','sheet','custom','visual']:
        pg.click('nav [data-nav=%s]'%v);pg.wait_for_timeout(120);allt.append(pg.locator('main, body').first.inner_text())
    pg.click('nav [data-nav=sheet]')
    tabs=pg.locator('[data-xt]').evaluate_all('e=>e.map(x=>[x.dataset.xt,x.textContent])')
    for k,_ in tabs:
        pg.click('[data-xt=%s]'%k);pg.wait_for_timeout(80);allt.append(pg.locator('.xl').inner_text())
    pg.click('nav [data-nav=visual]');pg.click('[data-tab=season]');allt.append(pg.locator('#tabbody').inner_text())
    txt='\n'.join(allt)
    ok('no stale wording on any page or tab: '+str([x for x in BAD if re.search(x,txt)]),not any(re.search(x,txt) for x in BAD))
    # 4. site tabs == workbook tabs, and every Master column header is a known column
    pg.click('nav [data-nav=sheet]')
    with pg.expect_download() as d:pg.click('#sh-dl')
    d.value.save_as('/tmp/claude-0/t4.xlsx');wb=openpyxl.load_workbook('/tmp/claude-0/t4.xlsx')
    ok('site tabs match workbook tabs',[t for _,t in tabs]==wb.sheetnames)
    hd=[c.value for c in wb['Master List (Work Here)'][1] if c.value]
    pg.click('[data-xt=all]');site=[x for x in pg.locator('.xt thead tr.heads th').all_inner_texts() if x.strip() and x.strip()!='1']
    wbh=[h for h in hd if h not in('Status Match','Show','Base Wk Units','Peak Weeks','Peak Headroom','Promo Units In Peak','Promo Units Outside Peak')]
    ok('site Master columns equal workbook Master columns '+str([(a,b) for a,b in zip(site,wbh) if a!=b][:3]),site==wbh)
    # 5. each non-Master sheet reads the Master (no hard-coded stale copies): formulas present
    for nm in ['Seasonal And Promo Lifts','Notes']:
        ws=wb[nm];ok(nm+' reads from the Master List',any(isinstance(c.value,str) and c.value.startswith('=') for c in ws[2]))
    # 6. the Dashboard note says where to work, and no Recipe or 12-Week Plan tab remains
    dn=str(wb['Dashboard']['A2'].value)
    ok('Dashboard note says where to work and leads with demand','Master List (Work Here)' in dn and dn.startswith('VIEW ONLY. Start with demand') and 'Recipe' not in wb.sheetnames and '12-Week Plan' not in wb.sheetnames)
    # 7. peak, promo and order chain: columns adjacent, history tab present, a typed override reaches the order total
    mh=[c.value for c in wb['Master List (Work Here)'][1]]
    ok('promo columns sit together',mh.index('Last Promo Lift (x)')==mh.index('Last Year Promo (Weeks Starting)')+2 and mh.index('Promo Extra Units')==mh.index('Promo And Peak Overlap')+1)
    ok('order columns sit together',[mh.index(h) for h in ['AI Recommended Qty (Stock Gap)','AI Recommended Add (Peak + Promo)','AI Recommendation Why','AI Recommended Qty (Total)','Order Qty To Place (Type Here)','Variance Vs AI Qty','Your Qty Vs AI']]==list(range(mh.index('AI Recommended Qty (Stock Gap)'),mh.index('AI Recommended Qty (Stock Gap)')+7)))
    hs=wb['Sales History'];ok('Sales History has 4 rows per SKU',(hs.max_row-1)%4==0 and hs.max_row>100 and hs['E2'].value=='2026 Forecast' and hs['E5'].value=='2024 Sold')
    pg.click('nav [data-nav=sheet]');pg.click('[data-xt=hist]');ok('Sales History tab shows on the site',pg.locator('.xt tbody tr').count()>100)
    # 8. supply chain stages: columns, tie-out, drawer table, workbook values
    mh=[c.value for c in wb['Master List (Work Here)'][1]];ws_=wb['Master List (Work Here)']
    need=['In Production (Units)','At Origin (Units)','In Transit (Units)','Open PO (Units)','Next Ready Date','ETA Change (Days)','Production Time (Days)','Transit Quoted (Days)','Transit Actual (Days)']
    ok('master has the supply stage columns',all(h in mh for h in need))
    ip,og,op=[mh.index(h) for h in ['In Production (Units)','At Origin (Units)','Open PO (Units)']]
    ok('in production plus at origin equals open PO on every row',all((r[ip] or 0)+(r[og] or 0)==(r[op] or 0) for r in ws_.iter_rows(min_row=2,values_only=True) if r[0]))
    ok('ETA Change has flagged rows',sum(1 for r in ws_.iter_rows(min_row=2,values_only=True) if (r[mh.index('ETA Change (Days)')] or 0)>=7)>=5)
    pg.click('nav [data-nav=visual]');pg.wait_for_selector('tr.r');pg.fill('#q','FD-1126') if pg.locator('#q').count() else None
    pg.click('tr.r >> nth=0');pg.wait_for_selector('#drawer.on');dt=pg.inner_text('#drawer');ok('drawer shows Orders And Shipments with stages','Orders And Shipments' in dt and ('In Production' in dt or 'At Origin' in dt or 'In Transit' in dt))
    pg.click('#d-close')
    # 9. capitalization after every colon, on every page, sheet tab, email example and the workbook
    import re
    cpat=re.compile(r"[A-Za-z)\]%]: [a-z]\w*");badc=[]
    def cs(tag,tx):
        for m in cpat.finditer(tx):badc.append((tag,tx[max(0,m.start()-25):m.end()+15].replace('\n',' ')))
    for n in ['home','custom','sheet','visual','email','options']:
        pg.click('nav [data-nav=%s]'%n);pg.wait_for_timeout(150)
        if n=='custom':pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        if n=='sheet':
            for k in pg.eval_on_selector_all('[data-xt]','e=>e.map(x=>x.dataset.xt)'):pg.click('[data-xt=%s]'%k);cs('sheet-'+k,pg.inner_text('.xl'))
        if n=='email':
            for k in pg.eval_on_selector_all('[data-ek]','e=>e.map(x=>x.dataset.ek)'):pg.click('[data-ek=%s]'%k);cs('email-'+k,pg.inner_text('#v-email'))
        if n=='home':
            for r in ['manual','folder','copilot','chatgpt']:pg.click('[data-route=%s]'%r);cs('home-'+r,pg.inner_text('#v-home'))
        cs(n,pg.inner_text('#v-'+n))
    for sh in wb.worksheets:
        for row in sh.iter_rows(values_only=True):
            for c in row:
                if isinstance(c,str):cs('xlsx-'+sh.title,c)
    ok('every colon is followed by a capital letter '+str(badc[:5]),not badc)
    LIJS="""()=>{const out=[];document.querySelectorAll('li').forEach(li=>{if(!li.offsetParent)return;const blk=[...li.children].filter(k=>['DIV','BR','P','OL'].includes(k.tagName)||(k.tagName==='UL'&&!k.classList.contains('sub')));if(blk.length)out.push(li.innerText.slice(0,50))});return out}"""
    badli=[]
    for n in ['home','custom','sheet','visual','email','options']:
        pg.click(f'nav [data-nav={n}]');pg.wait_for_timeout(150)
        if n=='custom':pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        if n=='home':
            for r in ['manual','folder','copilot','chatgpt']:
                pg.click(f'[data-route={r}]');badli+=pg.evaluate(LIJS)
        badli+=pg.evaluate(LIJS)
    ok('second lines in lists are nested sub-bullets '+str(badli[:3]),not badli)
    pg.click('nav [data-nav=email]');pg.wait_for_timeout(200)
    f1=pg.locator('.flowcard').first.inner_text().replace('\n',' ')
    ok('Flow 1 order: sources, shared folder, AI agent, planning sheet',f1.find('Your sources')<f1.find('Shared folder')<f1.find('AI agent')<f1.find('Planning sheet'))
    ok('console clean',not errs)
print(sum(R),'/',len(R))
