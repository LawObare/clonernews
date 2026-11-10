// feed.js
// Owner: Person C
// Feed tabs, progressive loading, IntersectionObserver, loading/error/empty states.

const feedEl = $('#feed'), sentinel = $('#sentinel');
let feed = 'new', ids = [], pos = 0, busy = false, errored = false, gen = 0;
const rendered = new Set();

function addPost(it) {
  if (rendered.has(it.id)) return;
  rendered.add(it.id);
  feedEl.append(renderPost(it));
}

async function loadFeed(name) {
  const my = ++gen;
  feed = name; ids = []; pos = 0; busy = false; errored = false; pending = [];
  rendered.clear(); feedEl.replaceChildren(); hideBanner();
  status('Loading…');
  try {
    const list = await getJSON(FEEDS[name]);
    if (my !== gen) return;
    ids = list.sort((a, b) => b - a);   // newest first
  } catch {
    return status('Could not load this feed.', 'retry', () => loadFeed(name));
  }
  loadMore();
}

async function loadMore() {
  if (busy || errored || pos >= ids.length) return;
  busy = true;
  const my = gen;
  status('Loading…');
  const { items, failed } = await getItems(ids.slice(pos, pos + PAGE));
  if (my !== gen) return;
  items.forEach(addPost);
  busy = false;
  if (failed.length) {
    errored = true;
    return status(`${failed.length} item${failed.length === 1 ? '' : 's'} failed to load.`, 'retry', () => { errored = false; loadMore(); });
  }
  pos += PAGE;
  if (!ids.length) status('Nothing here yet.');
  else if (pos >= ids.length) status('You have reached the end of the feed.');
  else status('', 'more', loadMore);
  io.unobserve(sentinel); io.observe(sentinel);   // re-check in case the sentinel is still on screen
}

const io = new IntersectionObserver(es => { if (es[0].isIntersecting) loadMore(); }, { rootMargin: '400px' });
io.observe(sentinel);
