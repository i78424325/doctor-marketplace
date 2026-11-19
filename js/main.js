/* Доктор Маркетплейс — интерактив главной */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var qa = /[?&]qa=1/.test(location.search);
  if (qa) root.classList.add('qa');
  var reduce = qa || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 5); };

  /* навигация */
  var nav = $('.nav'), ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { nav.classList.toggle('scrolled', window.scrollY > 12); ticking = false; }); } }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var menuBtn = $('.menu-btn');
  var mmenu = $('#mmenu');
  function setMenu(open) { root.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); d.body.style.overflow = open ? 'hidden' : ''; if (mmenu) mmenu.inert = !open; }
  if (menuBtn) {
    if (mmenu) mmenu.inert = true;
    menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    $$('.mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
    // повернули планшет / расширили окно с открытым меню — закрываем, иначе страница остаётся без прокрутки
    var wide = window.matchMedia('(min-width:1024px)'), onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }
  var links = $$('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window && links.length) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); }); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = d.getElementById(a.getAttribute('href').slice(1)); if (s) secIO.observe(s); });
  }

  /* появление блоков */
  var revealIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('[data-reveal], .steps').forEach(function (el) { if (revealIO) revealIO.observe(el); else el.classList.add('in'); });

  /* счётчики */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function count(el) {
    var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null, dur = 1400;
    if (reduce) { el.textContent = fmt(to) + suf; return; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); el.textContent = fmt(Math.round(to * easeOut(p))) + suf; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var cntIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { count(e.target); cntIO.unobserve(e.target); } });
  }, { threshold: .4 }) : null;
  $$('[data-count]').forEach(function (el) { if (cntIO) cntIO.observe(el); else count(el); });

  /* первый экран: маркеры, линия пульса, уведомления */
  setTimeout(function () { $$('.mark').forEach(function (m) { m.classList.add('on'); }); }, reduce ? 0 : 350);
  var chart = $('.chart'), path = $('.chart .line'), pt = $('.chart .pt'), halo = $('.chart .halo');
  if (chart && path && path.getTotalLength) {
    var len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    var place = function (p) { var q = path.getPointAtLength(len * p); pt.setAttribute('cx', q.x); pt.setAttribute('cy', q.y); halo.setAttribute('cx', q.x); halo.setAttribute('cy', q.y); };
    var draw = function () {
      chart.classList.add('on');
      if (reduce) { path.style.strokeDashoffset = 0; place(1); return; }
      var t0 = null, dur = 2600;
      var f = function (ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur), e = easeOut(p); path.style.strokeDashoffset = len * (1 - e); place(e); if (p < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    };
    place(0); setTimeout(draw, reduce ? 0 : 250);
  }
  $$('.note').forEach(function (n, i) { setTimeout(function () { n.classList.add('on'); }, reduce ? 0 : 900 + i * 650); });

  /* «Это про вас?» */
  var seg = $('.seg');
  if (seg) {
    var tabs = $$('[role="tab"]', seg), pill = $('.seg-pill', seg);
    var select = function (i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i, panel = d.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        if (panel) { panel.hidden = !on; if (on) { panel.classList.remove('show'); void panel.offsetWidth; panel.classList.add('show'); } }
      });
      pill.style.transform = 'translateX(' + (i * 100) + '%)';
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true); } });
    });
  }

  /* услуги: раскрытие и подсветка под курсором */
  $$('.svc').forEach(function (card) {
    var btn = $('.svc-more', card), list = $('ul', card);
    if (btn && list) btn.addEventListener('click', function () { var open = list.hidden; list.hidden = !open; card.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); var l = $('.lbl', btn); if (l) l.textContent = open ? 'Свернуть' : 'Что входит'; });
  });
  if (fine) $$('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });

  /* «магнитные» кнопки */
  if (fine && !reduce) $$('[data-magnetic]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); var x = (e.clientX - r.left - r.width / 2) * .18, y = (e.clientY - r.top - r.height / 2) * .3; b.style.transform = 'translate(' + x + 'px,' + y + 'px)'; });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  /* фраза по словам */
  var tag = $('.tagline p');
  if (tag) {
    var html = tag.innerHTML.replace(/<em>(.*?)<\/em>/g, function (_, w) { return w.split(/\s+/).map(function (x) { return '§' + x; }).join(' '); });
    tag.innerHTML = html.split(/\s+/).filter(Boolean).map(function (w) { var acc = w.charAt(0) === '§'; return '<span class="w' + (acc ? ' acc' : '') + '">' + (acc ? w.slice(1) : w) + '</span>'; }).join(' ');
    var words = $$('.w', tag);
    if (reduce || !('IntersectionObserver' in window)) words.forEach(function (w) { w.classList.add('on'); });
    else { var wIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); wIO.unobserve(e.target); } }); }, { rootMargin: '0px 0px -38% 0px' }); words.forEach(function (w) { wIO.observe(w); }); }
  }

  /* веер телефонов с примерами */
  var fan = $('.fan');
  if (fan) {
    var cards = $$('.phone', fan), dots = $$('.fan-nav button'), open = $('.fan-link a'), cur = 0, timer = null, n = cards.length;
    var POS = [
      'translate(0,0) rotate(0deg) scale(1)',
      'translate(58%,18px) rotate(7deg) scale(.9)',
      'translate(-58%,18px) rotate(-7deg) scale(.9)',
      'translate(0,36px) rotate(0deg) scale(.82)'
    ];
    var show = function (i) {
      cur = (i + n) % n;
      cards.forEach(function (c, k) {
        var dlt = (k - cur + n) % n;
        c.style.transform = POS[Math.min(dlt, POS.length - 1)];
        c.style.zIndex = String(n - dlt);
        c.style.opacity = dlt === 3 ? '0' : (dlt === 0 ? '1' : '.72');
        c.setAttribute('aria-hidden', dlt === 0 ? 'false' : 'true');
      });
      dots.forEach(function (b, k) { b.setAttribute('aria-current', String(k === cur)); });
      if (open) { open.href = cards[cur].getAttribute('data-href'); $('.lbl', open).textContent = 'Открыть ' + cards[cur].getAttribute('data-name'); }
    };
    var auto = function () { stopAuto(); if (!reduce) timer = setInterval(function () { show(cur + 1); }, 3600); };
    var stopAuto = function () { if (timer) clearInterval(timer); timer = null; };
    cards.forEach(function (c, k) { c.addEventListener('click', function () { show(k === cur ? cur + 1 : k); auto(); }); });
    dots.forEach(function (b, k) { b.addEventListener('click', function () { show(k); auto(); }); });
    fan.addEventListener('pointerenter', stopAuto); fan.addEventListener('pointerleave', auto);
    show(0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) auto(); else stopAuto(); }); }, { threshold: .3 }).observe(fan);
  }

  /* голосовой ввод */
  if (window.DMVoice) $$('[data-mic]').forEach(function (b) { var id = b.getAttribute('data-mic'); window.DMVoice.attach(b, d.getElementById(id), d.getElementById(id + '-st')); });

  /* заявка */
  var form = $('#consult-form');
  function goForm(service, note) {
    if (!form) return;
    if (service) { var sel = $('#f-service'); if (sel) sel.value = service; }
    if (note) { var c = $('#f-comment'); if (c && !c.value) c.value = note; }
    d.getElementById('consult').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { var nm = $('#f-name'); if (nm) nm.focus({ preventScroll: true }); }, reduce ? 0 : 700);
  }
  $$('[data-service]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); goForm(b.getAttribute('data-service'), b.getAttribute('data-note')); }); });
  if (form) {
    var setErr = function (input, msg) { var e = d.getElementById(input.id + '-err'); input.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (e) e.textContent = msg || ''; };
    var nameI = $('#f-name'), contactI = $('#f-contact'), consent = $('#f-consent');
    [nameI, contactI].forEach(function (i) { i.addEventListener('input', function () { if (i.getAttribute('aria-invalid') === 'true') validate(i); }); });
    consent.addEventListener('change', function () { consent.closest('.check').classList.toggle('invalid', !consent.checked); });
    var validate = function (i) {
      var v = i.value.trim();
      if (i === nameI) { setErr(i, v.length < 2 ? 'Напишите, как к вам обращаться.' : ''); return v.length >= 2; }
      // телефон (10–15 цифр), ник Телеграма (начинается с буквы, 5–32 символа), ссылка t.me или почта
      var digits = v.replace(/\D/g, '').length;
      var ok = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v) || /t\.me\/[a-zA-Z][a-zA-Z0-9_]{4,}/.test(v) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || (/^[\d\s()+\-]+$/.test(v) && digits >= 10 && digits <= 15);
      setErr(i, ok ? '' : 'Укажите телефон, ник в Телеграме (например, @username) или почту.');
      return ok;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = validate(nameI), b = validate(contactI), c = consent.checked;
      consent.closest('.check').classList.toggle('invalid', !c);
      if (!a) { nameI.focus(); return; } if (!b) { contactI.focus(); return; } if (!c) { consent.focus(); return; }
      var btn = $('button[type="submit"]', form); btn.classList.add('loading'); btn.setAttribute('aria-busy', 'true');
      setTimeout(function () { form.hidden = true; var done = $('#consult-done'); done.hidden = false; done.focus(); }, 1100);
    });
  }

  /* липкая кнопка на телефоне */
  var sticky = $('.sticky-cta'), hero = $('.hero'), consultSec = d.getElementById('consult');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroOut = false, formIn = false;
    var upd = function () { sticky.classList.toggle('show', heroOut && !formIn && !root.classList.contains('menu-open')); };
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero);
    if (consultSec) new IntersectionObserver(function (es) { formIn = es[0].isIntersecting; upd(); }, { threshold: 0 }).observe(consultSec);
  }
})();
