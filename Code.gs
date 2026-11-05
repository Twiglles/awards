/** @OnlyCurrentDoc */
var VK_CLIENT_ID = '54878572';
var SESSION_SEC = 21600;

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), s = ss.getSheetByName('Голоса');
  if (!s) { s = ss.insertSheet('Голоса'); s.appendRow(['voter', 'name', 'time', 'choices']); s.setFrozenRows(1); s.getRange('A:A').setNumberFormat('@'); }
  return s;
}
function doGet() { return out({ ok: true, app: 'golos' }); }

function doPost(e) {
  var b; try { b = JSON.parse(e.postData.contents); } catch (x) { return out({ error: 'bad' }); }
  if (b.action === 'auth') return out(auth(b));
  if (b.action === 'vote') return out(vote(b));
  return out({ error: 'bad action' });
}

function get(url, headers) {
  var r = UrlFetchApp.fetch(url, { headers: headers || {}, muteHttpExceptions: true });
  return r.getResponseCode() === 200 ? JSON.parse(r.getContentText()) : null;
}
function post(url, payload) {
  var r = UrlFetchApp.fetch(url, { method: 'post', payload: payload, muteHttpExceptions: true });
  return r.getResponseCode() === 200 ? JSON.parse(r.getContentText()) : null;
}

function identity(b) {
  if (b.provider === 'ya') {
    var u = get('https://login.yandex.ru/info?format=json', { Authorization: 'OAuth ' + b.token });
    return u && u.id ? { key: 'ya:' + u.id, name: u.first_name || u.display_name || '' } : null;
  }
  if (b.provider === 'vk') {
    var t = post('https://id.vk.com/oauth2/auth', {
      grant_type: 'authorization_code', code: b.code, code_verifier: b.verifier,
      redirect_uri: b.redirect, client_id: VK_CLIENT_ID, device_id: b.device_id, state: Utilities.getUuid()
    });
    if (!t || !t.user_id) return null;
    var name = '';
    try {
      var i = post('https://id.vk.com/oauth2/user_info', { access_token: t.access_token, client_id: VK_CLIENT_ID });
      name = i && i.user ? i.user.first_name || '' : '';
    } catch (x) {}
    return { key: 'vk:' + t.user_id, name: name };
  }
  return null;
}

function hasVoted(key) {
  var c = CacheService.getScriptCache();
  if (c.get('v_' + key)) return true;
  var s = sheet();
  if (s.getLastRow() < 2) return false;
  var f = s.getRange(2, 1, s.getLastRow() - 1, 1).createTextFinder(key).matchEntireCell(true).findNext();
  if (f) c.put('v_' + key, '1', SESSION_SEC);
  return !!f;
}

function auth(b) {
  var id = identity(b);
  if (!id) return { error: 'auth' };
  var t = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('t_' + t, JSON.stringify(id), SESSION_SEC);
  return { session: t, name: id.name, voted: hasVoted(id.key) };
}

function vote(b) {
  var c = CacheService.getScriptCache(), j = c.get('t_' + b.token);
  if (!j) return { error: 'auth' };
  var id = JSON.parse(j), ch = {};
  Object.keys(b.choices || {}).slice(0, 50).forEach(function (k) { ch[String(k).slice(0, 40)] = String(b.choices[k]).slice(0, 40); });
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (hasVoted(id.key)) return { error: 'voted' };
    sheet().appendRow([id.key, id.name, new Date(), JSON.stringify(ch)]);
    c.put('v_' + id.key, '1', SESSION_SEC);
  } finally { lock.releaseLock(); }
  return { ok: true };
}
