"""Fake data for the Demand Planning Assistant demo. Sample data, not Mattel data. All brands and suppliers are invented."""
import numpy as np, json, copy
rng = np.random.default_rng(2026)
H = 12
W = np.arange(1, 53)
SUBS = {  # holiday amp, summer amp, price range, supplier
    'Fashion':            dict(A=1.3, B=.20, price=(12, 30), sup='Starfish Toy Works', pre='FD'),
    'Collector':          dict(A=1.8, B=.00, price=(45, 110), sup='Lotus Doll Factory', pre='CD'),
    'Small':              dict(A=1.0, B=.25, price=(6, 14), sup='Harbor Plastics', pre='SM'),
    'Baby':               dict(A=.8, B=.10, price=(14, 38), sup='Sunrise Textiles', pre='BB'),
    'Playsets & Houses':  dict(A=1.5, B=.15, price=(35, 95), sup='Redwood Playsets', pre='PH'),
    'Accessories':        dict(A=.9, B=.20, price=(5, 18), sup='Starfish Toy Works', pre='AC'),
}
SUPPLIERS = {  # quoted lead weeks; history = actual days from PO to dock
    'Starfish Toy Works': 8, 'Lotus Doll Factory': 10, 'Harbor Plastics': 7,
    'Sunrise Textiles': 6, 'Redwood Playsets': 12, 'Bluegate Manufacturing': 9}
LATE = {'Bluegate Manufacturing': 14.5}

def shape(sub, A=None):
    p = SUBS[sub]; A = p['A'] if A is None else A
    return 1 + A*np.exp(-((W-50)/3.2)**2) + p['B']*np.exp(-((W-27)/7)**2) - .25*np.exp(-((W-3)/3)**2)
def sh_at(sh, wk): return sh[(wk-1) % 52]
def ln(s, n): return np.exp(rng.normal(0, s, n))
def ints(a): return [int(round(x)) for x in a]

THEMES = ['Aurora', 'Meadow', 'Skyline', 'Harvest', 'Ember', 'Lagoon', 'Prism', 'Willow', 'Comet', 'Orchid', 'Maple', 'Cobalt',
          'Sunset', 'Frost', 'Velvet', 'Juniper', 'Coral', 'Nova', 'Saffron', 'Tundra', 'Breeze', 'Mosaic', 'Topaz', 'Lantern']
NOUN = {'Fashion': 'Fashion Doll', 'Collector': 'Collector Doll', 'Small': 'Mini Doll 3-Pack', 'Baby': 'Baby Doll',
        'Playsets & Houses': 'Playset', 'Accessories': 'Accessory Pack'}
BRAND = {'Fashion': 'Starlight', 'Collector': 'Heirloom', 'Small': 'Pocket Pals', 'Baby': 'Tiny Dreamers',
         'Playsets & Houses': 'Dreamhouse Co.', 'Accessories': 'Starlight'}

