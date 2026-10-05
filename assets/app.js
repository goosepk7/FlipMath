// FlipMath: net profit after marketplace fees, compared across platforms.
(function () {
  "use strict";

  var CONFIG = (typeof window !== "undefined" && window.FLIPMATH_CONFIG) || {};
  var STORAGE_KEY = "flipmath.fees.v1";

  // Default US seller fees. Every number is editable in the "Fee settings" panel.
  var DEFAULT_FEES = {
    ebay: { pct: 13.6, smallOrderFee: 0.3, largeOrderFee: 0.4, orderFeeThreshold: 10 },
    poshmark: { pct: 20, flatFee: 2.95, flatUnder: 15 },
    mercari: { pct: 10 },
    depop: { pct: 3.3, fixed: 0.45 },
    etsy: { listing: 0.2, transactionPct: 6.5, processingPct: 3, processingFixed: 0.25 },
  };

  var PLATFORMS = {
    ebay: {
      name: "eBay",
      note: "Final value fee on item price plus shipping, plus a per-order fee. Promoted Listings rate is added on top.",
      fields: [
        ["pct", "Final value fee (%)"],
        ["smallOrderFee", "Per-order fee, orders up to threshold ($)"],
        ["largeOrderFee", "Per-order fee, orders over threshold ($)"],
        ["orderFeeThreshold", "Per-order fee threshold ($)"],
      ],
      fees: function (f, i) {
        var total = i.price + i.shipCharged;
        var fvf = (total * f.pct) / 100;
        var orderFee = total > f.orderFeeThreshold ? f.largeOrderFee : f.smallOrderFee;
        var ad = (total * i.adRate) / 100;
        var lines = [["Final value fee", fvf], ["Per-order fee", orderFee]];
        if (ad > 0) lines.push(["Promoted Listings", ad]);
        return lines;
      },
    },
    poshmark: {
      name: "Poshmark",
      buyerPaysLabel: true,
      note: "Flat fee under the threshold, percentage above it. The buyer pays the prepaid label, so your shipping inputs are ignored.",
      fields: [
        ["pct", "Commission at or above threshold (%)"],
        ["flatFee", "Flat fee under threshold ($)"],
        ["flatUnder", "Flat-fee threshold ($)"],
      ],
      fees: function (f, i) {
        var fee = i.price < f.flatUnder ? f.flatFee : (i.price * f.pct) / 100;
        return [["Poshmark commission", fee]];
      },
    },
    mercari: {
      name: "Mercari",
      note: "Selling fee on the item price. Payment processing is included.",
      fields: [["pct", "Selling fee (%)"]],
      fees: function (f, i) {
        return [["Selling fee", (i.price * f.pct) / 100]];
      },
    },
    depop: {
      name: "Depop",
      note: "US sellers pay no selling commission, only payment processing on the total.",
      fields: [
        ["pct", "Payment processing (%)"],
        ["fixed", "Payment processing, fixed ($)"],
      ],
      fees: function (f, i) {
        return [["Payment processing", ((i.price + i.shipCharged) * f.pct) / 100 + f.fixed]];
      },
    },
    etsy: {
      name: "Etsy",
      note: "Listing fee, transaction fee on item plus shipping, and payment processing. Offsite Ads (12 to 15%) are not included.",
      fields: [
        ["listing", "Listing fee ($)"],
        ["transactionPct", "Transaction fee (%)"],
        ["processingPct", "Payment processing (%)"],
        ["processingFixed", "Payment processing, fixed ($)"],
      ],
      fees: function (f, i) {
        var total = i.price + i.shipCharged;
        return [
          ["Listing fee", f.listing],
          ["Transaction fee", (total * f.transactionPct) / 100],
          ["Payment processing", (total * f.processingPct) / 100 + f.processingFixed],
        ];
      },
    },
  };

  var INPUTS = ["price", "shipCharged", "shipCost", "cost", "other", "adRate", "target"];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function money(n) {
    var sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(n).toFixed(2);
  }

  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function loadFees() {
    var fees = clone(DEFAULT_FEES);
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        Object.keys(fees).forEach(function (p) {
          Object.keys(fees[p]).forEach(function (k) {
            if (saved[p] && isFinite(saved[p][k])) fees[p][k] = saved[p][k];
          });
        });
      }
    } catch (e) {}
    return fees;
  }

  function saveFees(fees) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fees));
    } catch (e) {}
  }

  // Pure calculation, also exported for tests.
  function calculate(platformKey, fees, i) {
    var p = PLATFORMS[platformKey];
    var shipCharged = p.buyerPaysLabel ? 0 : i.shipCharged;
    var shipCost = p.buyerPaysLabel ? 0 : i.shipCost;
    var input = Object.assign({}, i, { shipCharged: shipCharged, shipCost: shipCost });
    var lines = p.fees(fees[platformKey], input);
    var totalFees = lines.reduce(function (s, l) { return s + l[1]; }, 0);
    var revenue = i.price + shipCharged;
    var beforeCost = revenue - totalFees - shipCost - i.other;
    var profit = beforeCost - i.cost;
    return {
      key: platformKey,
      name: p.name,
      lines: lines,
      totalFees: totalFees,
      payout: revenue - totalFees,
      shipCost: shipCost,
      profit: profit,
      margin: i.price > 0 ? (profit / i.price) * 100 : 0,
      roi: i.cost > 0 ? (profit / i.cost) * 100 : null,
      maxBuy: beforeCost - i.target,
    };
  }

  function readInputs(form) {
    var i = {};
    INPUTS.forEach(function (k) {
      var el = form.elements[k];
      i[k] = el ? Math.max(0, num(el.value)) : 0;
    });
    return i;
  }

  function render(state) {
    var i = readInputs(state.form);
    var results = Object.keys(PLATFORMS).map(function (k) { return calculate(k, state.fees, i); });
    results.sort(function (a, b) { return b.profit - a.profit; });
    var best = results[0];
    var worst = results[results.length - 1];
    var hasPrice = i.price > 0;

    // On a platform page the hero shows that platform; on the home page, the winner.
    var hero = (state.focus && results.filter(function (r) { return r.key === state.focus; })[0]) || best;
    var heroBox = $("#hero-result");
    if (heroBox) {
      var label = state.focus
        ? "You keep on " + hero.name
        : hasPrice ? "Sell it on " + hero.name + " and keep" : "Enter a sale price";
      var sub = !hasPrice ? "" : state.focus && hero !== best
        ? best.name + " would net you " + money(best.profit - hero.profit) + " more."
        : "That's " + money(best.profit - worst.profit) + " more than " + worst.name + ".";
      heroBox.className = "hero-result p-" + hero.key;
      heroBox.innerHTML =
        '<div class="hero-label">' + label + "</div>" +
        '<div class="hero-number ' + (hero.profit < 0 ? "neg" : "") + '">' + (hasPrice ? money(hero.profit) : "$0.00") + "</div>" +
        '<div class="hero-sub">' + sub + "</div>" +
        '<div class="hero-stats">' +
        "<div><span>Fees</span><strong>" + money(hero.totalFees) + "</strong></div>" +
        "<div><span>Payout</span><strong>" + money(hero.payout) + "</strong></div>" +
        "<div><span>Max buy</span><strong>" + money(Math.max(0, hero.maxBuy)) + "</strong></div>" +
        "</div>";
    }

    var top = Math.max(best.profit, 0.01);
    $("#results-list").innerHTML = results.map(function (r, idx) {
      var width = Math.max(0, Math.min(100, (r.profit / top) * 100));
      var breakdown = r.lines.map(function (l) { return "<li><span>" + l[0] + "</span><span>" + money(l[1]) + "</span></li>"; }).join("");
      if (r.shipCost > 0) breakdown += "<li><span>Your shipping label</span><span>" + money(r.shipCost) + "</span></li>";
      if (PLATFORMS[r.key].buyerPaysLabel) breakdown += "<li><span>Shipping</span><span>buyer pays</span></li>";
      return (
        '<li class="row p-' + r.key + (idx === 0 && hasPrice ? " is-best" : "") + (r.key === state.focus ? " is-focus" : "") + '">' +
        '<details><summary>' +
        '<span class="rank">' + (idx + 1) + "</span>" +
        '<span class="pname">' + r.name + (idx === 0 && hasPrice ? ' <em class="tag">Best</em>' : "") + "</span>" +
        '<span class="profit ' + (r.profit < 0 ? "neg" : "") + '">' + money(r.profit) + "</span>" +
        '<span class="bar"><span style="width:' + width.toFixed(1) + '%"></span></span>' +
        '<span class="meta">Fees ' + money(r.totalFees) + " &middot; " + r.margin.toFixed(0) + "% margin &middot; max buy " + money(Math.max(0, r.maxBuy)) + "</span>" +
        "</summary><ul class=\"breakdown\">" + breakdown + "</ul></details></li>"
      );
    }).join("");

    syncUrl(state.form);
  }

  function syncUrl(form) {
    if (!window.history || !history.replaceState) return;
    var params = new URLSearchParams();
    INPUTS.forEach(function (k) {
      var el = form.elements[k];
      if (el && el.value !== "" && el.value !== el.defaultValue) params.set(k, el.value);
    });
    var q = params.toString();
    history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
  }

  function applyUrl(form) {
    var params = new URLSearchParams(location.search);
    INPUTS.forEach(function (k) {
      if (params.has(k) && form.elements[k]) form.elements[k].value = params.get(k);
    });
  }

  function buildFeeSettings(state) {
    var box = $("#fee-settings-body");
    if (!box) return;
    var html = Object.keys(PLATFORMS).map(function (key) {
      var p = PLATFORMS[key];
      var fields = p.fields.map(function (f) {
        return (
          '<label>' + f[1] +
          '<input type="number" step="0.01" min="0" inputmode="decimal" data-platform="' + key +
          '" data-field="' + f[0] + '" value="' + state.fees[key][f[0]] + '"></label>'
        );
      }).join("");
      return '<fieldset><legend>' + p.name + '</legend><p class="muted">' + p.note + "</p>" + fields + "</fieldset>";
    }).join("");
    box.innerHTML = html;

    box.addEventListener("input", function (e) {
      var t = e.target;
      if (!t.dataset.platform) return;
      state.fees[t.dataset.platform][t.dataset.field] = Math.max(0, num(t.value));
      saveFees(state.fees);
      render(state);
    });

    var reset = $("#reset-fees");
    if (reset) {
      reset.addEventListener("click", function () {
        state.fees = clone(DEFAULT_FEES);
        saveFees(state.fees);
        buildFeeSettings(state);
        render(state);
      });
    }

    var checked = $("#fees-checked");
    if (checked && CONFIG.feesCheckedOn) checked.textContent = CONFIG.feesCheckedOn;
  }

  // Remember which ad or post brought the visitor (?utm_source=...), so waitlist
  // signups show where they came from. Read before the calculator rewrites the URL.
  function captureSource() {
    var params = new URLSearchParams(location.search);
    var source = [params.get("utm_source"), params.get("utm_campaign"), params.get("utm_content")]
      .filter(Boolean).join(" / ");
    try {
      if (source) sessionStorage.setItem("flipmath.source", source);
      else source = sessionStorage.getItem("flipmath.source") || "";
    } catch (e) {}
    return source || document.referrer || "direct";
  }

  function setupWaitlist(source) {
    var form = $("#waitlist-form");
    if (!form) return;
    if (form.elements.source) form.elements.source.value = source;
    var status = $("#waitlist-status");
    if (!CONFIG.waitlistEndpoint) {
      status.textContent = "The waitlist opens in a few days. Check back soon.";
      form.querySelector("button").disabled = true;
      return;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button");
      btn.disabled = true;
      status.textContent = "Saving...";
      fetch(CONFIG.waitlistEndpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad status");
          form.reset();
          status.textContent = "You're on the list. We'll email you when Pro is ready.";
        })
        .catch(function () {
          btn.disabled = false;
          status.textContent = "That didn't go through. Please try again.";
        });
    });
  }

  function init() {
    var form = $("#calc");
    if (!form) return;
    var state = { form: form, fees: loadFees(), focus: document.body.dataset.platform || null };
    applyUrl(form);
    buildFeeSettings(state);
    form.addEventListener("input", function () { render(state); });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    render(state);

    Array.prototype.forEach.call(document.querySelectorAll("[data-example]"), function (btn) {
      btn.addEventListener("click", function () {
        var vals = JSON.parse(btn.dataset.example);
        Object.keys(vals).forEach(function (k) { if (form.elements[k]) form.elements[k].value = vals[k]; });
        render(state);
      });
    });

    var share = $("#share");
    if (share) {
      share.addEventListener("click", function () {
        var done = function () { share.textContent = "Link copied"; };
        if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () {});
      });
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculate: calculate, DEFAULT_FEES: DEFAULT_FEES, PLATFORMS: PLATFORMS };
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      var source = captureSource();
      init();
      setupWaitlist(source);
    });
  }
})();
