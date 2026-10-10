// صياناتي — سلوك الموقع: الوضع الفاتح والداكن، القائمة، إبراز القسم الحالي، الظهور عند التمرير، وتجربة الحساب.
(function () {
  'use strict';

  var root = document.documentElement;
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var num = function (n) { return '<span class="num">' + fmt(n) + '</span>'; };

  // ---------- الوضع الفاتح والداكن ----------
  // الفاتح هو الأساس دائمًا، بغض النظر عن إعداد الجهاز.
  function currentTheme() { return root.dataset.theme === 'dark' ? 'dark' : 'light'; }
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('sy-theme', next); } catch (e) {}
    });
  }

  // ---------- الشريط العلوي ----------
  var header = document.querySelector('.header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- قائمة الجوال ----------
  var menuBtn = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  function setMenu(open) {
    if (!menuBtn || !mobileNav) return;
    mobileNav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.i').textContent = open ? 'close' : 'menu';
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () { setMenu(mobileNav.hidden); });
    mobileNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });
  }

  // ---------- إبراز القسم الحالي في القائمة ----------
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  // ---------- الظهور عند التمرير ----------
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- جرّبها بنفسك: نفس منطق part_model.dart ----------
  var PARTS = [
    { name: 'زيت المكينة', interval: 5000 },
    { name: 'زيت القير', interval: 40000 },
    { name: 'فلتر الهواء', interval: 15000 },
    { name: 'فلتر المكيف', interval: 15000 },
    { name: 'البطارية', interval: 50000 },
    { name: 'الكفرات', interval: 40000 }
  ];
  var STATUS = {
    ok: { word: 'سليمة', icon: 'check_circle' },
    soon: { word: 'قريبة', icon: 'watch_later' },
    due: { word: 'مستحقة', icon: 'error' }
  };

  var chipsEl = document.getElementById('calc-parts');
  var lastEl = document.getElementById('calc-last');
  var nowEl = document.getElementById('calc-now');
  if (!chipsEl || !lastEl || !nowEl) return;

  var $ = function (id) { return document.getElementById(id); };
  var state = { idx: 0, last: 15000, now: 16000 };

  function thresholdFor(interval) { return Math.trunc(Math.min(1000, Math.max(300, interval * 0.1))); }
  function rangeMax(last, interval) { return last + interval + Math.max(1000, Math.round(interval * 0.15 / 500) * 500); }
  function stepFor(interval) { return interval <= 5000 ? 50 : 100; }

  PARTS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('role', 'radio');
    b.textContent = p.name;
    b.addEventListener('click', function () { selectPart(i, true); });
    chipsEl.appendChild(b);
  });
  var chips = Array.prototype.slice.call(chipsEl.children);
  chipsEl.addEventListener('keydown', function (e) {
    var keys = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 }; // من اليمين لليسار: اليسار هو التالي
    if (!(e.key in keys)) return;
    e.preventDefault();
    var next = (state.idx + keys[e.key] + PARTS.length) % PARTS.length;
    selectPart(next, true);
    chips[next].focus();
  });

  function syncRange() {
    var p = PARTS[state.idx];
    nowEl.min = state.last;
    nowEl.max = rangeMax(state.last, p.interval);
    nowEl.step = stepFor(p.interval);
    nowEl.value = state.now;
    $('calc-min').innerHTML = num(state.last);
    $('calc-max').innerHTML = num(+nowEl.max);
  }

  function selectPart(i, resetNow) {
    state.idx = i;
    chips.forEach(function (c, j) {
      c.setAttribute('aria-checked', String(j === i));
      c.tabIndex = j === i ? 0 : -1;
    });
    if (resetNow) state.now = state.last + Math.round(PARTS[i].interval * 0.2 / 100) * 100;
    syncRange();
    render();
  }

  lastEl.addEventListener('input', function () {
    var v = parseInt(lastEl.value, 10);
    if (isNaN(v) || v < 0) return;
    var traveled = state.now - state.last;
    state.last = Math.min(v, 999000);
    state.now = state.last + Math.max(0, traveled);
    syncRange();
    state.now = Math.min(state.now, +nowEl.max);
    nowEl.value = state.now;
    render();
  });
  lastEl.addEventListener('blur', function () { lastEl.value = state.last; });
  nowEl.addEventListener('input', function () { state.now = parseInt(nowEl.value, 10); render(); });

  function render() {
    var p = PARTS[state.idx];
    var next = state.last + p.interval;
    var remaining = next - state.now;
    var threshold = thresholdFor(p.interval);
    var status = remaining <= 0 ? 'due' : remaining <= threshold ? 'soon' : 'ok';
    var progress = Math.min(1, Math.max(0, (state.now - state.last) / p.interval));
    var s = STATUS[status];

    $('calc-card').className = 'part part-' + status;
    $('calc-icon').textContent = s.icon;
    var badge = $('calc-badge');
    badge.className = 'badge badge-' + status;
    badge.textContent = s.word;
    $('calc-name').textContent = p.name;
    $('calc-interval').innerHTML = 'كل ' + num(p.interval) + ' كم';
    $('calc-bar').style.width = (progress * 100).toFixed(1) + '%';
    $('calc-last-text').innerHTML = 'آخر تغيير: ' + num(state.last) + ' كم';
    $('calc-due').innerHTML = 'موعد التغيير: ' + num(next) + ' كم';
    $('calc-now-out').innerHTML = num(state.now) + ' كم';

    var remainingText, say;
    if (status === 'due') {
      remainingText = remaining === 0 ? 'حان موعدها' : 'تجاوز الموعد بـ ' + num(-remaining) + ' كم';
      say = remaining === 0
        ? '<b>' + p.name + ' مستحقة.</b> وصل الممشى إلى موعدها. غيّرها ثم سجّل التغيير.'
        : '<b>' + p.name + ' مستحقة.</b> تجاوز الممشى موعدها بـ ' + num(-remaining) + ' كم. غيّرها ثم سجّل التغيير.';
    } else {
      remainingText = 'بعد ' + num(remaining) + ' كم';
      say = status === 'soon'
        ? '<b>' + p.name + ' قريبة.</b> باقي ' + num(remaining) + ' كم على موعدها، وهذا ضمن حدّ التنبيه (' + num(threshold) + ' كم).'
        : '<b>' + p.name + ' سليمة.</b> باقي ' + num(remaining) + ' كم على موعدها، وحدّ التنبيه لها ' + num(threshold) + ' كم.';
    }
    $('calc-remaining').innerHTML = remainingText;
    $('calc-say').innerHTML = say;
  }

  selectPart(0, false);
})();
