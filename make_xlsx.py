import json, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.formatting.rule import CellIsRule, FormulaRule
d = json.load(open('data/data.json')); R = json.load(open('data/results.json'))
T = d['today']; res = {r['id']: r for r in R['rows']}
wb = Workbook()
HF = PatternFill('solid', fgColor='1F3A9E'); HFont = Font(bold=True, color='FFFFFF'); SRCF = PatternFill('solid', fgColor='E8ECF5')
def head(ws, row, cols, src=None):
    for i, c in enumerate(cols, 1):
        x = ws.cell(row, i, c); x.fill = HF; x.font = HFont; x.alignment = Alignment(wrap_text=True, vertical='center')
        if src:
            s = ws.cell(row-1, i, src[i-1] if src[i-1] else None); s.fill = SRCF; s.font = Font(italic=True, size=9, color='44505F')
    ws.row_dimensions[row].height = 34
def widths(ws, w):
    for i, x in enumerate(w, 1): ws.column_dimensions[L(i)].width = x

# ---- Read Me
ws = wb.active; ws.title = 'Read Me'
lines = ['Demand Planning Assistant: combined data workbook', 'SAMPLE DATA, NOT MATTEL DATA. Every brand, supplier and number is invented.', '',
 'What this is: the same combined data the website shows, in a sheet you can filter, sort and pivot.',
 'Findings: one row per SKU. Status, decision, reason and dollars come from the flag engine (values). Supply, weeks of supply, shipping vs sales and the checks beside them are live formulas that follow the Settings tab.',
 'Combined Data: week-by-week POS, forecast, shipments and prior years. The grey row above each header names the source system.',
 'Notes: every note ever written. Notes never expire. Removing one adds a removal row; nothing is deleted.',
 'Settings: thresholds the live checks use. Change a value and the checks in Findings update.',
 'Data Health and Schema Log: what happened in today\'s load and how fields are matched.',
 'Data Used: which fields feed which flags.', '',
 'Note: the Status and "What is going on" columns are engine output from the day the file was made. They do not recalculate when you edit Settings; the "Live check" columns do.']
for i, t in enumerate(lines, 1):
    c = ws.cell(i, 1, t); c.alignment = Alignment(wrap_text=True, vertical='top')
ws['A1'].font = Font(bold=True, size=16); ws['A2'].font = Font(bold=True, color='6D4FB3'); ws.column_dimensions['A'].width = 120

# ---- Settings
st = wb.create_sheet('Settings')
head(st, 1, ['Setting', 'Value', 'What it does'])
S = [('Short vs last year: flag when supply is below need by (%)', 10, 'Matches the website setting'), ('Too much stock: weeks of supply above', 16, ''),
     ('Shipping ahead of sales: ratio above', 1.3, '1.3 means shipments are 30% above sell-through'), ('Sales above forecast: ratio above', 1.2, ''),
     ('Hide items under ($ at risk)', 0, 'Used by the Findings filter column')]
for i, (a, b, c) in enumerate(S, 2): st.cell(i, 1, a); st.cell(i, 2, b).fill = PatternFill('solid', fgColor='FFF3CD'); st.cell(i, 3, c)
widths(st, [58, 12, 60])

# ---- Combined Data (long)
cd = wb.create_sheet('Combined Data')
srcs = ['Planning system', 'Calculated', 'Calculated', 'Reporting tool', 'Planning system', 'Reporting tool', 'Reporting tool', 'Reporting tool']
head(cd, 2, ['SKU', 'Week number (2026)', 'Week starting', 'POS units (this year)', 'Forecast units', 'Shipments to retailers', 'POS last year', 'POS 2 years ago'], srcs)
r = 3; wk1 = datetime.date(2025, 12, 29)
for s in T['skus']:
    if s['isNew']: continue
    for w in range(1, 46):
        cd.cell(r, 1, s['id']); cd.cell(r, 2, w); c = cd.cell(r, 3, wk1 + datetime.timedelta(days=7*(w-1))); c.number_format = 'mmm d'
        cd.cell(r, 4, s['pos']['y2026'][w-1]); cd.cell(r, 5, s['forecast26'][w-1]); cd.cell(r, 6, s['ship']['y2026'][w-1])
        cd.cell(r, 7, s['pos']['y2025'][w-1]); cd.cell(r, 8, s['pos']['y2024'][w-1]); r += 1
last = r-1; widths(cd, [12, 12, 13, 14, 14, 16, 14, 14]); cd.freeze_panes = 'A3'; cd.auto_filter.ref = f'A2:H{last}'

