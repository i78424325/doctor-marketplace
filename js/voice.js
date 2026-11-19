/* Голосовой ввод: Web Speech API (ru-RU). Если браузер не умеет — подсказка про микрофон клавиатуры. */
window.DMVoice = (function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var active = null;
  var ERR = {
    'not-allowed': 'Нет доступа к микрофону. Разрешите его в настройках браузера.',
    'service-not-allowed': 'Браузер не дал включить распознавание. Нажмите микрофон на клавиатуре телефона.',
    'no-speech': 'Ничего не услышали. Нажмите ещё раз и говорите.',
    'audio-capture': 'Не нашли микрофон. Проверьте, что он подключён.',
    'network': 'Нет связи с сервисом распознавания. Нажмите микрофон на клавиатуре телефона.'
  };
  function setStatus(el, text, state) { if (!el) return; el.textContent = text || ''; el.setAttribute('data-state', state || ''); }
  function join(a, b) { a = (a || '').replace(/\s+$/, ''); b = (b || '').trim(); return a && b ? a + ' ' + b : (a || b); }
  function stop() { if (active) { try { active.rec.stop(); } catch (e) {} } }
  function attach(btn, field, statusEl) {
    btn.setAttribute('aria-pressed', 'false');
    if (!SR) {
      btn.addEventListener('click', function () { setStatus(statusEl, 'В этом браузере нет голосового ввода. Нажмите микрофон на клавиатуре телефона — речь сама станет текстом.', 'warn'); field.focus(); });
      return;
    }
    btn.addEventListener('click', function () {
      if (active && active.btn === btn) { stop(); return; }
      stop();
      var rec = new SR(), base = field.value, fin = '';
      rec.lang = 'ru-RU'; rec.interimResults = true; rec.continuous = true;
      rec.onstart = function () { btn.classList.add('rec'); btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Остановить запись'); setStatus(statusEl, 'Слушаю. Говорите — текст появится в поле.', 'live'); };
      rec.onresult = function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) { var r = e.results[i]; if (r.isFinal) fin += r[0].transcript + ' '; else interim += r[0].transcript; }
        field.value = join(base, fin + interim);
        field.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onerror = function (e) { setStatus(statusEl, ERR[e.error] || 'Не получилось распознать. Попробуйте ещё раз.', 'warn'); };
      rec.onend = function () {
        btn.classList.remove('rec'); btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Надиктовать голосом');
        if (active && active.rec === rec) active = null;
        if (statusEl && statusEl.getAttribute('data-state') === 'live') setStatus(statusEl, '', '');
        field.value = join(base, fin);
        field.dispatchEvent(new Event('input', { bubbles: true }));
      };
      active = { rec: rec, btn: btn };
      try { rec.start(); } catch (err) { setStatus(statusEl, 'Не получилось включить микрофон. Попробуйте ещё раз.', 'warn'); }
    });
  }
  return { attach: attach, stop: stop, supported: !!SR };
})();