def make(sid, name, sub, mode='healthy', L=None, g=None, **kw):
    P = SUBS[sub]; price = round(float(rng.uniform(*P['price'])), 2)
    L = L or float(rng.uniform(300, 3500) if sub != 'Collector' else rng.uniform(80, 500))
    g = g if g is not None else float(rng.uniform(.92, 1.12))
    sup = kw.get('sup', P['sup']); lumpy = mode == 'lumpy'
    sh = shape(sub); shf = shape(sub, kw.get('A_fc'))
    sg = kw.get('sig', .08)
    y24 = L*.93*sh*ln(sg, 52); y25 = L*sh*ln(sg, 52); y26 = L*g*sh[:45]*ln(sg, 45)
    oos = np.ones(52)
    fc26 = L*g*shf[:45]*(1+rng.normal(0, .05, 45))*kw.get('bias', 1.0)
    F = np.array([L*g*sh_at(shf, 46+h) for h in range(H)])*(1+rng.normal(0, .02, H))
    if lumpy:
        for y in (y24, y25, y26):
            m = rng.random(len(y)) < .35; y[:] = np.where(m, y/.35*ln(.25, len(y)), 0)
        fc26 = L*g*sh[:45]; F = np.array([L*g*sh_at(sh, 46+h) for h in range(H)])
    d = dict(id=sid, name=name, sub=sub, price=price, supplier=sup, lumpy=lumpy, isNew=False, dataIssues=[],
             promo=dict(ly=[], ty=[]), inv=dict(onHand=0, transit=[], pos=[], otherDC=0))
    # scenario shaping of history
    if mode == 'histgap':   # forecast lower than what really sold in the same weeks last year
        tgt = kw['ly_total']; tot_f = F.sum(); scale = kw['fc_total']/tot_f; F *= scale; fc26 *= scale; y24 *= scale; y25 *= scale; y26 *= scale
        cur = y25[45:52].sum() + y26[:5].sum(); k = tgt/cur
        y25[45:52] *= k; y26[:5] *= k
        # spike lives in the holiday weeks, not spread flat
    if mode == 'oos_ly':    # last year stocked out for 3 weeks; observed sales understated, true demand higher
        for w in (47, 48, 49): oos[w-1] = .6; y25[w-1] *= .6
    if kw.get('promo_ly'):
        for w in kw['promo_ly']: y25[w-1] *= (1+kw['lift']); d['promo']['ly'].append(dict(w=w, name=kw.get('promo_name', 'Holiday feature')))
        if kw.get('ty_conf') is not None:
            for h in kw['ty_h']: d['promo']['ty'].append(dict(h=h, confirmed=kw['ty_conf'], name=kw.get('promo_name', 'Holiday feature')))
    if mode == 'outpace' or mode == 'forecastoff':
        y26[42:45] = fc26[42:45]*rng.uniform(1.3, 1.38, 3)
    if mode == 'near_outpace': y26[43:45] = fc26[43:45]*1.3; y26[42] = fc26[42]*.95
    if mode == 'spike': y26[43] = fc26[43]*3.2
    if mode == 'overstock':
        y26[37:41] = y26[37:41]*1.15; y26[41:45] = y26[41:45]*.72
    ship = y26*ln(.05, 45)
    if mode == 'channel': ship[37:45] = y26[37:45]*rng.uniform(1.45, 1.6, 8)
    if mode == 'ship20': ship[37:45] = y26[37:45]*1.2
    # supply
    S6 = F[:6].sum(); inv = d['inv']
    def healthy():
        inv['onHand'] = int(1.15*S6*.85); inv['transit'] = [dict(qty=int(.3*S6*1.15), etaH=2)]
        inv['pos'] = [dict(qty=int(1.2*F[6:].sum()), etaH=int(rng.integers(3, 5)))]
    if mode in ('healthy', 'lumpy', 'oos_ly', 'spike', 'near_outpace', 'channel', 'ship20'): healthy()
    elif mode == 'histgap':
        inv['onHand'] = int(F[:6].sum()*1.02); inv['pos'] = [dict(qty=int(F[6:].sum()), etaH=4)]
    elif mode == 'missed_crit':
        inv['onHand'] = int(F[:5].sum()*1.05)
    elif mode == 'missed_med':
        inv['onHand'] = int(F.sum()*.93)
    elif mode == 'late_crit':
        inv['onHand'] = int(F[:6].sum()*1.02); inv['pos'] = [dict(qty=int(F[6:].sum()*1.1), etaH=9)]
    elif mode == 'late_med':
        inv['onHand'] = int(F[:5].sum()*1.03); inv['pos'] = [dict(qty=int(F[5:].sum()*1.1), etaH=5)]
    elif mode == 'promo':
        inv['onHand'] = int(F[:6].sum()*1.03); inv['pos'] = [dict(qty=int(F[6:].sum()*1.03), etaH=4)]
    elif mode == 'outpace':
        inv['onHand'] = int(F[:6].sum()*1.05); inv['pos'] = [dict(qty=int(F[6:].sum()*1.05), etaH=4)]
    elif mode == 'forecastoff':
        inv['onHand'] = int(F[:6].sum()*1.4); inv['pos'] = [dict(qty=int(F[6:].sum()*1.6), etaH=4)]
    elif mode == 'overstock':
        inv['onHand'] = int(F.mean()*26)
    elif mode == 'dq_neg':
        healthy(); inv['onHand'] = -240
    elif mode == 'dq_sup':
        healthy()
    if kw.get('otherDC'): inv['otherDC'] = int(kw['otherDC'])
    d['pos'] = dict(y2024=ints(y24), y2025=ints(y25), y2026=ints(y26))
    if mode == 'histgap':   # make the displayed last-year total exact after rounding
        cur = sum(d['pos']['y2025'][45:52]) + sum(d['pos']['y2026'][:5]); d['pos']['y2025'][49] += int(round(kw['ly_total'])) - cur
    d['oos25'] = [round(float(x), 2) for x in oos]
    d['ship'] = dict(y2026=ints(ship))
    d['forecast26'] = ints(fc26); d['fcstH'] = ints(F)
    d['launchCurve'] = ints([L*1.1*np.exp(-i/9)*(1+rng.normal(0, .06)) for i in range(12)])
    d['_mode'] = mode
    return d

skus = []; counters = {s: 0 for s in SUBS}
def nm(sub, special=None):
    counters[sub] += 1; i = counters[sub]
    return f"{SUBS[sub]['pre']}-{1000+i*7+int(rng.integers(0,6))}", special or f"{BRAND[sub]} {THEMES[(i*5+len(sub)) % len(THEMES)]} {NOUN[sub]}"

