from playwright.sync_api import sync_playwright
SP='/tmp/claude-0/-home-claude/3084b18b-3036-5981-a313-c78cc3bf82d1/scratchpad'
errs=[];res=[]
def ok(n,c,x=''):
    res.append(bool(c));print(('ok   ' if c else 'FAIL ')+n,x)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1440,'height':900},accept_downloads=True);pg=ctx.new_page()
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/mattel-demo/dist/index.html');pg.click('nav [data-nav=visual]');pg.wait_for_selector('.dtile')
    # decision filter
    pg.click('[data-dec=too_much]');ok('decision filter narrows list',pg.locator('tr.r').count()==3,pg.locator('tr.r').count());pg.click('[data-dec=too_much]')
    # tier chip
    pg.click('[data-tier="No risk"]');ok('No risk list shows 106',pg.locator('#cnt').inner_text().startswith('106'));pg.click('[data-tier=attn]')
    pg.fill('#q','Treehouse');ok('search',pg.locator('tr.r').count()==1);pg.fill('#q','')
    # drill
    (pg.locator('#showmore').click() if pg.locator('#showmore').count() else None);pg.locator('tr.r',has_text='Holiday Ball Gown').click();pg.wait_for_timeout(500)
    pg.screenshot(path=SP+'/d1.png')
    pg.evaluate("document.getElementById('drawer').scrollTop=700");pg.wait_for_timeout(200);pg.screenshot(path=SP+'/d2.png')
    # add note
    pg.select_option('#n-kind','accept');pg.fill('#n-text','Budget does not allow this quantity.');pg.click('#n-save');pg.wait_for_timeout(300)
    ok('note saved shows note-box',pg.locator('.note-box').count()==1)
    pg.click('#d-close');ok('accepted tab count 2',' (2)' in pg.locator('[data-tab=acc]').inner_text(),pg.locator('[data-tab=acc]').inner_text())
    # persistence
    pg.reload();pg.click('nav [data-nav=visual]');pg.wait_for_selector('.dtile');ok('note persists after reload',' (2)' in pg.locator('[data-tab=acc]').inner_text())
    pg.click('[data-tab=acc]');pg.wait_for_timeout(200);pg.screenshot(path=SP+'/acc.png')
    (pg.locator('#showmore').click() if pg.locator('#showmore').count() else None);pg.locator('tr.r',has_text='Holiday Ball Gown').click();pg.wait_for_timeout(400)
    pg.click('[data-rm]');pg.click('[id^=rc-]');pg.wait_for_timeout(300)
    ok('remove note keeps history',pg.locator('.hist li').count()>=2,pg.locator('.hist li').count())
    pg.click('#d-close');ok('accepted back to 1',' (1)' in pg.locator('[data-tab=acc]').inner_text())
    pg.click('[data-tab=attn]')
    # what-if
    pg.locator('tr.r',has_text='Snow Day').click();pg.wait_for_selector('#s-slip')
    pg.fill('#s-slip','4');pg.evaluate("document.getElementById('s-slip').dispatchEvent(new Event('input',{bubbles:true}))")
    ok('what-if verdict updates',pg.locator('#wi-v').inner_text()!='' )
    pg.evaluate("document.getElementById('drawer').scrollTop=900");pg.wait_for_timeout(200);pg.screenshot(path=SP+'/wi.png')
    pg.click('#d-close')
    with pg.expect_download() as dl: pg.evaluate('window.__app.downloadCsv()')
    path=dl.value.path();txt=open(path).read();ok('csv rows 124',len(txt.strip().split('\n'))==124,len(txt.strip().split('\n')))
    ok('console clean',not errs,errs)
    b.close()
print(sum(res),'/',len(res))
