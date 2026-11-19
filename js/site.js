/* Доктор Маркетплейс — общий скрипт всех страниц. Лёгкий: никаких обработчиков прокрутки,
   анимаций на каждый кадр и слежения за мышью — только IntersectionObserver и клики. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var qa = /[?&]qa=1/.test(location.search);
  if (qa) root.classList.add('qa');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var IO = 'IntersectionObserver' in window;

  /* шапка: тень после начала прокрутки — по «датчику» вверху страницы, без события scroll */
  var nav = $('.nav'), sensor = $('#top-sensor');
  if (nav && sensor && IO) new IntersectionObserver(function (e) { nav.classList.toggle('scrolled', !e[0].isIntersecting); }).observe(sensor);

  /* мобильное меню */
  var menuBtn = $('.menu-btn'), mmenu = $('#mmenu');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    d.body.style.overflow = open ? 'hidden' : '';
    if (mmenu) mmenu.inert = !open;
  }
  if (menuBtn) {
    if (mmenu) mmenu.inert = true;
    menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    $$('#mmenu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
    var wide = window.matchMedia('(min-width:1024px)'), onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  /* появление блоков при прокрутке — один раз */
  var shown = $$('[data-reveal], .tagline, .steps');
  if (IO && !qa) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    shown.forEach(function (el) { io.observe(el); });
  } else shown.forEach(function (el) { el.classList.add('in'); });

  /* липкая кнопка на телефоне: появляется, когда первый экран ушёл вверх */
  var sticky = $('.sticky-cta'), heroEl = $('.hero, .phero');
  if (sticky && heroEl && IO) new IntersectionObserver(function (e) { sticky.classList.toggle('show', !e[0].isIntersecting); }).observe(heroEl);

  /* заранее подгружаем страницу, на которую вот-вот перейдут (там, где нет speculationrules) */
  var spec = window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
  if (!spec) {
    var done = {};
    var warm = function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.origin !== location.origin || a.target === '_blank' || a.hash && a.pathname === location.pathname) return;
      var u = a.pathname + a.search;
      if (done[u]) return; done[u] = 1;
      var l = d.createElement('link'); l.rel = 'prefetch'; l.href = u; d.head.appendChild(l);
    };
    d.addEventListener('pointerover', warm, { passive: true });
    d.addEventListener('touchstart', warm, { passive: true });
  }

  /* голосовой ввод (скрипт voice.js подключён только там, где есть микрофон) */
  if (window.DMVoice) $$('[data-mic]').forEach(function (b) {
    var id = b.getAttribute('data-mic');
    window.DMVoice.attach(b, d.getElementById(id), d.getElementById(id + '-st'));
  });

  /* заявка на консультацию (демо: никуда не отправляется) */
  var form = $('#consult-form');
  if (form) {
    var nameI = $('#f-name'), contactI = $('#f-contact'), consent = $('#f-consent'), service = $('#f-service');
    var params = new URLSearchParams(location.search), want = params.get('usluga');
    if (want && service) { var opt = $('option[value="' + want.replace(/[^a-z0-9-]/g, '') + '"]', service); if (opt) service.value = opt.value; }
    var setErr = function (input, msg) { var e = d.getElementById(input.id + '-err'); input.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (e) e.textContent = msg || ''; };
    var validate = function (i) {
      var v = i.value.trim();
      if (i === nameI) { setErr(i, v.length < 2 ? 'Напишите, как к вам обращаться.' : ''); return v.length >= 2; }
      // телефон (10–15 цифр), ник Телеграма (с буквы, 5–32 символа), ссылка t.me или почта
      var digits = v.replace(/\D/g, '').length;
      var ok = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v) || /t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,}/.test(v) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || (/^[\d\s()+\-]+$/.test(v) && digits >= 10 && digits <= 15);
      setErr(i, ok ? '' : 'Укажите телефон, ник в Телеграме (например, @username) или почту.');
      return ok;
    };
    [nameI, contactI].forEach(function (i) { i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') validate(i); }); });
    consent.addEventListener('change', function () { consent.closest('.check').classList.toggle('invalid', !consent.checked); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = validate(nameI), b = validate(contactI), c = consent.checked;
      consent.closest('.check').classList.toggle('invalid', !c);
      if (!a) { nameI.focus(); return; } if (!b) { contactI.focus(); return; } if (!c) { consent.focus(); return; }
      var btn = $('button[type="submit"]', form); btn.classList.add('loading'); btn.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        form.hidden = true;
        var okBox = $('#consult-done'); okBox.hidden = false; okBox.focus({ preventScroll: true });
        okBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 900);
    });
  }
})();
