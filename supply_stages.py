"""Adds supply chain stages to data/data.json (sample data, not Mattel data). Idempotent. Run after finalize_data.js."""
import json, random
d = json.load(open('data/data.json'))
rng = random.Random(77)
# quoted days by stage: production, held at origin warehouse, in transit, receiving. Sum = quotedWeeks * 7
Q = {'Starfish Toy Works': (16, 4, 30, 6), 'Lotus Doll Factory': (28, 5, 30, 7), 'Harbor Plastics': (12, 3, 28, 6),
     'Sunrise Textiles': (10, 3, 23, 6), 'Redwood Playsets': (38, 6, 32, 8), 'Bluegate Manufacturing': (22, 5, 29, 7)}
SHARE = (.5, .15, .3, .05)  # how a late total is spread across the stages
AIR = (6, 3)  # transit days, receiving days when expedited by air

HERO_SLIP = {'FD-1126': 14, 'CD-1068': 10, 'SM-1068': 7}
HERO_STUCK = {'FD-1088': 16, 'CD-1056': 19}
HERO_ONHAND = {'FD-1126': 3283, 'CD-1068': 3382, 'SM-1068': 8791, 'FD-1088': 18716, 'CD-1056': 1037}

PLANTED = set(json.load(open('data/data.json'))['ids'].values())

def enrich_suppliers(sups):
    for n, s in sups.items():
        q = Q[n]; assert sum(q) == s['quotedWeeks'] * 7, n
        s['stages'] = dict(zip(('prod', 'hold', 'transit', 'recv'), q))
        hist = []
        for tot in s['history']:
            delta = tot - sum(q); parts = [q[i] + delta * SHARE[i] + rng.uniform(-.6, .6) for i in (1, 2, 3)]
            parts = [round(max(1, x), 1) for x in parts]
            prod = round(tot - sum(parts), 1)
            hist.append({'prod': prod, 'hold': parts[0], 'transit': parts[1], 'recv': parts[2], 'total': tot})
        s['stageHistory'] = hist

def enrich_skus(snap, seed):
    r = random.Random(seed)
    for s in snap['skus']:
        sup = snap['suppliers'].get(s['supplier']) or snap['suppliers']['Starfish Toy Works']; st = sup['stages']
        for i, t in enumerate(s['inv']['transit']):
            A = 1 + 7 * t['etaH']
            slip = r.choice([0]*17 + [3, 7, 10, 14]) + (r.choice([0, 7, 14]) if s['supplier'] == 'Bluegate Manufacturing' else 0)
            ago = max(3, st['transit'] - A + slip)
            slip = max(0, A + ago - st['transit'])  # slip implied by the real ship date
            t.update(ref='SH-%05d' % r.randint(10000, 99999), mode='Ocean', shippedAgo=ago, slipDays=slip)
        for i, p in enumerate(s['inv']['pos']):
            A = 1 + 7 * p['etaH']
            T, R = (st['transit'], st['recv']) if A >= st['transit'] + st['recv'] + st['hold'] + 4 else AIR
            mode = 'Ocean' if T == st['transit'] else 'Air'
            ship = max(1, A - T - R); ready = ship - st['hold']
            slip = r.choice([0]*17 + [3, 7, 10, 14, 21]) + (r.choice([0, 7, 14]) if s['supplier'] == 'Bluegate Manufacturing' else 0)
            p.update(ref='PO-%05d' % r.randint(10000, 99999), mode=mode, transitDays=T, recvDays=R, slipDays=slip, shipIn=ship)
            fin = r.random()
            if fin < .16 or (fin < .20 and ready > 0):
                ago = r.choice([1, 2, 3, 4, 5, 6]) if fin < .16 else r.randint(13, 20)
                p.update(stage='At Origin', finishedAgo=ago, shipIn=max(1, ship)); continue
            if ready > 0:
                p.update(stage='In Production', readyIn=ready, readyOrigIn=max(1, ready - slip))
            else:
                p.update(stage='At Origin', finishedAgo=-ready)
    for s in snap['skus']:  # a few clear examples for the demo
        if s['id'] in PLANTED:  # planted test items keep their first-picture status: no random slips
            for t in s['inv']['transit']: t['slipDays'] = 0
            for p in s['inv']['pos']: p['slipDays'] = 0; (p.update(finishedAgo=min(p.get('finishedAgo', 0), 3)) if p.get('stage') == 'At Origin' else None)
        if s['id'] in HERO_ONHAND: s['inv']['onHand'] = HERO_ONHAND[s['id']]
        tr, pos = s['inv']['transit'], s['inv']['pos']; st = (snap['suppliers'].get(s['supplier']) or snap['suppliers']['Starfish Toy Works'])['stages']
        if s['id'] in HERO_SLIP and tr:
            t = tr[0]; t['slipDays'] = HERO_SLIP[s['id']]; t['shippedAgo'] = max(3, st['transit'] - (1 + 7 * t['etaH']) + t['slipDays'])
        if s['id'] in HERO_STUCK and pos:
            for t in tr: t['slipDays'] = 0
            for p in pos: p['slipDays'] = 0
            p = pos[0]; p.pop('readyIn', None); p.pop('readyOrigIn', None); p.update(stage='At Origin', finishedAgo=HERO_STUCK[s['id']], shipIn=max(1, p.get('shipIn', 3)))
    return snap

enrich_suppliers(d['today']['suppliers'])
enrich_suppliers(d['yesterday']['suppliers'])
enrich_skus(d['today'], 5); enrich_skus(d['yesterday'], 5)
json.dump(d, open('data/data.json', 'w'), separators=(',', ':'))
from collections import Counter
c = Counter(); sl = Counter()
for s in d['today']['skus']:
    for p in s['inv']['pos']: c[p['stage']] += 1; sl[p['slipDays']] += 1
    for t in s['inv']['transit']: sl[t['slipDays']] += 1
print(c, sorted(sl.items()))