def add(sub, mode='healthy', name=None, **kw):
    sid, n = nm(sub, name); s = make(sid, n, sub, mode, **kw); skus.append(s); return s

S = {}
# planted scenarios (ids kept for tests)
S['HG1'] = add('Fashion', 'histgap', 'Starlight Holiday Ball Gown Doll', L=60, g=1.0, fc_total=692, ly_total=1000)
S['HG2'] = add('Fashion', 'histgap', 'Starlight Sparkle Concert Doll', L=70, g=1.0, fc_total=820, ly_total=1120)
S['HG3'] = add('Small', 'histgap', 'Pocket Pals Winter Friends 3-Pack', L=210, g=1.0, fc_total=2600, ly_total=3900)
S['MO1'] = add('Fashion', 'missed_crit', 'Starlight Galaxy Rider Doll', L=900)
S['MO2'] = add('Baby', 'missed_med', 'Tiny Dreamers Bedtime Baby Doll', L=700, otherDC=400)
S['LP1'] = add('Playsets & Houses', 'late_crit', 'Dreamhouse Co. Treehouse Playset', L=520, otherDC=250)
S['LP2'] = add('Accessories', 'late_med', 'Starlight Winter Wardrobe Pack', L=1400, sup='Bluegate Manufacturing')
S['LP2b'] = add('Small', 'late_med', 'Pocket Pals Snow Day Mini Set', L=1800, sup='Bluegate Manufacturing')
S['PR1'] = add('Fashion', 'promo', 'Starlight Cozy Cabin Doll', L=1100, sig=.03, promo_ly=[49, 50], lift=.5, ty_conf=True, ty_h=[3, 4], promo_name='Holiday feature at Big-Box Retailer')
S['PR2'] = add('Baby', 'promo', 'Tiny Dreamers Little Lullaby Doll', L=800, sig=.03, promo_ly=[49, 50], lift=.45, ty_conf=False, ty_h=[3, 4], promo_name='Holiday feature (not confirmed)')
S['OP1'] = add('Fashion', 'outpace', 'Starlight Road Trip Doll', L=1500)
S['OP2'] = add('Small', 'forecastoff', 'Pocket Pals Pet Parade 3-Pack', L=2200)
S['OV1'] = add('Accessories', 'overstock', 'Starlight Summer Beach Accessory Pack', L=900)
S['OV2'] = add('Playsets & Houses', 'overstock', 'Dreamhouse Co. Garden Cafe Playset', L=260)
S['CF1'] = add('Small', 'channel', 'Pocket Pals Pastel Pals 3-Pack', L=2000)
S['SP1'] = add('Fashion', 'spike', 'Starlight Pop Star Doll', L=1300)
S['NF1'] = add('Fashion', 'oos_ly', 'Starlight Ice Skater Doll', L=1000)
S['HN1'] = add('Accessories', 'near_outpace', 'Starlight Weekend Bag Pack', L=1600)
S['HN2'] = add('Small', 'ship20', 'Pocket Pals Seaside 3-Pack', L=2500)
S['HN3'] = add('Fashion', 'healthy', 'Starlight Stage Door Doll', L=1400, promo_ly=[20, 21], lift=.5)  # LY promo, not repeating
S['LU1'] = add('Collector', 'lumpy', 'Heirloom Victorian Collector Doll', L=300)
S['LU2'] = add('Collector', 'lumpy', 'Heirloom Gala Collector Doll', L=220)
S['LU3'] = add('Collector', 'lumpy', 'Heirloom Porcelain Series Doll', L=180)
S['DQ1'] = add('Baby', 'dq_neg', 'Tiny Dreamers Splash Time Baby Doll', L=650)
S['DQ2'] = add('Small', 'dq_sup', 'Pocket Pals Camping Trip 3-Pack', L=1700, sup='Unlisted Vendor')
S['RC1'] = add('Playsets & Houses', 'healthy', 'Dreamhouse Co. Starlit Stable Playset', L=480)
# fill with healthy SKUs
target = {'Fashion': 22, 'Collector': 18, 'Small': 22, 'Baby': 19, 'Playsets & Houses': 19, 'Accessories': 20}
for sub, n in target.items():
    while sum(1 for s in skus if s['sub'] == sub) < n: add(sub, 'healthy')
# bias: one subcategory under-forecast by ~10%
for s in skus:
    if s['sub'] == 'Baby' and s['_mode'] == 'healthy' or (s['sub'] == 'Baby' and s['_mode'] in ('missed_med', 'promo', 'dq_neg')):
        s['forecast26'] = ints(np.array(s['forecast26'])*.9)

