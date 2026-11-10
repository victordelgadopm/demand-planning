from playwright.sync_api import sync_playwright
import openpyxl
R=[]
def ok(n,c):R.append(bool(c));print('ok  ' if c else 'FAIL',n)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1366,'height':850},accept_downloads=True)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/mattel-demo/dist/index.html')
    ok('home leads with 3 steps',pg.locator('.step').count()==3 and 'Connect' in pg.locator('.step h2').first.inner_text())
    pg.click('[data-route=chatgpt]');ok('route panel changes','ChatGPT' in pg.locator('#routebox h3').inner_text())
    pg.click('nav [data-nav=sheet]');ok('sheet shows 17 attention rows',pg.locator('.xt tbody tr').count()==17)
    pg.click('[data-rows=all]');ok('all rows 123',pg.locator('.xt tbody tr').count()==123)
    pg.click('[data-rows=attn]');pg.click('.xt tbody tr');pg.wait_for_selector('#drawer.on');ok('row opens drawer',True);pg.keyboard.press('Escape')
    pg.click('nav [data-nav=custom]');pg.fill('#chat-t',"I don't see how many weeks of stock we have");pg.press('#chat-t','Enter')
    ok('weeks of supply column added',pg.evaluate("window.__shell.cols().includes('wos')"))
    pg.fill('#chat-t','make it purple');pg.press('#chat-t','Enter');ok('unknown request is honest','only know a few' in pg.locator('.msg.ai').last.inner_text())
    pg.click('nav [data-nav=sheet]');ok('new column visible','Weeks Of Supply' in pg.locator('.xt thead .heads').inner_text())
    with pg.expect_download() as d: pg.click('#sh-dl')
    d.value.save_as('/tmp/claude-0/t3.xlsx')
    wb=openpyxl.load_workbook('/tmp/claude-0/t3.xlsx');ws=wb['Today']
    ok('xlsx 5 sheets',wb.sheetnames==['Today','All Items','Since Yesterday','Notes','Recipe'])
    ok('xlsx includes added column','Weeks Of Supply' in [c.value for c in ws[1]])
    ok('xlsx frozen+filter',ws.freeze_panes=='A2' and ws.auto_filter.ref is not None)
    ok('xlsx status colored',ws['A2'].fill.fgColor.rgb=='FFF8D7DA')
    ok('xlsx all items 123',wb['All Items'].max_row==124)
    pg.set_viewport_size({'width':390,'height':800});
    for v in ['home','sheet','custom','visual']:
        pg.click('nav [data-nav=%s]'%v);pg.wait_for_timeout(100)
        ok('no page overflow on phone: '+v,pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
    ok('console clean',not errs)
print(sum(R),'/',len(R))
