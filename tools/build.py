"""Generates the site's HTML pages from one template.

Run `python3 tools/build.py` after editing this file. Output goes to site/.
"""

import html
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "site"

PLATFORM_NAV = [("ebay", "eBay"), ("poshmark", "Poshmark"), ("mercari", "Mercari"), ("depop", "Depop"), ("etsy", "Etsy")]

PAGES = {
    "": {
        "title": "FlipMath: Reseller Profit Calculator for eBay, Poshmark, Mercari, Depop and Etsy",
        "description": "Free reseller profit calculator. See your real profit after fees and shipping on eBay, Poshmark, Mercari, Depop and Etsy, and the most you should pay for an item.",
        "h1": "What will you actually make on this flip?",
        "lede": "Enter one price and see your real profit after fees and shipping on eBay, Poshmark, Mercari, Depop and Etsy, plus the most you should pay for it.",
        "faq": [
            ("Which platform has the lowest fees?", "It depends on the price. Under $15, Poshmark's flat $2.95 fee eats a big share of the sale, while Depop and Mercari keep more for you. On higher-priced items Poshmark's 20% is the biggest cut, and eBay's fee includes the shipping you charge. Put your numbers in above to see which wins for your item."),
            ("What is the max buy price?", "It is the most you can pay for an item and still hit your target profit after fees, shipping and supplies. Use it at the thrift store or garage sale before you buy."),
            ("Are the fees up to date?", "The default fees were last checked in the month shown under Fee settings. Marketplaces change fees, so you can edit any number and the calculator remembers it on your device."),
            ("Do you store what I type?", "No. The calculator runs in your browser. Nothing you enter is sent anywhere."),
        ],
    },
    "ebay": {
        "platform": "ebay",
        "title": "eBay Fee Calculator 2026: Profit After Final Value Fees and Shipping",
        "description": "Free eBay fee calculator for 2026. See your eBay final value fee, per-order fee, Promoted Listings cost and real profit, and compare it with Poshmark, Mercari, Depop and Etsy.",
        "h1": "eBay fee and profit calculator",
        "lede": "See exactly what eBay takes, what lands in your account, and what you really profit after shipping and what you paid.",
        "faq": [
            ("How much does eBay take from a sale?", "For most categories eBay charges a final value fee of about 13.6% of the total the buyer pays, including shipping, plus a $0.30 per-order fee on orders of $10 or less and $0.40 above that. Some categories use different rates, so you can edit the percentage under Fee settings."),
            ("Does eBay charge fees on shipping?", "Yes. The final value fee applies to the item price plus the shipping you charge the buyer. That is why free shipping with a higher item price often costs about the same in fees."),
            ("How do Promoted Listings affect profit?", "Enter your ad rate in the Promoted Listings box. It is charged on the total sale when a promoted click leads to the purchase, so the calculator shows the worst case."),
        ],
    },
    "poshmark": {
        "platform": "poshmark",
        "title": "Poshmark Fee Calculator 2026: What You Earn After the 20% Fee",
        "description": "Free Poshmark fee calculator. See your earnings after Poshmark's $2.95 flat fee or 20% commission, and compare against eBay, Mercari, Depop and Etsy.",
        "h1": "Poshmark fee and profit calculator",
        "lede": "See what you earn after Poshmark's cut, and whether another platform would net you more for the same item.",
        "faq": [
            ("How much does Poshmark take?", "Poshmark takes a flat $2.95 on sales under $15 and 20% on sales of $15 or more. The buyer pays for the prepaid shipping label, so shipping does not come out of your earnings."),
            ("Is Poshmark worth it for cheap items?", "On a $10 sale the $2.95 fee is almost 30% of the price. Bundles, or listing low-priced items on Mercari or Depop, usually keep more money in your pocket."),
            ("When does Poshmark beat eBay?", "Because the buyer pays shipping on Poshmark, it can come out ahead on heavier clothing items where your eBay label would be expensive. Enter your real label cost above to compare."),
        ],
    },
    "mercari": {
        "platform": "mercari",
        "title": "Mercari Fee Calculator 2026: Profit After Selling Fees and Shipping",
        "description": "Free Mercari fee calculator. See your Mercari selling fee, payout and real profit after shipping, compared with eBay, Poshmark, Depop and Etsy.",
        "h1": "Mercari fee and profit calculator",
        "lede": "See what Mercari keeps, what you take home, and how it compares with the other big resale sites.",
        "faq": [
            ("How much does Mercari charge sellers?", "Mercari charges a 10% selling fee on the item price, with payment processing included. Mercari has changed its fees several times, so check the current rate and edit it under Fee settings if it differs."),
            ("Who pays shipping on Mercari?", "You choose. If you offer free shipping, enter your label cost under Your shipping cost. If the buyer pays, enter what they pay under Shipping charged to buyer too."),
        ],
    },
    "depop": {
        "platform": "depop",
        "title": "Depop Fee Calculator 2026: Profit After Payment Processing",
        "description": "Free Depop fee calculator for US sellers. See your payment processing fee and real profit after shipping, compared with eBay, Poshmark, Mercari and Etsy.",
        "h1": "Depop fee and profit calculator",
        "lede": "US sellers pay no Depop selling fee, only payment processing. See what you keep after that and shipping.",
        "faq": [
            ("Does Depop still charge a 10% fee?", "Not for US and UK sellers. Depop removed its selling fee and now charges only payment processing, about 3.3% plus $0.45 per sale in the US. Boosted listings cost extra and are not included here."),
            ("Is payment processing charged on shipping?", "Yes, processing applies to the full amount the buyer pays, including shipping."),
        ],
    },
    "etsy": {
        "platform": "etsy",
        "title": "Etsy Fee Calculator 2026: Listing, Transaction and Processing Fees",
        "description": "Free Etsy fee calculator. See Etsy's listing fee, 6.5% transaction fee, payment processing and your real profit, compared with eBay, Poshmark, Mercari and Depop.",
        "h1": "Etsy fee and profit calculator",
        "lede": "Etsy stacks three fees on every sale. See all of them, and what you really keep, in one place.",
        "faq": [
            ("What fees does Etsy charge?", "A $0.20 listing fee, a 6.5% transaction fee on the item price plus shipping, and US payment processing of 3% plus $0.25. Offsite Ads of 12 to 15% apply only when a sale comes through Etsy's ads and are not included here."),
            ("Can I sell vintage on Etsy?", "Yes, items must be at least 20 years old to count as vintage on Etsy. Newer secondhand items belong on eBay, Poshmark, Mercari or Depop."),
        ],
    },
}

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%24</text></svg>">
<link rel="stylesheet" href="{base}assets/style.css">
<script src="{base}assets/config.js"></script>
<script src="{base}assets/app.js"></script>
</head>
<body data-platform="{platform}">
<header class="site"><div class="wrap">
  <a class="logo" href="{home}">Flip<span>Math</span></a>
  <nav class="platforms" aria-label="Fee calculators">{nav}</nav>
