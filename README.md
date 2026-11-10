# Demand Planning Assistant

An AI-assisted daily SKU risk tool for demand planning. It combines data from any shareable source, flags risk by tier, explains why, offers options that come from the data, and keeps planner notes that never expire.

**Sample data, not real company data.** Every brand, supplier and number is invented.

## Open It

`index.html` is the whole site in one file. Open it in a browser, or serve it with GitHub Pages (Settings, Pages, Deploy from branch, `main`, `/ (root)`).

## Files

- `index.html`: the site (built from `src/`)
- `planning-combined-data-sample.xlsx`: the combined data as a workbook with live formulas
- `SPEC.md`: flag rules, data intake routes, test results, and what is untested
- `src/engine.js`: the flag engine, shared by the site and the tests

## Rebuild

```
python3 gen_data.py && node finalize_data.js && node tests/export_results.js
python3 build.py && python3 make_xlsx.py
node tests/engine.test.js
python3 tests/ui.py && python3 tests/ui2.py
```
