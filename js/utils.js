function ago(t) {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - t));
  const units = [[86400, 'day'], [3600, 'hour'], [60, 'minute']];
  for (const [secs, name] of units) {
    if (s >= secs) { const n = Math.floor(s / secs); return `${n} ${name}${n === 1 ? '' : 's'} ago`; }
  }
  return 'just now';
}

// HN text fields contain HTML, so keep a small whitelist and drop everything else.
const OK = new Set(['P', 'A', 'I', 'EM', 'B', 'PRE', 'CODE', 'BR']);
function clean(html) {
  const t = document.createElement('template');
  t.innerHTML = html || '';
  (function walk(node) {
    for (const c of [...node.childNodes]) {
      if (c.nodeType === 3) continue;
      if (c.nodeType !== 1 || !OK.has(c.tagName)) { c.replaceWith(document.createTextNode(c.textContent || '')); continue; }
      const href = c.tagName === 'A' ? c.getAttribute('href') : null;
      for (const a of [...c.attributes]) c.removeAttribute(a.name);
      if (href && /^https?:\/\//i.test(href)) { c.href = href; c.rel = 'noopener noreferrer nofollow'; c.target = '_blank'; }
      walk(c);
    }
  })(t.content);
  return t.content;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 3000);
}

function status(msg, btnLabel, fn) {
  const s = $('#status');
  s.replaceChildren(msg);
  if (btnLabel) { const b = el('button', '', btnLabel); b.onclick = fn; s.append(' ', b); }
}

// Runs fn at most once per ms; a call made too early is delayed, not dropped.
function throttle(fn, ms) {
  let last = 0, t;
  return (...a) => {
    const wait = ms - (Date.now() - last);
    clearTimeout(t);
    if (wait <= 0) { last = Date.now(); fn(...a); }
    else t = setTimeout(() => { last = Date.now(); fn(...a); }, wait);
  };
}

// Runs fn only after calls have stopped for ms.
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