# ---- Findings
fs = wb.create_sheet('Findings', 1)
cols = ['SKU', 'Name', 'Subcategory', 'Status', 'Decision', 'What is going on', '$ at risk', 'Confidence', 'Price', 'On hand', 'In transit', 'Open PO qty', 'Supply (live)', 'Forecast next 12 wks', 'Same weeks last year',
        'History-based need', 'Weeks of supply (live)', 'Shipped last 8 wks (live)', 'Sold last 8 wks (live)', 'Ship / sold (live)', 'Live check: too much stock', 'Live check: shipping ahead', 'Live check: short vs last year', 'Note']
src = ['', '', '', 'Flag engine', 'Flag engine', 'Flag engine', 'Flag engine', 'Flag engine', 'Shared file', 'Planning system', 'Planning system', 'Planning system', 'Calculated', 'Planning system', 'Reporting tool', 'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Calculated', 'Uses Settings', 'Uses Settings', 'Uses Settings', 'Notes tab']
head(fs, 2, cols, src)
DEC = {'order_more': 'Order more or expedite', 'too_much': 'Too much', 'forecast_off': 'Forecast looks off', 'check_data': 'Check the data'}
order = {'At risk': 0, 'Medium': 1, 'Watch': 2, 'Too much': 3, 'No risk': 4}
notes = {}
for n in d['seedNotes']: notes[n['sku']] = n['text']
rows = sorted(T['skus'], key=lambda s: (order[res[s['id']]['tier']], -res[s['id']]['dollars']))
for i, s in enumerate(rows, 3):
    x = res[s['id']]; inv = s['inv']
    vals = [s['id'], s['name'], s['sub'], x['tier'], DEC.get(x['decision'], ''), x['headline'] or ('Accepted risk (see note)' if x['accepted'] else ''), round(x['dollars']), x['confidence'], s['price'], inv['onHand'], sum(p['qty'] for p in inv['transit']), sum(p['qty'] for p in inv['pos'])]
    for j, v in enumerate(vals, 1): fs.cell(i, j, v)
    fs.cell(i, 13, f'=J{i}+K{i}+L{i}')
    fs.cell(i, 14, round(x['metrics']['needPlan'])); fs.cell(i, 15, round(x['metrics']['lyRaw'])); fs.cell(i, 16, round(x['metrics']['needHist']))
    if s['isNew']:
        for j in (17, 18, 19, 20, 21, 22, 23): fs.cell(i, j, 'n/a')
    else:
        fs.cell(i, 17, f'=IF(N{i}>0,(J{i}+K{i})/(N{i}/12),"")'); fs.cell(i, 17).number_format = '0.0'
        fs.cell(i, 18, f"=SUMIFS('Combined Data'!F:F,'Combined Data'!A:A,A{i},'Combined Data'!B:B,\">=38\")")
        fs.cell(i, 19, f"=SUMIFS('Combined Data'!D:D,'Combined Data'!A:A,A{i},'Combined Data'!B:B,\">=38\")")
        fs.cell(i, 20, f'=IF(S{i}>0,R{i}/S{i},"")'); fs.cell(i, 20).number_format = '0.00'
        fs.cell(i, 21, f'=IF(AND(ISNUMBER(Q{i}),Q{i}>Settings!$B$3),"Check","")')
        fs.cell(i, 22, f'=IF(AND(ISNUMBER(T{i}),T{i}>Settings!$B$4),"Check","")')
        fs.cell(i, 23, f'=IF(AND(P{i}>0,M{i}<(1-Settings!$B$2/100)*P{i}),"Check","")')
    fs.cell(i, 24, notes.get(s['id'], ''))
    for j in (7, 10, 11, 12, 13, 14, 15, 16, 18, 19): fs.cell(i, j).number_format = '#,##0'
    fs.cell(i, 7).number_format = '$#,##0'; fs.cell(i, 9).number_format = '$#,##0.00'
end = 2+len(rows); fs.auto_filter.ref = f'A2:X{end}'; fs.freeze_panes = 'C3'
widths(fs, [11, 36, 16, 10, 22, 70, 11, 11, 9, 10, 10, 11, 11, 12, 12, 12, 11, 12, 12, 10, 12, 12, 12, 50])
for t, col in (('At risk', 'F8D0CC'), ('Medium', 'FDE3C2'), ('Watch', 'E4DAF5'), ('Too much', 'CDE6F7'), ('No risk', 'D8EEDB')):
    fs.conditional_formatting.add(f'D3:D{end}', CellIsRule(operator='equal', formula=[f'"{t}"'], fill=PatternFill('solid', bgColor=col, fgColor=col)))
