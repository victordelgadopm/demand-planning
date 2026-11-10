# Demand Planning Assistant: Prototype Spec

Sample data, not Mattel data. Every brand, supplier and number in the prototype is invented.

## Purpose

A working prototype to show a hiring manager how AI can help a demand planner without replacing the planner. It combines data from any source that can be shared, flags risk by tier, explains why, offers options that come from the data, keeps notes, and summarizes the top findings each day.

## What Is In The Package

- **index.html:** the whole site in one file. No internet connection or CDN needed. Opens by double-click and can be hosted anywhere that serves static files.
- **planning-combined-data-sample.xlsx:** the combined data as a workbook, with live formulas for the core checks.
- **SPEC.md:** this document.

## What The Site Shows

1. **Data health strip:** sources combined, last refresh, files held back, new fields kept, renamed columns matched.
2. **Since yesterday:** newly at risk, fixed, got worse, re-alerts.
3. **Four decisions:** order more or expedite, too much, forecast looks off, check the data. Click one to filter.
4. **Five statuses:** At risk, Medium, Watch, Too much, No risk. Every SKU has one. Ranked by dollars at risk, one line why.
5. **SKU drill-down:** the rule that fired, the evidence with a source tag on each number, a chart of this year, forecast, last year and two years ago, promo weeks shaded, and a stock projection with an order-by date.
6. **What-if:** supplier ETA slip, demand change, added order. The chart and verdict update.
7. **Options from the data:** only options the data supports. Cost, margin and customer terms are marked for a human.
8. **Notes:** reason, accepted gap, history. Never expire. Only removal by the user, with a tag. The flag returns only if the gap grows past 1.5 times what was accepted (adjustable, can be turned off per note).
9. **New items:** forecast compared with similar past launches, with the analogs listed.
10. **Forecast accuracy by subcategory:** group-level bias check.
11. **Data flow view:** animated routes (API, scheduled export, shared file, manual drop) with click-in panels.
12. **Replay load:** shows a renamed column matched, a new field kept, and a bad file held back.
13. **Daily email preview** and **combined data download**.
14. **Settings per user:** thresholds, which flags run, columns, status names, Planner and Manager profiles. Saved in the browser.
15. **Guided tour:** 11 steps with highlighted callouts that follow a talk track.

## Flag Rules

| Flag | Fires when | Tier |
|---|---|---|
| Missed order | No PO or transit and projected stock goes below zero | At risk if inside lead time plus typical supplier lateness, otherwise Medium |
| Lead time risk | A PO exists but stock runs out first | At risk if short even on the quoted date, Medium if only short at the supplier's typical lateness |
| Short vs last year | Supply is more than 10% below the adjusted need from the same weeks last year | Medium |
| Promo repeat | Promo repeats, supply covers the base forecast but not base plus last year's measured lift | Medium (Watch if the promo is not confirmed) |
| Sales above forecast | Sales above forecast by 20% or more for 3 weeks in a row | Medium if supply will not cover it, Watch if it will |
| Too much stock | More than 16 weeks of supply and sell-through slowing | Too much |
| Shipping ahead of sales | Shipments 30% above sell-through over 8 weeks | Watch |
| New item forecast | Forecast far from similar past launches | Medium or Watch |
| Check the data | Negative stock, missing lead time or other source issue | Watch |

**Adjusted need from last year:** un-constrains last year's stock-out weeks, removes last year's promo lift if it is not repeating, scales by this year's pace against last year's, and adds this year's promo lift.

**Promo lift:** measured against neighboring weeks, then divided by the same ratio two years earlier so a seasonal peak is not mistaken for lift.

**Lumpy demand:** flags carry Low confidence, and overstock and shipping checks are skipped.

## How The Data Gets In

Three routes, plus manual drop. Which are allowed depends on company IT.

