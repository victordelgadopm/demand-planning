import sys,json
from playwright.sync_api import sync_playwright
errs=[];res=[]
def ok(n,c,x=''):
    res.append((n,bool(c)));print(('ok   ' if c else 'FAIL ')+n,x)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1440,'height':900},accept_downloads=True);pg=ctx.new_page()
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/mattel-demo/dist/index.html');pg.click('nav [data-nav=visual]');pg.wait_for_selector('.dtile')
    ok('4 decision tiles',pg.locator('.dtile').count()==4)
    ok('list has rows',pg.locator('tr.r').count()>=8,pg.locator('tr.r').count())
    pg.screenshot(path='/tmp/claude-0/-home-claude/3084b18b-3036-5981-a313-c78cc3bf82d1/scratchpad/s1.png')
    (pg.locator('#showmore').click() if pg.locator('#showmore').count() else None);pg.locator('tr.r',has_text='Holiday Ball Gown').click();pg.wait_for_selector('#drawer.on')
    ok('drill chart svg',pg.locator('[data-g=drill-chart] svg').count()==1)
    ok('shows 700 vs 1,000',pg.locator('[data-g=drill-chart]').inner_text().find('Supply 7')>=0 and 'last year sold 1,0' in pg.locator('[data-g=drill-chart]').inner_text())
    pg.screenshot(path='/tmp/claude-0/-home-claude/3084b18b-3036-5981-a313-c78cc3bf82d1/scratchpad/s2.png')
    pg.click('#d-close')
    pg.locator('tr.r',has_text='Treehouse').click();pg.wait_for_selector('#s-slip')
    pg.screenshot(path='/tmp/claude-0/-home-claude/3084b18b-3036-5981-a313-c78cc3bf82d1/scratchpad/s3.png',full_page=False)
    pg.fill('#n-text','test note') if pg.locator('#n-text').is_visible() else None
    ok('console clean',not errs,errs)
    b.close()
print(sum(1 for _,c in res if c),'/',len(res))