fs.conditional_formatting.add(f'U3:W{end}', CellIsRule(operator='equal', formula=['"Check"'], font=Font(bold=True, color='B3261E')))
fs.cell(1, 1, 'Sample data, not Mattel data. Status, decision, reason and $ come from the flag engine; columns marked "live" are formulas.').font = Font(bold=True, color='6D4FB3')

# ---- Notes
nt = wb.create_sheet('Notes'); head(nt, 1, ['Note id', 'SKU', 'Flag', 'Reason', 'Note', 'Accepted gap (units)', 'Re-alert if gap passes', 'Who', 'Date', 'Status'])
for i, n in enumerate(d['seedNotes'], 2):
    for j, v in enumerate([n['id'], n['sku'], n['flag'], n['reason'], n['text'], n['acceptedGap'], round(n['acceptedGap']*1.5), n['who'], n['date'], 'Active, never expires'], 1): nt.cell(i, j, v)
widths(nt, [8, 11, 14, 14, 80, 14, 16, 10, 10, 22])
# ---- Data Health
dh = wb.create_sheet('Data Health'); head(dh, 1, ['File', 'Source', 'Status', 'What happened'])
nm = {s['id']: s['name'] for s in d['sources']}
for i, r_ in enumerate(d['loadReport'], 2):
    for j, v in enumerate([r_['file'], nm[r_['src']], {'ok': 'OK', 'new_field': 'New field kept', 'quarantined': 'Held back'}[r_['status']], r_['msg']], 1): dh.cell(i, j, v)
widths(dh, [26, 28, 16, 110])
# ---- Schema Log
sl = wb.create_sheet('Schema Log'); head(sl, 1, ['Canonical field', 'Source it comes from', 'Name seen in file', 'Match', 'Used by'])
sch = [('POS units', 'Reporting tool', 'sell_thru_units (was pos_units)', 'Auto-matched (high confidence, low risk)', 'Sales above forecast, Too much stock, Short vs last year'),
 ('Shipments', 'Reporting tool', 'shipped_units', 'Exact', 'Shipping ahead of sales'), ('On hand', 'Planning system', 'on_hand', 'Exact', 'Missed order, Lead time risk, Too much stock'),
 ('In transit', 'Planning system', 'in_transit', 'Exact', 'Missed order, Lead time risk'), ('Open PO qty and ETA', 'Planning system', 'po_qty, po_eta', 'Exact', 'Missed order, Lead time risk'),
 ('Forecast', 'Planning system', 'fcst_units', 'Exact', 'Most flags'), ('Supplier lead time', 'Shared file', 'quoted_weeks, history', 'Exact', 'Missed order, Lead time risk'),
 ('Promo calendar', 'Shared file', 'promo_name, weeks', 'Exact', 'Promo repeat'), ('retailer_inv_units', 'Planning system', 'retailer_inv_units', 'New field: kept, tagged "not used yet"', 'Nothing yet')]
for i, row in enumerate(sch, 2):
    for j, v in enumerate(row, 1): sl.cell(i, j, v)
widths(sl, [24, 20, 34, 42, 56])
# ---- Data Used
du = wb.create_sheet('Data Used'); flags = ['Missed order', 'Lead time risk', 'Short vs last year', 'Promo repeat', 'Sales above forecast', 'Too much stock', 'Shipping ahead of sales', 'New item forecast']
fields = ['POS (this year)', 'POS (last year, 2 years ago)', 'Forecast', 'On hand', 'In transit', 'Open POs and ETAs', 'Supplier lead times', 'Promo calendar', 'Shipments', 'Similar past items']
M = {'Missed order': [3, 4, 5, 6, 7, 2], 'Lead time risk': [3, 4, 5, 6, 7, 2], 'Short vs last year': [0, 1, 2, 3, 4, 5], 'Promo repeat': [1, 2, 3, 4, 5, 7], 'Sales above forecast': [0, 2, 3, 4, 5], 'Too much stock': [0, 2, 3, 4], 'Shipping ahead of sales': [0, 8], 'New item forecast': [2, 9]}
head(du, 1, ['Flag'] + fields)
for i, f in enumerate(flags, 2):
    du.cell(i, 1, f)
    for j in range(len(fields)):
        if j in M[f]: du.cell(i, j+2, 'Yes').fill = PatternFill('solid', fgColor='D8EEDB')
widths(du, [26] + [18]*len(fields))
for w in (nt, dh, sl, du): w.freeze_panes = 'A2'
wb.save('planning-combined-data-sample.xlsx'); print('saved', end)
