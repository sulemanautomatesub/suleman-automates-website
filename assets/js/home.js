/* ==========================================================================
   Suleman Automates — home page behaviour
   1. Call preview transcript sequence
   2. ROI calculator — paired sliders + number inputs, tweened (count-up)
      results, transparent scenario maths.
        additional   = enquiries × handled%
        deals        = additional × conversion%        (expected value)
        commission   = deals × avgCommission
        monthly net  = commission − package price
        first month  = monthly net − AED 1,000 setup
        Extra-call charges (AED 15/call), custom work and taxes are NOT modelled.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ========================================================================
     1. Call preview — reveal transcript lines in sequence, then update the
        requirements card from information actually present in the transcript.
     ======================================================================== */
  function initPreview() {
    var transcript = document.getElementById('transcript');
    if (!transcript) return;

    var bubbles = Array.prototype.slice.call(transcript.querySelectorAll('.bubble'));
    var reqRows = {};
    document.querySelectorAll('.req-row[data-req-key]').forEach(function (row) {
      reqRows[row.getAttribute('data-req-key')] = row;
    });

    function showAll() {
      bubbles.forEach(function (b) { b.classList.add('is-shown'); });
      Object.keys(reqRows).forEach(function (k) { reqRows[k].classList.add('is-set'); });
    }

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var played = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !played) {
          played = true;
          io.disconnect();
          bubbles.forEach(function (bubble, i) {
            window.setTimeout(function () {
              bubble.classList.add('is-shown');
              var keys = (bubble.getAttribute('data-req') || '').split(/\s+/).filter(Boolean);
              keys.forEach(function (key, j) {
                var row = reqRows[key];
                if (row) {
                  window.setTimeout(function () { row.classList.add('is-set'); }, 450 + j * 160);
                }
              });
            }, i * 1050);
          });
        }
      });
    }, { threshold: 0.35 });
    io.observe(transcript);
  }

  /* ========================================================================
     2. ROI calculator
     ======================================================================== */
  function initCalculator() {
    var form = document.getElementById('roi-form');
    if (!form) return;

    var fields = {
      enquiries: form.querySelector('#roi-enquiries'),
      handled: form.querySelector('#roi-handled'),
      conversion: form.querySelector('#roi-conversion'),
      commission: form.querySelector('#roi-commission'),
      package: form.querySelector('#roi-package')
    };
    var ranges = {
      enquiries: form.querySelector('#roi-enquiries-range'),
      handled: form.querySelector('#roi-handled-range'),
      conversion: form.querySelector('#roi-conversion-range'),
      commission: form.querySelector('#roi-commission-range')
    };
    var out = {
      additional: document.getElementById('r-additional'),
      deals: document.getElementById('r-deals'),
      commission: document.getElementById('r-commission'),
      package: document.getElementById('r-package'),
      monthly: document.getElementById('r-monthly'),
      first: document.getElementById('r-first'),
      monthlyRow: document.getElementById('r-monthly-row'),
      firstRow: document.getElementById('r-first-row')
    };
    var summary = document.getElementById('roi-summary');
    var SETUP_FEE = 1000;
    var fmtAED = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });

    /* ---- Paired number + range controls ---- */
    function paintRange(rangeEl) {
      var pct = (rangeEl.value - rangeEl.min) / (rangeEl.max - rangeEl.min) * 100;
      rangeEl.style.setProperty('--fill', pct + '%');
    }
    Object.keys(ranges).forEach(function (key) {
      var numEl = fields[key];
      var rangeEl = ranges[key];
      if (!numEl || !rangeEl) return;

      function numToRange() {
        var v = parseFloat(numEl.value);
        if (isFinite(v)) {
          rangeEl.value = Math.min(Math.max(v, Number(rangeEl.min)), Number(rangeEl.max));
          paintRange(rangeEl);
        }
      }
      numEl.addEventListener('input', numToRange);
      rangeEl.addEventListener('input', function () {
        numEl.value = rangeEl.value;
        paintRange(rangeEl);
      });
      numToRange();
    });

    /* ---- Validation ---- */
    function setFieldError(name, message) {
      var wrap = form.querySelector('.field[data-field="' + name + '"]');
      var err = form.querySelector('#roi-' + name + '-err');
      if (!wrap || !err) return;
      wrap.classList.toggle('has-error', Boolean(message));
      err.textContent = message || '';
    }

    function readNumber(input) {
      var raw = String(input.value).trim();
      if (raw === '' || !isFinite(Number(raw))) return NaN;
      return Number(raw);
    }

    function validate() {
      var ok = true;
      var e = readNumber(fields.enquiries);
      if (isNaN(e) || e < 0 || e > 100000) {
        setFieldError('enquiries', 'Enter a number between 0 and 100,000.');
        ok = false;
      } else setFieldError('enquiries', '');

      var h = readNumber(fields.handled);
      if (isNaN(h) || h < 0 || h > 100) {
        setFieldError('handled', 'Enter a percentage between 0 and 100.');
        ok = false;
      } else setFieldError('handled', '');

      var c = readNumber(fields.conversion);
      if (isNaN(c) || c < 0 || c > 100) {
        setFieldError('conversion', 'Enter a percentage between 0 and 100.');
        ok = false;
      } else setFieldError('conversion', '');

      var m = readNumber(fields.commission);
      if (isNaN(m) || m < 0 || m > 10000000) {
        setFieldError('commission', 'Enter an amount between 0 and 10,000,000.');
        ok = false;
      } else setFieldError('commission', '');

      return ok ? { enquiries: e, handled: h, conversion: c, commission: m } : null;
    }

    /* ---- Tweened (count-up) result values ---- */
    var state = { additional: 0, deals: 0, commission: 0, monthly: 0, first: 0 };
    var tweens = {};

    function tween(key, to, fmt, dur) {
      var el = null;
      if (key === 'additional') el = out.additional;
      else if (key === 'deals') el = out.deals;
      else if (key === 'commission') el = out.commission;
      else if (key === 'monthly') el = out.monthly;
      else if (key === 'first') el = out.first;
      if (!el) return;

      var from = state[key];
      state[key] = to;

      if (reducedMotion.matches || from === to) {
        el.textContent = fmt(to);
        return;
      }
      if (tweens[key]) cancelAnimationFrame(tweens[key]);
      var start = performance.now();
      var duration = dur || 520;
      function frame(now) {
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(from + (to - from) * eased);
        if (t < 1) tweens[key] = requestAnimationFrame(frame);
      }
      tweens[key] = requestAnimationFrame(frame);
    }

    function flash(el) {
      if (!el || reducedMotion.matches) return;
      var row = el.closest('.result-row');
      if (!row) return;
      row.classList.remove('is-updating');
      void row.offsetWidth; // restart the animation
      row.classList.add('is-updating');
      window.setTimeout(function () { row.classList.remove('is-updating'); }, 700);
    }

    function money(n) { return 'AED ' + fmtAED.format(Math.round(n)); }
    function moneySigned(n) { return (n < 0 ? '− ' : '') + money(Math.abs(n)); }

    function calculate(values) {
      var pkg = fields.package.selectedOptions[0];
      var price = Number(fields.package.value);
      var plan = pkg.getAttribute('data-plan');
      var included = pkg.getAttribute('data-included');

      var additional = values.enquiries * values.handled / 100;
      var deals = additional * values.conversion / 100;
      var commissionTotal = deals * values.commission;
      var monthly = commissionTotal - price;
      var first = monthly - SETUP_FEE;

      tween('additional', additional, function (v) {
        return fmtAED.format(Math.round(v)) + ' enquiries / month';
      });
      tween('deals', deals, function (v) { return v.toFixed(1) + ' deals / month'; });
      tween('commission', commissionTotal, money);

      out.package.textContent = money(price) + ' · ' + plan + ' (' + included + ' calls included)';

      tween('monthly', monthly, moneySigned);
      tween('first', first, moneySigned);
      out.monthlyRow.classList.toggle('is-negative', monthly < 0);
      out.firstRow.classList.toggle('is-negative', first < 0);

      flash(out.commission);
      flash(out.monthly);
      flash(out.first);

      if (summary) {
        summary.textContent =
          'Scenario: ' + fmtAED.format(Math.round(additional)) + ' additional enquiries, ' +
          deals.toFixed(1) + ' estimated deals, ' + money(commissionTotal) +
          ' additional commission. Package ' + money(price) +
          ', recurring monthly net estimate ' + moneySigned(monthly) +
          ', first-month net estimate ' + moneySigned(first) + ' after the AED 1,000 setup fee.';
      }
    }

    function recalc() {
      var values = validate();
      if (values) calculate(values);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      recalc();
    });

    form.addEventListener('input', recalc);
    form.addEventListener('change', recalc);

    document.getElementById('roi-reset').addEventListener('click', function () {
      ['enquiries', 'handled', 'conversion', 'commission'].forEach(function (name) {
        setFieldError(name, '');
      });
      form.reset();
      // re-sync the sliders from the restored number values
      Object.keys(ranges).forEach(function (key) {
        var numEl = fields[key];
        var rangeEl = ranges[key];
        if (numEl && rangeEl) {
          var v = parseFloat(numEl.value);
          if (isFinite(v)) {
            rangeEl.value = Math.min(Math.max(v, Number(rangeEl.min)), Number(rangeEl.max));
            paintRange(rangeEl);
          }
        }
      });
      recalc();
    });

    // Initial render with the example values (counts up from zero)
    recalc();
  }

  initPreview();
  initCalculator();
})();
