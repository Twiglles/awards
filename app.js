(function () {
  var C = window.GOLOS, N = C.nominations, SK = 'golos_state';
  var $ = function (id) { return document.getElementById(id); };
  var view = $('view'), prog = $('prog'), bar = $('bar'), back = $('back'), next = $('next');
  if (/[?&]reset\b/.test(location.search)) { try { localStorage.removeItem(SK); } catch (e) {} history.replaceState(null, '', location.pathname); }
  var S = load() || { step: 0, choices: {}, session: null, name: '', done: false };
  var err = '';

  function load() { try { return JSON.parse(localStorage.getItem(SK)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function b64u(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

  function api(body, tries) {
    tries = tries || 0;
    return fetch(C.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .catch(function (e) {
        if (tries >= 5) throw e;
        return new Promise(function (ok) { setTimeout(ok, 800 * Math.pow(2, tries) + Math.random() * 500); }).then(function () { return api(body, tries + 1); });
      });
  }

  function titleHtml() {
    var t = esc(C.title), w = t.split(' ');
    return w.length > 1 ? w.slice(0, -1).join(' ') + ' <mark>' + w[w.length - 1] + '</mark>' : '<mark>' + t + '</mark>';
  }

  function go(n) { S.step = n; err = ''; save(); render(); window.scrollTo(0, 0); }

  function render() {
    $('who').textContent = S.name || '';
    prog.hidden = S.step === 0 || S.done;
    bar.hidden = S.step === 0 || S.done;
    if (S.done) return done();
    if (S.step === 0) return intro();
    if (S.step <= N.length) return nomination(S.step - 1);
    summary();
  }

  function progress(i) {
    var h = '';
    for (var k = 0; k < N.length; k++) h += '<i class="' + (k <= i ? 'on' : '') + '"></i>';
    prog.innerHTML = h + '<span>' + Math.min(i + 1, N.length) + ' из ' + N.length + '</span>';
  }

  function intro() {
    view.innerHTML = '<div class="tag">Голосование</div><h1>' + titleHtml() + '</h1><div class="sub">' + esc(C.subtitle) + '</div><p class="t">' + esc(C.intro) + '</p>' +
      '<div class="card"><div class="auth">' +
      '<button class="vk" id="avk"><svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#0077FF"/><g transform="translate(4 4) scale(1)"><path fill="#fff" d="M12.785 16.241s.288-.032.436-.194c.136-.148.131-.427.131-.427s-.02-1.304.587-1.496c.596-.19 1.364 1.259 2.177 1.815.615.422 1.082.33 1.082.33l2.175-.03s1.137-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.246.999-1.33 1.398-2.142 1.273-2.489-.119-.331-.854-.244-.854-.244l-2.449.015s-.182-.025-.316.056c-.132.079-.217.263-.217.263s-.387 1.028-.903 1.903c-1.09 1.85-1.526 1.948-1.704 1.834-.414-.267-.31-1.075-.31-1.648 0-1.793.272-2.54-.53-2.734-.266-.064-.462-.107-1.143-.114-.874-.009-1.614.003-2.033.208-.279.136-.494.44-.363.457.162.022.529.099.723.363.251.342.242 1.11.242 1.11s.144 2.11-.337 2.373c-.33.18-.783-.188-1.755-1.865-.498-.86-.874-1.81-.874-1.81s-.072-.177-.202-.272c-.157-.115-.377-.151-.377-.151l-2.327.015s-.35.01-.478.162c-.114.135-.009.414-.009.414s1.82 4.258 3.883 6.403c1.89 1.968 4.04 1.838 4.04 1.838h.974z"/></g></svg>Войти через ВКонтакте</button>' +
      '<button class="ya" id="aya"><img class="ic" src="yandex.png" alt="" width="28" height="28">Войти через Яндекс</button>' +
      (C.demo ? '<button id="ademo">Тестовый вход</button>' : '') +
      '</div></div>' +
      '<p class="note hop">Откроется страница ВКонтакте или Яндекса: подтвердите вход, и вы автоматически вернётесь сюда, чтобы продолжить.</p>' +
      '<p class="note">Мы получаем только идентификатор и имя аккаунта, чтобы учесть один голос. Пароли нам не передаются.</p>' + (C.policyUrl ? '<p class="note pol"><a href="' + esc(C.policyUrl) + '" target="_blank" rel="noopener">Политика обработки персональных данных</a></p>' : '') +
      (err ? '<div class="err">' + esc(err) + '</div>' : '');
    $('avk').onclick = vkLogin;
    $('aya').onclick = yaLogin;
    if (C.demo) $('ademo').onclick = function () { S.session = 'demo'; S.name = 'Тест'; go(1); };
  }

  function nomination(i) {
    var n = N[i], sel = S.choices[n.id];
    progress(i);
    view.innerHTML = '<div class="tag">Номинация ' + (i + 1) + '</div><h2>' + esc(n.title) + '</h2>' + (n.hint ? '<div class="hint">' + esc(n.hint) + '</div>' : '') +
      '<div class="cards">' + n.candidates.map(function (c) {
        return '<button class="opt' + (sel === c.id ? ' sel' : '') + '" aria-pressed="' + (sel === c.id) + '" data-id="' + esc(c.id) + '">' +
          (c.photo ? '<img src="' + esc(c.photo) + '" alt="" width="60" height="60" loading="lazy" decoding="async">' : '') +
          '<div><div class="nm">' + esc(c.name) + '</div>' + (c.text ? '<div class="tx">' + esc(c.text) + '</div>' : '') + '</div><span class="dot"></span></button>';
      }).join('') + '</div>';
    Array.prototype.forEach.call(view.querySelectorAll('.opt'), function (el) {
      el.onclick = function () { S.choices[n.id] = S.choices[n.id] === el.dataset.id ? undefined : el.dataset.id; if (S.choices[n.id] === undefined) delete S.choices[n.id]; save(); nomination(i); };
    });
    back.hidden = i === 0;
    back.onclick = function () { go(S.step - 1); };
    next.disabled = !sel && !C.allowSkip;
    next.textContent = sel ? 'Далее' : 'Пропустить';
    next.onclick = function () { go(S.step + 1); };
  }

  function cname(n, id) {
    for (var k = 0; k < n.candidates.length; k++) if (n.candidates[k].id === id) return n.candidates[k].name;
    return '';
  }

  function summary() {
    progress(N.length);
    back.hidden = false;
    view.innerHTML = '<div class="tag">Итог</div><h2>Проверьте <mark>выбор</mark></h2><div class="hint">После отправки изменить голос нельзя.</div><div class="card">' +
      N.map(function (n, i) {
        var v = S.choices[n.id];
        return '<div class="line' + (v ? '' : ' empty') + '"><div><small>' + esc(n.title) + '</small><strong>' + esc(v ? cname(n, v) : 'Не выбрано') + '</strong></div><button data-i="' + (i + 1) + '">Изменить</button></div>';
      }).join('') + '</div>' +
      '<label class="agree"><input type="checkbox" id="agree"' + (S.agree ? ' checked' : '') + '><span>Я даю согласие на обработку моих персональных данных в целях учёта голоса' + (C.policyUrl ? ' в соответствии с <a href="' + esc(C.policyUrl) + '" target="_blank" rel="noopener">Политикой обработки персональных данных</a>' : '') + '</span></label>' + (err ? '<div class="err">' + esc(err) + '</div>' : '');
    Array.prototype.forEach.call(view.querySelectorAll('.line button'), function (b) { b.onclick = function () { go(+b.dataset.i); }; });
    back.onclick = function () { go(N.length); };
    var any = Object.keys(S.choices).length > 0, ag = $('agree');
    var lab = ag.parentNode;
    next.disabled = !any;
    ag.onchange = function () { S.agree = ag.checked; save(); lab.classList.remove('need'); };
    next.textContent = 'Отправить голос';
    next.onclick = function () {
      if (!ag.checked) { lab.classList.add('need'); lab.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      send();
    };
  }

  function answers() {
    var r = [];
    N.forEach(function (n) { var v = S.choices[n.id]; if (v) r.push({ n: n.title, c: cname(n, v) }); });
    return r;
  }

  function send() {
    next.disabled = true; next.textContent = 'Отправляем…'; err = '';
    var p = C.demo && S.session === 'demo' ? Promise.resolve({ ok: true }) : api({ action: 'vote', token: S.session, answers: answers() });
    p.then(function (r) {
      if (r && r.ok) { S.done = true; S.choices = {}; if (S.session !== 'demo') save(); return render(); }
      if (r && r.error === 'voted') { S.done = true; S.was = true; save(); return render(); }
      if (r && r.error === 'auth') { S.session = null; err = 'Сессия истекла, войдите заново. Выбор сохранён.'; return go(0); }
      err = 'Не удалось отправить, попробуйте ещё раз.'; summary();
    }).catch(function () { err = 'Нет связи, попробуйте ещё раз.'; summary(); });
  }

  function done() {
    prog.hidden = true;
    view.innerHTML = S.was
      ? '<div class="tag">Готово</div><h1>Вы уже <mark>голосовали</mark></h1><p class="t">С этого аккаунта голос уже принят, повторно проголосовать нельзя.</p>'
      : '<div class="tag">Готово</div><h1>Спасибо!</h1><div class="sub">Ваш голос <mark>принят</mark></div><p class="t">Результаты опубликуем после окончания голосования.</p>';
  }

  function yaLogin() {
    var st = rnd(12);
    S.oauth = { p: 'ya', state: st }; save();
    location.href = 'https://oauth.yandex.ru/authorize?response_type=token&client_id=' + encodeURIComponent(C.yandexClientId) +
      '&redirect_uri=' + encodeURIComponent(C.redirectUri) + '&state=' + st;
  }

  function vkLogin() {
    var ver = rnd(32), st = rnd(12);
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(ver)).then(function (h) {
      S.oauth = { p: 'vk', state: st, ver: ver }; save();
      location.href = 'https://id.vk.com/authorize?response_type=code&client_id=' + encodeURIComponent(C.vkClientId) +
        '&redirect_uri=' + encodeURIComponent(C.redirectUri) + '&state=' + st + '&code_challenge=' + b64u(h) +
        '&code_challenge_method=S256&scope=vkid.personal_info';
    });
  }

  function fromProvider() {
    var h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams(location.search), o = S.oauth, body = null;
    if (!o) return Promise.resolve();
    if (o.p === 'ya' && h.get('access_token') && h.get('state') === o.state) body = { action: 'auth', provider: 'ya', token: h.get('access_token') };
    if (o.p === 'vk' && q.get('code') && q.get('state') === o.state) body = { action: 'auth', provider: 'vk', code: q.get('code'), device_id: q.get('device_id'), verifier: o.ver, redirect: C.redirectUri, state: q.get('state') };
    if (!body) { if (h.get('error') || q.get('error')) err = 'Вход не выполнен. Попробуйте ещё раз.'; return Promise.resolve(); }
    history.replaceState(null, '', location.pathname);
    delete S.oauth; save();
    view.innerHTML = '<h2>Входим…</h2>';
    return api(body).then(function (r) {
      if (r && r.session) { S.session = r.session; S.name = r.name || ''; if (r.voted) { S.done = true; S.was = true; } S.step = Math.max(S.step, 1); }
      else err = 'Не удалось войти. Попробуйте ещё раз.';
      save();
    }).catch(function () { err = 'Нет связи, попробуйте ещё раз.'; });
  }

  fromProvider().then(function () {
    if (!S.session && S.step > 0) S.step = 0;
    render();
  });
})();