1. **API pull:** a scheduled job reads from the system. Needs read access from IT.
2. **Scheduled export:** the system sends or saves a data file to an inbox or shared folder. Research found no confirmed way to have common BI tools email a data file (their emails are usually an image and a link), so the safe plan is a scheduled export to a shared folder if IT approves.
3. **Shared file:** a person maintains a file (lead times, promos) and the tool reads it.
4. **Manual drop:** any file, read and tagged by the tool, confirmed once.

**Real-version assumption:** a file on SharePoint refreshed daily, with this site as the visual layer. The site only updates if a flow refreshes it after the file.

**Self-healing:** each source has a mapping to a canonical schema. Safe matches happen on their own. Quantity and date fields wait for one confirmation. New fields are kept and tagged "not used yet". Missing fields pause only the flags that need them. Odd values (unit changes, 10 times jumps) are held back and yesterday's values kept.

## Data Used

POS this year, last year and two years ago; forecast; on-hand; in-transit; open POs with ETAs; shipments; supplier quoted and actual lead times; promo calendar; similar past items for new launches. Safety stock is shown as two weeks of forecast.

## Test Results

| Layer | Result |
|---|---|
| Engine regression suite | 49 of 49 pass. Covers every planted scenario at the right tier, 11 hard negatives staying clean, zero false alarms on the other 94 SKUs, notes boundary and no-expiry, what-if, change log, determinism |
| Browser tests | 23 of 23 pass. Filters, drill-down, add and remove note, persistence after reload, what-if, settings and profiles, reset, data flow, email, CSV (124 lines), replay load, 11-step tour, no console errors |
| Visual review | Looked at screenshots at 1280, 1440 and 1920 wide, dark mode and phone width |
| Workbook | 963 formulas, 0 errors after recalculation. Live supply, shipping and sold totals match the engine for all 120 established SKUs |
| Earlier design experiments | Tracking-signal bias rule flagged 88% of unbiased series, so it was replaced by an 8-week test at subcategory level. Naive history comparison flagged 145 of 150 SKUs, so it was replaced by the adjusted-need method |

**Important limit:** the planted scenarios were written alongside the engine, so passing them proves the logic does what it was designed to do, not that it is right on real data.

## Not Yet Tested

- **Real data:** nothing here has seen a real planning file.
- **AI explanation layer:** in the prototype the explanation text comes from templates. In the real build an AI writes it from the same numbers, a checker confirms every number appears in the source, and the AI is read-only. Not tested, including resistance to instructions hidden in data.
- **Usability:** needs a 5-person test.
- **Mapping memory:** remembering a confirmed column match is designed but untested.
- **SharePoint and flow behavior:** not tested.
- **Back-test:** needs real history. Plan: replay 12 months and check how many real stock-outs were flagged in time.
- **Shadow mode:** run 2 to 4 weeks next to the normal process before anyone relies on it.
- **Planner review:** have planners judge 50 flagged and 50 unflagged SKUs.

## Honest Positioning For The Interview

- Say what you know: what the planning and reporting systems output, and that you automated the repetitive pull and triage.
- Do not claim hands-on use of tools you have not used.
- Describe the approach, not a brand. The workflow runs with any of the major AI assistants.
- Never put real company data into an outside tool. Confirm the company's data rules first.

## Push-Live Checklist

1. Host `index.html` on any static host, or open it locally for the interview.
2. Open it once on the interview machine and screen share to check size and readability.
3. Press Reset demo before starting. Press Guided tour to follow the callouts.
4. Keep the workbook open as the "more combined data" backup.

## Rebuild From Source

`gen_data.py` creates the fake data. `finalize_data.js` builds yesterday's snapshot and seeded notes. `build.py` inlines everything into `dist/index.html`. `make_xlsx.py` builds the workbook. `node tests/engine.test.js` and `python3 tests/ui.py` and `tests/ui2.py` run the checks. The flag engine lives in `src/engine.js` and is shared by the site and the tests.
