// Run with: node tests/calc.test.js
const assert = require("assert");
const { calculate, DEFAULT_FEES } = require("../assets/app.js");

const base = { price: 40, shipCharged: 0, shipCost: 8, cost: 6, other: 0.5, adRate: 0, target: 15 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} != ${b}`);

// eBay: 13.6% of 40 = 5.44, + $0.40 order fee
let r = calculate("ebay", DEFAULT_FEES, base);
near(r.totalFees, 5.84);
near(r.profit, 40 - 5.84 - 8 - 0.5 - 6);
near(r.maxBuy, 40 - 5.84 - 8 - 0.5 - 15);

// eBay small order fee and promoted listings on total incl. shipping
r = calculate("ebay", DEFAULT_FEES, { ...base, price: 8, shipCharged: 2, adRate: 5 });
near(r.totalFees, 10 * 0.136 + 0.3 + 0.5);

// Poshmark: buyer pays label, so shipping is ignored; 20% at $15+
r = calculate("poshmark", DEFAULT_FEES, base);
near(r.totalFees, 8);
near(r.profit, 40 - 8 - 0.5 - 6);
// flat fee under $15
r = calculate("poshmark", DEFAULT_FEES, { ...base, price: 10 });
near(r.totalFees, 2.95);

// Mercari: 10% of item price
near(calculate("mercari", DEFAULT_FEES, base).totalFees, 4);

// Depop: 3.3% + 0.45 on total
near(calculate("depop", DEFAULT_FEES, { ...base, shipCharged: 10 }).totalFees, 50 * 0.033 + 0.45);

// Etsy: 0.20 + 6.5% + 3% + 0.25
near(calculate("etsy", DEFAULT_FEES, base).totalFees, 0.2 + 2.6 + 1.2 + 0.25);

console.log("All calculator tests passed");