</div></header>

<main class="wrap">
  <h1>{h1}</h1>
  <p class="lede">{lede}</p>

  <form id="calc" class="card" autocomplete="off">
    <div class="grid">
      <label>Sale price ($)<input name="price" type="number" step="0.01" min="0" inputmode="decimal" value="40"></label>
      <label>Shipping charged to buyer ($)<input name="shipCharged" type="number" step="0.01" min="0" inputmode="decimal" value="0"></label>
      <label>Your shipping cost ($)<small>label you pay for</small><input name="shipCost" type="number" step="0.01" min="0" inputmode="decimal" value="8"></label>
      <label>What you paid ($)<input name="cost" type="number" step="0.01" min="0" inputmode="decimal" value="6"></label>
      <label>Supplies and other ($)<small>poly mailer, tape</small><input name="other" type="number" step="0.01" min="0" inputmode="decimal" value="0.5"></label>
      <label>eBay Promoted rate (%)<input name="adRate" type="number" step="0.1" min="0" inputmode="decimal" value="0"></label>
      <label>Target profit ($)<small>for max buy price</small><input name="target" type="number" step="0.01" min="0" inputmode="decimal" value="15"></label>
    </div>
  </form>

  {focus}

  <section class="card" aria-live="polite">
    <p id="summary"></p>
    <div class="table-scroll">
      <table>
        <thead><tr><th>Platform</th><th>Fees</th><th>Profit</th><th class="col-margin">Margin</th><th>Max buy</th></tr></thead>
        <tbody id="results-body"></tbody>
      </table>
    </div>
    <p class="muted">Profit is what you keep after fees, your shipping label, supplies and what you paid. Max buy is the most you can pay and still make your target profit. Sales tax is not included.</p>
    <button type="button" class="secondary" id="share">Copy link to these numbers</button>
  </section>

  <details class="card">
    <summary>Fee settings</summary>
    <p class="muted">Default US fees last checked <span id="fees-checked"></span>. Change any number to match your account; it's saved on this device only.</p>
    <div id="fee-settings-body"></div>
    <button type="button" class="secondary" id="reset-fees">Reset to defaults</button>
  </details>

  <section class="card pro" id="pro">
    <h2>Coming soon: FlipMath Pro</h2>
    <p>Stop guessing at tax time. Pro keeps a running record of every flip, from what you paid to what it sold for, so you know your real profit and can prove it.</p>
    <ul>
      <li>Log a buy in seconds from your phone, with a receipt photo</li>
      <li>Import your eBay, Poshmark, Mercari, Depop and Etsy sales reports</li>
      <li>See profit by month, by platform and by sourcing spot</li>
      <li>One-click year-end report with cost of goods, fees, shipping and mileage, ready for your tax preparer or 1099-K</li>
    </ul>
    <p>Planned price: <strong>$6 a month</strong>. People on the waitlist get the first 3 months free.</p>
    <form id="waitlist-form">
      <label>Email<input type="email" name="email" required placeholder="you@example.com"></label>
      <p><strong>Would you pay $6 a month for this?</strong></p>
      <div class="radio-row">
        <label><input type="radio" name="would_pay" value="yes"> Yes</label>
        <label><input type="radio" name="would_pay" value="maybe"> Maybe</label>
        <label><input type="radio" name="would_pay" value="no"> No, free only</label>
      </div>
      <label style="margin-top:12px">What's the most annoying part of tracking your flips? <small>optional</small><textarea name="pain" rows="2"></textarea></label>
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <input type="hidden" name="page" value="{slug}">
      <p><button type="submit">Join the waitlist</button></p>
      <p id="waitlist-status" role="status"></p>
    </form>
  </section>

  <section class="faq">
    <h2>Questions</h2>
    {faq}
  </section>
