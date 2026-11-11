// Live data polling, new-items banner, merge without losing scroll place.

let pending = [], delay = POLL_MS, lastPoll = Date.now(), timer, polling = false;

function setLive(ok) {
  $('#live').textContent = ok ? `live, updated ${new Date().toLocaleTimeString()}` : 'offline, retrying…';
}

function hideBanner() { $('#banner').hidden = true; document.title = 'Hacker News Reader'; }

async function showBanner() {
  const b = $('#banner');
  if (!pending.length) return hideBanner();
  document.title = `(${pending.length}) Hacker News Reader`;
  const { items } = await getItems(pending.slice(0, 3));
  const noun = feed === 'jobs' ? 'job' : feed === 'polls' ? 'poll' : 'item';
  b.replaceChildren(`${pending.length} new ${noun}${pending.length === 1 ? '' : 's'}`);
  const btn = el('button', '', 'show');
  btn.onclick = mergePending;
  const ul = el('ul');
  items.forEach(it => ul.append(el('li', '', it.title || `(${it.type})`)));
  b.append(btn, ul);
  b.hidden = false;
}

async function mergePending() {
  while (busy) await sleep(100);
  const take = pending;
  const { items, failed } = await getItems(take);
  if (failed.length) return toast(`Could not load ${failed.length} new items, try again`);
  pending = [];
  // remember where the reader is so the list doesn't jump
  const anchor = [...feedEl.children].find(c => c.getBoundingClientRect().bottom > 0);
  const before = anchor && anchor.getBoundingClientRect().top;
  ids = [...take, ...ids];
  pos += take.length;
  const frag = document.createDocumentFragment();
  for (const it of items) if (!rendered.has(it.id)) { rendered.add(it.id); frag.append(renderPost(it)); }
  feedEl.prepend(frag);
  if (anchor && window.scrollY > 0) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
  hideBanner();
}

async function poll() {
  if (polling || document.hidden) return;
  polling = true;
  const my = gen;
  lastPoll = Date.now();
  try {
    const [upd, latest] = await Promise.all([getJSON('updates', 1), getJSON(FEEDS[feed], 1)]);
    if (my !== gen) return;
    delay = POLL_MS;
    setLive(true);

    // refresh scores and comment counts of posts already on screen
    const changed = (upd.items || []).filter(id => rendered.has(id)).slice(0, 15);
    let updated = 0;
    await Promise.all(changed.map(async id => {
      const old = cache.get(id);
      const it = await getItem(id, true).catch(() => null);
      if (it && old && (it.score !== old.score || it.descendants !== old.descendants)) {
        updated++;
        const art = feedEl.querySelector(`[data-id="${id}"]`);
        if (art) fillMeta(art, it);
      }
    }));
    if (my !== gen) return;

    // new submissions newer than the head of the list
    if (ids.length) {
      const head = ids[0];
      let fresh = latest.filter(id => id > head).sort((a, b) => b - a);
      if (feed === 'polls' && fresh.length) {
        const { items } = await getItems(fresh);
        fresh = items.filter(it => it.type === 'poll').map(it => it.id);
      }
      if (my !== gen) return;
      const added = fresh.length - pending.length;
      pending = fresh;
      await showBanner();
      if (added > 0) {
        const noun = feed === 'jobs' ? 'job' : feed === 'polls' ? 'poll' : 'item';
        toast(`${added} new ${noun}${added === 1 ? '' : 's'}`);
      }
    }
    if (updated) toast(`${updated} post${updated === 1 ? '' : 's'} updated`);
  } catch {
    delay = Math.min(delay * 2, 60000);
    setLive(false);
  } finally {
    polling = false;
    schedule();
  }
}

function schedule() {
  clearTimeout(timer);
  timer = null;
  if (document.hidden || polling) return;
  const wait = Math.max(0, delay - (Date.now() - lastPoll));
  timer = setTimeout(() => {
    timer = null;
    if (!document.hidden) poll();
  }, wait);
}

const handleVisibilityChange = debounce(() => {
  if (document.hidden) { clearTimeout(timer); timer = null; return; }
  if (Date.now() - lastPoll >= delay) poll(); else schedule();
}, 150);
document.addEventListener('visibilitychange', handleVisibilityChange);
