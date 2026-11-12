from playwright.sync_api import sync_playwright
import openpyxl
R=[]
def ok(n,c):R.append(bool(c));print('ok  ' if c else 'FAIL',n)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1366,'height':850},accept_downloads=True)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/mattel-demo/dist/index.html')
    ok('home shows 5 steps',pg.locator('.step').count()==5 and 'Connect' in pg.locator('.step h2').first.inner_text())
    # one source of truth: for every route and system the map, the route box, the matrix and the Setup Options table agree
    RDJ=pg.evaluate("(()=>{const o={};for(const k of ['manual','folder','copilot','chatgpt']){}return null})()")
    mt={'yes':'Yes','part':'Partly','no':'No direct connection'}
    exp={'manual':['yes','yes'],'folder':['part','part'],'copilot':['yes','part'],'chatgpt':['no','yes']}
    cols_={'yes':'#1f7a34','part':'#b45309','no':'#b3261e'}
    for ri,(rk,sts) in enumerate(exp.items()):
        pg.click('[data-route=%s]'%rk);pg.wait_for_timeout(100)
        box=pg.inner_text('#routebox');ok('route box explains why for both systems and why a shared folder on '+rk,box.count('Why this path:')==2 and 'Why a shared folder:' in box);ok('route box matches table for '+rk,all(('%s: %s.'%(n,mt[s])) in box for n,s in zip(['Anaplan','Tableau'],sts)))
        ok('map colors match table for '+rk,all(pg.locator('[data-node^=conn%d%s] rect'%(i,s)).get_attribute('stroke')==cols_[s] for i,s in enumerate(sts)))
        cells=pg.locator('.mx >> nth=0').locator('tbody tr').nth(0).locator('td').all();cells2=pg.locator('.mx >> nth=0').locator('tbody tr').nth(1).locator('td').all()
        ok('matrix matches for '+rk,mt[sts[0]] in cells[ri].inner_text() and mt[sts[1]] in cells2[ri].inner_text())
    for rk,blocked in [('chatgpt',1),('copilot',0),('manual',0),('folder',0)]:
        pg.click('[data-route=%s]'%rk);pg.wait_for_timeout(80)
        ok('map for %s always passes through the shared folder and names the agent'%rk,pg.locator('[data-node=folder]').count()==1 and pg.locator('[data-node=hub]').count()==1 and pg.locator('[data-node=email]').count()==1 and any(a in pg.locator('[data-node=hub]').text_content() for a in ['ChatGPT','Copilot']))
        ok('map for %s shows the blocked box and an export workaround only where needed'%rk,(pg.locator('[data-node$=no] >> nth=0').count()==blocked) and (pg.locator('[data-node^=work]').count()>=blocked))
    pg.click('[data-route=chatgpt]');ok('export box says it is to get the full data','To get the full data' in pg.locator('[data-node^=work]').first.text_content());pg.click('[data-route=copilot]');ok('Copilot map offers an export for the partly rated Tableau','Copilot' in pg.locator('[data-node=hub]').text_content() and pg.locator('[data-node=work1]').count()==1)
    pg.click('[data-route=chatgpt]');ok('ChatGPT route says only Tableau connects directly and Anaplan needs an export','Tableau only' in pg.inner_text('#routebox') and 'Anaplan has no direct connection' in pg.inner_text('#routebox') and 'manual or automated export' in pg.inner_text('#routebox'))
    pg.click('nav [data-nav=sheet]');ok('sheet opens on Dashboard with 22 rows',pg.locator('.dtab tbody tr').count()==22 and pg.locator('.dbox').count()==4)
    pg.select_option('#dd','Order more or expedite');pg.select_option('#ds','All statuses');ok('dashboard pickers filter to 15',pg.locator('.dtab tbody tr').count()==15 and 'Items matching your choices: 15' in pg.locator('.dcount').inner_text())
    pg.select_option('#dd','All decisions');pg.select_option('#ds','At risk');ok('dashboard status picker filters to 2',pg.locator('.dtab tbody tr').count()==2)
    pg.select_option('#ds','Needs attention');ok('no Today tab',pg.locator('[data-xt=today]').count()==0)
    pg.click('[data-xt=all]');ok('master list has all 123 rows and a work-here banner',pg.locator('.xt tbody tr').count()==123 and 'Work here' in pg.locator('.role').inner_text())
    ok('master has input columns',pg.locator('.xt th.inp').count()==6)
    pg.click('[data-xt=items]');ok('other tabs say view only','View only' in pg.locator('.role').inner_text())
    pg.click('[data-xt=dash]');pg.click('.dtab tbody tr');pg.wait_for_selector('#drawer.on');ok('row opens drawer',True);pg.keyboard.press('Escape')
    pg.click('nav [data-nav=custom]');pg.fill('#chat-t',"I need the supplier lead time");pg.press('#chat-t','Enter')
    ok('chat is simulated and changes nothing',not pg.evaluate("window.__shell.cols().includes('lt')") and 'Next run' in pg.locator('.msg.ai').last.inner_text())
    pg.fill('#chat-t','make it purple');pg.press('#chat-t','Enter');ok('unknown request is honest','only know a few' in pg.locator('.msg.ai').last.inner_text())
    pg.click('nav [data-nav=sheet]');ok('sheet unchanged by chat','Lead Time' not in pg.locator('.xt thead .heads').inner_text())
    pg.click('[data-xt=dash]')
    for stt in ['Needs attention','All statuses','Overstocked','At risk']:
        pg.select_option('#ds',stt);pg.select_option('#dd','All decisions')
        n=sum(int(x) for x in pg.locator('.dbn').all_inner_texts());none=int(pg.locator('.dcount b').nth(2).inner_text());ok('boxes + no-decision add up to list for '+stt,n+none==pg.locator('.dtab tbody tr').count())
    pg.select_option('#ds','Needs attention')
    for i,lab in enumerate(['Order more or expedite','Too much stock','Forecast looks off','Check the data']):
        n=int(pg.locator('.dbn').nth(i).inner_text());pg.select_option('#dd',lab);ok('box "'+lab+'" matches list',pg.locator('.dtab tbody tr').count()==n)
    pg.select_option('#dd','All decisions')
    dh=pg.locator('.dtab thead').inner_text();ok('dashboard leads with demand columns in order',all(h in dh for h in ['Sales, Last 3 Wks','Forecast, Last 3 Wks','Sales vs Fcst','YTD Comp Vs LY','System Forecast (Next 12 Wks)','AI Forecast (Next 12 Wks)','Last Year (Same 12 Wks)','AI Vs Last Year','Peak Months','Next Promo']) and dh.index('Sales, Last 3 Wks')<dh.index('System Forecast (Next 12 Wks)')<dh.index('AI Forecast (Next 12 Wks)'))
    ok('dashboard keeps supply columns off the front',not any(h in dh for h in ['On Hand','In Transit','In Production','At Origin','ETA Change','Wks Of Supply','Stock-Out','Order Qty To Place']))
    sec=pg.locator('.dsec').all_inner_texts();ok('dashboard sections lead with demand',[x.split('\n')[0].split(' All items')[0].split(' These')[0].strip() for x in sec][:3]==['Demand Snapshot','Demand Signals','Planner Actions'])
    pg.click('[data-xt=acc]');ok('accuracy tab has All Lines','All Lines' in pg.locator('.xt').inner_text())
    pg.click('[data-xt=dash]')
    nav=pg.locator('nav button').all_inner_texts();ok('nav order',nav==['How It Works','Customize','Custom Spreadsheet','Visual View','Custom Email','Setup Options'])
    with pg.expect_download() as d: pg.click('#sh-dl')
    d.value.save_as('/tmp/claude-0/t3.xlsx')
    wb=openpyxl.load_workbook('/tmp/claude-0/t3.xlsx');ws=wb['Dashboard']
    ok('xlsx 11 sheets in demand-first order, no Recipe or 12-Week Plan',wb.sheetnames==['Dashboard','Master List (Work Here)','Sales History','Seasonal And Promo Lifts','Monthly Demand','POS Prediction','Shipping Prediction','Forecast Accuracy','Demand Vs Supply','Notes','New And Missing Items'])
    ok('xlsx matches default columns','Lead Time (Weeks)' not in [c.value for c in ws[22]])
    wm=wb['Master List (Work Here)'];ok('master frozen+filter',wm.freeze_panes=='D2' and wm.auto_filter.ref is not None)
    ok('xlsx status colored',wb['Master List (Work Here)']['A2'].fill.fgColor.rgb=='FFF8D7DA')
    hd=[c.value for c in wb['Master List (Work Here)'][1]]
    ok('all items has planner columns',all(h in hd for h in ['On Hand (Units)','In Transit (Units)','Open PO (Units)','Weeks Of Supply','System Forecast Per Week (Units)','Stock-Out Week','Order By','ABC Class','Forecast Accuracy (13 Wks)']))
    ok('monthly demand sheet: total, 6 lines and 123 items, 6 rows each',wb['Monthly Demand'].max_row==1+(1+6+123)*6)
    nt=wb['Notes'];ok('notes tab has 15 notes',nt.max_row==16)
    for sh,hr in [('Master List (Work Here)',1),('Seasonal And Promo Lifts',1),('Dashboard',22)]:
        ok('note column on '+sh,('Note (Type Here)' if sh.startswith('Master') else 'Note') in [c.value for c in wb[sh][hr]])
    wv=openpyxl.load_workbook('/tmp/claude-0/t3.xlsx',data_only=True)['Master List (Work Here)'];ok('master list note filled for 15 items',sum(1 for r in range(2,125) if wv.cell(r,[c.value for c in wv[1]].index('Note (Type Here)')+1).value)==15)
    ok('only the master list is unlocked',[n for n in wb.sheetnames if not wb[n].protection.sheet]==['Master List (Work Here)'])
    ok('master has input columns',all(h in [c.value for c in wm[1]] for h in ['Peak Lift Override (Type Here)','Order Qty To Place (Type Here)','Needed By (Type Here)','Note (Type Here)','Note Date (Type Here)']))
    ok('master tab dark yellow, dashboard blue',wm.sheet_properties.tabColor.rgb=='FF9A7B00' and wb['Dashboard'].sheet_properties.tabColor.rgb=='FF1F3864')
    ok('master has decision and needs attention columns',all(h in [c.value for c in wm[1]] for h in ['Decision','Needs Attention']))
    ok('xlsx all items 123',wb['Master List (Work Here)'].max_row==124)
    # Visual View follows the same status choice and decision boxes as the Daily Sheet dashboard
    for stl,chip in [('Needs attention','attn'),('Watch','Watch'),('All statuses','all')]:
        pg.click('nav [data-nav=sheet]');pg.wait_for_timeout(100);pg.select_option('#ds',stl);pg.wait_for_timeout(100)
        a=pg.locator('.dbn').all_inner_texts();pg.click('nav [data-nav=visual]');pg.wait_for_timeout(100)
        pg.click('[data-tier=%s]'%chip);pg.wait_for_timeout(100);b=pg.locator('.dtile .n').all_inner_texts()
        ok('visual boxes match dashboard for '+stl+' '+str((a,b)),a==b)
    # new and dropped items, peak override, seasonal calendar
    pg.click('nav [data-nav=sheet]');pg.wait_for_timeout(100)
    pg.click('[data-xt=all]');ok('3 new items marked New Today on the master list, no row shading',pg.locator('tr.newrow').count()==0 and pg.locator('td.t-new').count()==3)
    pg.click('[data-xt=dropped]');ok('new and dropped tab lists 3 new and 2 missing',pg.locator('.xt tbody tr').count()==5 and pg.locator('.xt td.t-drop').count()==2)
    ok('Seasonal Calendar and Since Yesterday tabs are gone',pg.locator('[data-xt=season]').count()==0 and pg.locator('[data-xt=since]').count()==0)
    pg.click('[data-xt=items]');pg.select_option('#il','Collector');ok('line filter on Seasonal And Promo Lifts',pg.locator('#il').input_value()=='Collector' and pg.locator('.xt').first.locator('tbody tr').count()==18 and 'Where This Comes From' in pg.locator('#v-sheet').inner_text())
    wd=wb['New And Missing Items'];ok('xlsx new and dropped sheet has 5 rows',wd.max_row==6)
    hm=[c.value for c in wm[1]];ok('xlsx master has file status and order columns',all(h in hm for h in ['File Status','Peak Lift (x)','Stock Last Peak','AI Recommended Qty (Stock Gap)','AI Recommended Add (Peak + Promo)','AI Recommendation Why','AI Recommended Qty (Total)']))
    fs=hm.index('File Status')+1;ok('xlsx 3 New Today cells',sum(1 for r in range(2,125) if wm.cell(r,fs).value=='New Today')==3)
    ok('override has number validation',any(d.type=='decimal' for d in wm.data_validations.dataValidation))
    ok('dashboard carry-over line',wb['Dashboard']['A3'].value is not None)
    pg.set_viewport_size({'width':390,'height':800});
    for v in ['home','sheet','custom','visual']:
        pg.click('nav [data-nav=%s]'%v);pg.wait_for_timeout(100)
        ok('no page overflow on phone: '+v,pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
    ok('console clean',not errs)
print(sum(R),'/',len(R))
