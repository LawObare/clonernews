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
  if (name === 'polls') io.unobserve(sentinel); else io.observe(sentinel);
  status('Loading…');
  try {
    const list = await getJSON(FEEDS[name]);
    if (my !== gen) return;
    ids = list.sort((a, b) => b - a);   // newest first
  } catch {
    return status('Could not load this feed.', 'retry', () => loadFeed(name));
  }
  if (!ids.length) {
    status(name === 'polls' ? 'No polls are currently available.' : 'Nothing here yet.');
    return;
  }
  loadMore();
}

async function loadMore() {
  if (busy || errored || pos >= ids.length) return;
  busy = true;
  const my = gen;
  status('Loading…');
  const batch = ids.slice(pos, pos + PAGE);
  const { items, failed } = await getItems(batch);
  if (my !== gen) return;
  const visibleItems = feed === 'polls' ? items.filter(it => it.type === 'poll') : items;
  visibleItems.forEach(addPost);
  busy = false;
  if (failed.length) {
    errored = true;
    return status(`${failed.length} item${failed.length === 1 ? '' : 's'} failed to load.`, 'retry', () => { errored = false; loadMore(); });
  }
  pos += batch.length;
  if (feed === 'polls') {
    if (pos >= ids.length) {
      status(rendered.size ? 'You have reached the end of the available polls.' : 'No polls were found in the latest stories.');
    } else {
      status(rendered.size ? '' : 'No polls in this batch.', rendered.size ? 'find more polls' : 'search older stories', loadMore);
    }
    return;
  }
  if (!rendered.size && pos >= ids.length) status('Nothing here yet.');
  else if (pos >= ids.length) status('You have reached the end of the feed.');
  else status('', 'more', loadMore);
  io.unobserve(sentinel); io.observe(sentinel);   // re-check in case the sentinel is still on screen
}

const onSentinel = throttle(es => {
  if (feed !== 'polls' && es[0].isIntersecting) loadMore();
}, 250);
const io = new IntersectionObserver(onSentinel, { rootMargin: '400px' });
io.observe(sentinel);
