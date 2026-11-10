from playwright.sync_api import sync_playwright
import openpyxl
R=[]
def ok(n,c):R.append(bool(c));print('ok  ' if c else 'FAIL',n)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1366,'height':850},accept_downloads=True)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/mattel-demo/dist/index.html')
    ok('home shows 4 steps',pg.locator('.step').count()==4 and 'Connect' in pg.locator('.step h2').first.inner_text())
    pg.click('[data-route=chatgpt]');ok('route panel changes','ChatGPT' in pg.locator('#routebox h3').inner_text())
    pg.click('nav [data-nav=sheet]');ok('sheet opens on Dashboard with 17 rows',pg.locator('.dtab tbody tr').count()==17 and pg.locator('.dbox').count()==4)
    pg.select_option('#dd','Order more or expedite');pg.select_option('#ds','All statuses');ok('dashboard pickers filter to 10',pg.locator('.dtab tbody tr').count()==10 and 'Items matching your choices: 10' in pg.locator('.dcount').inner_text())
    pg.select_option('#dd','All decisions');pg.select_option('#ds','At risk');ok('dashboard status picker filters to 2',pg.locator('.dtab tbody tr').count()==2)
    pg.select_option('#ds','Needs attention');pg.click('[data-xt=today]');ok('today tab shows 17 attention rows',pg.locator('.xt tbody tr').count()==17)
    pg.click('[data-rows=all]');ok('all rows 123',pg.locator('.xt tbody tr').count()==123)
    pg.click('[data-rows=attn]');pg.click('.xt tbody tr');pg.wait_for_selector('#drawer.on');ok('row opens drawer',True);pg.keyboard.press('Escape')
    pg.click('nav [data-nav=custom]');pg.fill('#chat-t',"I need the supplier lead time");pg.press('#chat-t','Enter')
    ok('lead time column added',pg.evaluate("window.__shell.cols().includes('lt')"))
    pg.fill('#chat-t','make it purple');pg.press('#chat-t','Enter');ok('unknown request is honest','only know a few' in pg.locator('.msg.ai').last.inner_text())
    pg.click('nav [data-nav=sheet]');ok('new column visible','Lead Time' in pg.locator('.xt thead .heads').inner_text())
    pg.click('[data-xt=dash]')
    for stt in ['Needs attention','All statuses','Overstocked','At risk']:
        pg.select_option('#ds',stt);pg.select_option('#dd','All decisions')
        n=sum(int(x) for x in pg.locator('.dbn').all_inner_texts());none=int(pg.locator('.dcount b').nth(2).inner_text());ok('boxes + no-decision add up to list for '+stt,n+none==pg.locator('.dtab tbody tr').count())
    pg.select_option('#ds','Needs attention')
    for i,lab in enumerate(['Order more or expedite','Too much stock','Forecast looks off','Check the data']):
        n=int(pg.locator('.dbn').nth(i).inner_text());pg.select_option('#dd',lab);ok('box "'+lab+'" matches list',pg.locator('.dtab tbody tr').count()==n)
    pg.select_option('#dd','All decisions')
    ok('dashboard has planner headers',all(h in pg.locator('.dtab thead').inner_text() for h in ['On Hand','On Order','Wks Of Supply','Stock-Out']))
    pg.click('[data-xt=plan]');ok('plan tab shows negative weeks',pg.locator('.xt td.bad').count()>0)
    pg.click('[data-xt=acc]');ok('accuracy tab has All Lines','All Lines' in pg.locator('.xt').inner_text())
    pg.click('[data-xt=dash]')
    nav=pg.locator('nav button').all_inner_texts();ok('nav order',nav==['How It Works','Daily Sheet','Visual View','Setup Options','Customize'])
    with pg.expect_download() as d: pg.click('#sh-dl')
    d.value.save_as('/tmp/claude-0/t3.xlsx')
    wb=openpyxl.load_workbook('/tmp/claude-0/t3.xlsx');ws=wb['Today']
    ok('xlsx 8 sheets',wb.sheetnames==['Dashboard','Today','All Items','12-Week Plan','Forecast Accuracy','Since Yesterday','Notes','Recipe'])
    ok('xlsx includes added column','Lead Time (Weeks)' in [c.value for c in ws[1]])
    ok('xlsx frozen+filter',ws.freeze_panes=='A2' and ws.auto_filter.ref is not None)
    ok('xlsx status colored',ws['A2'].fill.fgColor.rgb=='FFF8D7DA')
    hd=[c.value for c in wb['All Items'][1]]
    ok('all items has planner columns',all(h in hd for h in ['On Hand (Units)','In Transit (Units)','Open PO (Units)','Weeks Of Supply','Forecast Per Week (Units)','Stock-Out Week','Order By','ABC Class','Forecast Accuracy (13 Wks)']))
    ok('plan sheet 3 rows per item',wb['12-Week Plan'].max_row==1+123*3)
    ok('xlsx all items 123',wb['All Items'].max_row==124)
    pg.set_viewport_size({'width':390,'height':800});
    for v in ['home','sheet','custom','visual']:
        pg.click('nav [data-nav=%s]'%v);pg.wait_for_timeout(100)
        ok('no page overflow on phone: '+v,pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
    ok('console clean',not errs)
print(sum(R),'/',len(R))