</main>

<footer><div class="wrap">
  FlipMath is a free tool for resellers and isn't affiliated with eBay, Poshmark, Mercari, Depop or Etsy. Fees change; always check your marketplace's current fee page. The calculator runs in your browser and doesn't send what you type anywhere.
</div></footer>
</body>
</html>
"""


def esc(s):
    return html.escape(s, quote=True)


def build():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT / "assets", OUT / "assets")
    for slug, page in PAGES.items():
        base = "../" if slug else ""
        nav = " ".join(
            '<a href="{}{}/"{}>{}</a>'.format(base, key, ' aria-current="page"' if key == slug else "", name)
            for key, name in PLATFORM_NAV
        )
        focus = '<section class="card" id="focus-result" aria-live="polite"></section>' if page.get("platform") else ""
        faq = "\n    ".join("<h3>{}</h3><p>{}</p>".format(esc(q), esc(a)) for q, a in page["faq"])
        out = TEMPLATE.format(
            title=esc(page["title"]),
            description=esc(page["description"]),
            h1=esc(page["h1"]),
            lede=esc(page["lede"]),
            platform=page.get("platform", ""),
            base=base,
            home=base or "./",
            nav=nav,
            focus=focus,
            faq=faq,
            slug=slug or "home",
        )
        target = OUT / slug / "index.html" if slug else OUT / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(out)
    (OUT / "robots.txt").write_text("User-agent: *\nAllow: /\n")
    print("Built", len(PAGES), "pages into", OUT)


if __name__ == "__main__":
    build()
