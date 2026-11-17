/* Lunas — interaksi landing page
   1. Nav sticky + menu mobile
   2. Reveal on scroll
   3. Demo QRIS (nominal, keterangan, metode, QR update, salin link)
   4. Kalkulator biaya
   5. Accordion FAQ
   6. Toast helper
*/
(function () {
  'use strict';

  var fmt = function (n) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  };

  /* ---------------------------------------------------------------- */
  /* 1. Nav                                                           */
  /* ---------------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');

  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add('is-stuck');
      else nav.classList.remove('is-stuck');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    });

    // Tutup menu setelah memilih tautan
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 2. Reveal on scroll                                              */
  /* ---------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------------- */
  /* 3. Demo QRIS                                                     */
  /* ---------------------------------------------------------------- */
  var amountInput = document.getElementById('demoAmount');
  var noteInput = document.getElementById('demoNote');
  var methodSel = document.getElementById('demoMethod');
  var qrImg = document.getElementById('demoQrImg');
  var amtOut = document.getElementById('demoAmt');
  var metaOut = document.getElementById('demoMeta');
  var feeOut = document.getElementById('demoFee');
  var netOut = document.getElementById('demoNet');
  var chips = document.querySelectorAll('#demoChips .chip');

  var feeRate = 0.007; // 0,7%

  function currentAmount() {
    var v = parseFloat(String(amountInput && amountInput.value || '').replace(/[^\d]/g, ''));
    if (!v || v < 1000) v = 1000;
    return v;
  }

  function refreshQRCode(amount) {
    if (!qrImg) return;
    // QR contoh dari layanan generator eksternal — hanya untuk tampilan demo.
    var data = 'https://lunas.id/pay/INV-2098?amount=' + amount;
    qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=' +
      encodeURIComponent(data);
  }

  function renderDemo() {
    if (!amountInput) return;
    var amount = currentAmount();
    var fee = amount * feeRate;
    var net = amount - fee;

    if (amtOut) amtOut.textContent = fmt(amount);
    if (feeOut) feeOut.textContent = fmt(fee);
    if (netOut) netOut.textContent = fmt(net);

    if (metaOut) {
      var note = (noteInput && noteInput.value || '').trim();
      var method = (methodSel && methodSel.value || 'QRIS').replace('QRIS · ', '');
      metaOut.textContent = (note || 'Tanpa keterangan') + ' · ' + method;
    }

    chips.forEach(function (chip) {
      chip.classList.toggle('is-active', Number(chip.getAttribute('data-amount')) === amount);
    });

    refreshQRCode(amount);
  }

  if (amountInput) {
    amountInput.addEventListener('input', renderDemo);
    if (noteInput) noteInput.addEventListener('input', renderDemo);
    if (methodSel) methodSel.addEventListener('change', renderDemo);

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        amountInput.value = chip.getAttribute('data-amount');
        renderDemo();
      });
    });

    renderDemo();
  }

  /* Toast ---------------------------------------------------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
  }

  var copyBtn = document.getElementById('demoCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var link = 'https://lunas.id/pay/INV-2098?amount=' + currentAmount();
      var done = function () { toast('Link pembayaran tersalin.'); };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done).catch(function () {
          window.prompt('Salin link ini:', link);
        });
      } else {
        window.prompt('Salin link ini:', link);
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* 4. Kalkulator                                                    */
  /* ---------------------------------------------------------------- */
  var calcInput = document.getElementById('calcInput');
  var calcRange = document.getElementById('calcRange');
  var calcLunas = document.getElementById('calcLunas');
  var calcAgg = document.getElementById('calcAgg');
  var calcSave = document.getElementById('calcSave');

  function renderCalc(omzet) {
    if (!calcLunas) return;
    var lunas = omzet * (1 - 0.007);
    var agg = omzet * (1 - 0.02);
    calcLunas.textContent = fmt(lunas);
    calcAgg.textContent = fmt(agg);
    calcSave.textContent = fmt(lunas - agg);
  }

  function parseIdNumber(str) {
    var clean = String(str || '').replace(/[^\d]/g, '');
    return parseInt(clean || '0', 10);
  }

  if (calcRange) {
    calcRange.addEventListener('input', function () {
      var v = parseInt(calcRange.value, 10);
      if (calcInput) calcInput.value = v.toLocaleString('id-ID');
      renderCalc(v);
    });
  }

  if (calcInput) {
    calcInput.addEventListener('input', function () {
      var v = parseIdNumber(calcInput.value);
      var min = 1000000, max = 300000000;
      if (calcRange) {
        calcRange.value = Math.min(max, Math.max(min, v));
      }
      renderCalc(v);
    });

    calcInput.addEventListener('blur', function () {
      var v = parseIdNumber(calcInput.value);
      if (!v) v = 1000000;
      calcInput.value = v.toLocaleString('id-ID');
      if (calcRange) calcRange.value = Math.min(300000000, Math.max(1000000, v));
      renderCalc(v);
    });
  }

  if (calcRange) {
    renderCalc(parseInt(calcRange.value, 10));
  }

  /* ---------------------------------------------------------------- */
  /* 5. FAQ accordion                                                 */
  /* ---------------------------------------------------------------- */
  var faq = document.getElementById('faq');
  if (faq) {
    var items = faq.querySelectorAll('.faq__item');

    items.forEach(function (item) {
      var btn = item.querySelector('.faq__q');
      var panel = item.querySelector('.faq__a');
      if (!btn || !panel) return;

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        items.forEach(function (other) {
          if (other === item) return;
          other.classList.remove('is-open');
          var p = other.querySelector('.faq__a');
          if (p) p.style.maxHeight = '0px';
        });

        if (isOpen) {
          item.classList.remove('is-open');
          panel.style.maxHeight = '0px';
        } else {
          item.classList.add('is-open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });

    // Buka item pertama agar bagian FAQ tidak terlihat kosong
    if (items.length) {
      var first = items[0];
      var firstBtn = first.querySelector('.faq__q');
      if (firstBtn) firstBtn.click();
    }
  }
})();