# new items (launch ahead, forecast from similar past items)
def new_item(sub, name, ratio, nid):
    pool = [s for s in skus if s['sub'] == sub and s['_mode'] == 'healthy' and not s['lumpy']]
    an = pool[:4]; mean_total = float(np.mean([sum(a['launchCurve']) for a in an]))
    tot = mean_total*ratio; curve = np.array([np.exp(-i/9) for i in range(12)]); curve = curve/curve.sum()*tot
    d = dict(id=nid, name=name, sub=sub, price=round(float(rng.uniform(*SUBS[sub]['price'])), 2), supplier=SUBS[sub]['sup'], lumpy=False, isNew=True, dataIssues=[],
             promo=dict(ly=[], ty=[]), inv=dict(onHand=0, transit=[], pos=[dict(qty=int(tot*1.0), etaH=2)], otherDC=0),
             pos=dict(y2024=[0]*52, y2025=[0]*52, y2026=[0]*45), oos25=[1.0]*52, ship=dict(y2026=[0]*45), forecast26=[0]*45,
             fcstH=ints(curve), launchCurve=[], _mode='new',
             analogs=[dict(id=a['id'], why='Same subcategory, similar price and launch season') for a in an])
    skus.append(d); return d
S['NI1'] = new_item('Fashion', 'Starlight Moonlit Gala Doll (NEW)', .55, 'FD-NEW1')
S['NI2'] = new_item('Playsets & Houses', 'Dreamhouse Co. Skyview Penthouse (NEW)', 1.0, 'PH-NEW1')
S['NI3'] = new_item('Baby', 'Tiny Dreamers Sweet Dreams Baby Doll (NEW)', 1.1, 'BB-NEW1')

# suppliers (days PO to dock)
sup = {}
for k, q in SUPPLIERS.items():
    extra = LATE.get(k, 0); hist = [q*7 + extra + float(rng.normal(0, 1.8 if extra else 1.2)) for _ in range(8)]
    sup[k] = dict(quotedWeeks=q, history=[round(x, 1) for x in hist])
sup['Bluegate Manufacturing'] = dict(quotedWeeks=9, history=[9*7+d for d in (15, 13, 17, 14, 16, 12, 15, 14)])
# unlisted vendor intentionally missing

SOURCES = [
    dict(id='planning', type='api', name='Planning system', icon='grid', fields=['Forecast by week', 'Open POs and ETAs', 'On-hand and in-transit'], cadence='Every morning', how='API pull (or scheduled export if IT prefers)'),
    dict(id='bi', type='email', name='Reporting tool export', icon='mail', fields=['POS units by week', 'Shipments by week', 'Retailer sell-through'], cadence='Daily email or export', how='Scheduled export to an inbox or shared folder'),
    dict(id='sharepoint', type='file', name='Shared file (SharePoint)', icon='folder', fields=['Supplier lead times', 'Promo calendar', 'Cost and price'], cadence='Whenever the owner updates it', how='File read from a shared location'),
    dict(id='manual', type='manual', name='Manual drop', icon='upload', fields=['Any file a planner wants checked'], cadence='On demand', how='Drag a file in; the tool sorts and tags it'),
]
LOAD_REPORT = [
    dict(file='pos_weekly.csv', src='bi', status='ok', msg='Column "sell_thru_units" is new. Mapped to POS units (high confidence, low risk).'),
    dict(file='inventory_dc.xlsx', src='planning', status='new_field', msg='New field "retailer_inv_units" found. Kept and tagged "not used yet". Nothing breaks.'),
    dict(file='open_po_eta.csv', src='planning', status='ok', msg='All 134 PO lines matched to a SKU.'),
    dict(file='promo_calendar.xlsx', src='sharepoint', status='ok', msg='2 promos updated since yesterday.'),
    dict(file='supplier_lead_times.csv', src='sharepoint', status='ok', msg='No changes.'),
    dict(file='shipments_dc3.csv', src='bi', status='quarantined', msg='Units look 10x higher than the last 8 weeks for 14 SKUs. Held back; yesterday\'s values kept. Ask the owner to confirm.'),
]
META = lambda asof: dict(today='2026-11-08', asOf=asof, weekOneStart='2025-12-29', label='Sample data, not Mattel data')
for s in skus: s.pop('_mode', None)
today = dict(meta=META('Nov 8'), suppliers=sup, skus=skus)
out = dict(today=today, yesterday=None, sources=SOURCES, loadReport=LOAD_REPORT, ids={k: v['id'] for k, v in S.items()}, seedNotes=[],
           subs=list(SUBS.keys()))
json.dump(out, open('data/data.raw.json', 'w'))
print(len(skus), 'SKUs', {k: v['id'] for k, v in S.items()})
