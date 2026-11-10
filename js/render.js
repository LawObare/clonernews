// render.js
// Owner: Person B
// Turns items into DOM: posts, polls, comments, nested replies, collapse.

function fillMeta(art, it) {
  const who = it.by || 'unknown';
  art.querySelector('.stats').textContent =
    it.type === 'job' ? `${who} ${ago(it.time)}` : `${it.score ?? 0} points by ${who} ${ago(it.time)}`;
  const n = it.descendants || 0;
  art.querySelector('.ctoggle').textContent = `${n} comment${n === 1 ? '' : 's'}`;
}

function renderPost(it) {
  const art = el('article', 'post');
  art.dataset.id = it.id;

  const title = el('div', 'title');
  title.append(el('span', 'badge', it.type));
  const a = el('a', '', it.title || '(untitled)');
  a.href = it.url || `${HN}/item?id=${it.id}`;
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  title.append(a);
  if (it.url) {
    try { title.append(el('span', 'host', `(${new URL(it.url).hostname.replace(/^www\./, '')})`)); } catch { /* bad url */ }
  }

  const meta = el('div', 'meta');
  const toggle = el('button', 'ctoggle');
  meta.append(el('span', 'stats'), ' | ', toggle);
  art.append(title, meta);

  if (it.text) { const d = el('div', 'text'); d.append(clean(it.text)); art.append(d); }

  if (it.type === 'poll' && it.parts) {
    const poll = el('div', 'poll');
    art.append(poll);
    getItems(it.parts).then(({ items }) => {
      const total = items.reduce((s, o) => s + (o.score || 0), 0) || 1;
      for (const o of items) {
        const row = el('div', 'opt');
        const bar = el('i'); bar.style.width = `${Math.round((o.score || 0) / total * 100)}%`;
        row.append(bar, el('span', '', `${o.text.replace(/<[^>]*>/g, '')} (${o.score || 0} points)`));
        poll.append(row);
      }
    });
  }

  const box = el('div', 'comments');
  box.hidden = true;
  art.append(box);
  toggle.onclick = () => {
    box.hidden = !box.hidden;
    if (box.dataset.init) return;
    box.dataset.init = '1';
    const fresh = cache.get(it.id) || it;
    if (fresh.kids && fresh.kids.length) kidsLoader(fresh, box);
    else box.append(el('p', 'empty', 'No comments yet.'));
  };

  fillMeta(art, it);
  return art;
}

function renderComment(c) {
  const d = el('div', 'comment');
  d.dataset.id = c.id;
  d.dataset.parent = c.parent;

  const head = el('div', 'meta');
  const fold = el('button', '', '[–]');
  fold.onclick = () => { d.classList.toggle('folded'); fold.textContent = d.classList.contains('folded') ? '[+]' : '[–]'; };
  head.append(fold, ` ${c.by || 'unknown'} ${ago(c.time)}`);

  const body = el('div', 'text');
  body.append(clean(c.text));
  d.append(head, body);

  if (c.kids && c.kids.length) {
    const replies = el('div', 'replies');
    const rbtn = el('button', 'rbtn', `${c.kids.length} repl${c.kids.length === 1 ? 'y' : 'ies'}`);
    rbtn.onclick = () => { rbtn.remove(); kidsLoader(c, replies); };
    d.append(rbtn, replies);
  }
  return d;
}

// Loads a parent's children in chunks. Item ids grow with creation time, so sorting ids descending is newest first.
function kidsLoader(parent, box) {
  const kids = [...parent.kids].sort((a, b) => b - a);
  const seen = new Set();
  let pos = 0;
  const more = el('button', 'rbtn');
  const load = async () => {
    more.disabled = true; more.textContent = 'loading…';
    const { items, failed } = await getItems(kids.slice(pos, pos + CHUNK));
    for (const c of items) {
      if (c.parent !== parent.id || seen.has(c.id)) continue;   // must belong to this parent
      seen.add(c.id);
      box.insertBefore(renderComment(c), more);
    }
    more.disabled = false;
    if (failed.length) { more.textContent = `${failed.length} failed to load, retry`; return; }
    pos += CHUNK;
    if (pos < kids.length) more.textContent = `load more (${kids.length - pos} left)`;
    else more.remove();
  };
  more.onclick = load;
  box.append(more);
  load();
}
