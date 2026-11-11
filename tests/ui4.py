"""Consistency checks: nothing stale between the site, the Customize page and the downloaded workbook."""
from playwright.sync_api import sync_playwright
import openpyxl,re
R=[]
def ok(n,c):R.append(bool(c));print('ok  ' if c else 'FAIL',n)
BAD=[r'New And New',r'Planned Order',r'Noted By',r'Today tab',r'three green',r'Dropped Items|New And Dropped|dropped from|were dropped|Dropped:',r'Promos And Peaks Seasonal']
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
    pg.click('#c-reset');pg.wait_for_timeout(100)
    # 2. typed-in columns can be requested and say where they are typed
    pg.fill('#chat-t','Add the order quantity I plan to place.');pg.click('#chat-f button');pg.wait_for_timeout(100)
    ok('order qty request names the Master List',('Master List' in pg.locator('#msgs').inner_text()) and 'Order Qty To Place' in pg.locator('#msgs').inner_text())
    pg.click('#c-reset')
    rc=pg.locator('.recipe:has(h3:text("Your Recipe"))').inner_text()
    ok('recipe panel lists Master List green columns and tabs','Master List' in rc and 'Peak Lift Override' in rc and 'New And Missing Items' in rc and 'Promos And Peaks' in rc and 'Seasonal Items' in rc)
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
    wbh=[h for h in hd if h not in('Status Match','Show','Base Wk Units','Peak Weeks','Peak Headroom')]
    ok('site Master columns equal workbook Master columns '+str([(a,b) for a,b in zip(site,wbh) if a!=b][:3]),site==wbh)
    # 5. each non-Master sheet reads the Master (no hard-coded stale copies): formulas present
    for nm in ['Seasonal Items','Promos And Peaks','Notes']:
        ws=wb[nm];ok(nm+' reads from the Master List',any(isinstance(c.value,str) and c.value.startswith('=') for c in ws[2]))
    # 6. Recipe sheet mentions every tab that holds typed or carried work
    rs=wb['Recipe'];rt=' '.join(str(c.value) for r in rs.iter_rows() for c in r if c.value)
    ok('Recipe sheet mentions New And Missing Items and Order Qty To Place','New And Missing Items' in rt and 'Order Qty To Place' in rt)
    ok('console clean',not errs)
print(sum(R),'/',len(R))
