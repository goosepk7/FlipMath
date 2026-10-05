# FlipMath

A free profit calculator for resellers. Enter one sale price and see your real profit after fees and shipping on eBay, Poshmark, Mercari, Depop and Etsy, plus the most you should pay for the item. The page also collects a waitlist for **FlipMath Pro**, a planned $6/month profit and tax tracker.

Live site: https://flipmath.me/

## What's here

| Path | What it is |
|---|---|
| `assets/app.js` | The calculator and the fee formulas for each marketplace |
| `assets/config.js` | The only file to edit to go live: the waitlist form URL and the "fees last checked" date |
| `assets/style.css` | Styles (light and dark mode) |
| `tools/build.py` | Generates the home page and one fee-calculator page per marketplace into `site/` |
| `tests/calc.test.js` | Checks the fee math |
| `.github/workflows/pages.yml` | Runs the tests and publishes the site on every push to the default branch |

## Run it locally

```sh
node tests/calc.test.js
python3 tools/build.py
python3 -m http.server -d site 8000   # then open http://localhost:8000
```

## Updating fees

Default fees live in `DEFAULT_FEES` at the top of `assets/app.js`. When a marketplace changes its fees, update the numbers there, the matching FAQ text in `tools/build.py`, and `feesCheckedOn` in `assets/config.js`.
