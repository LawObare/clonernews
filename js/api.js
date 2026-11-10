const cache = new Map();     // id -> item payload
const inflight = new Map();  // id -> pending promise, so one id is never fetched twice at once

async function getJSON(path, tries = 3) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`${API}/${path}.json`);
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      if (i >= tries - 1) throw e;
      await sleep(400 * 2 ** i);   // exponential backoff
    }
  }
}

function getItem(id, force = false) {
  if (!force && cache.has(id)) return Promise.resolve(cache.get(id));
  if (inflight.has(id)) return inflight.get(id);
  const p = getJSON(`item/${id}`)
    .then(it => (cache.set(id, it), it))
    .finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

// Fetches ids with a small concurrency cap. A missing/deleted item is skipped; a network failure is reported.
async function getItems(idList, limit = 6) {
  const out = new Array(idList.length);
  let i = 0;
  const worker = async () => {
    while (i < idList.length) {
      const n = i++;
      try { out[n] = await getItem(idList[n]); } catch { /* left undefined */ }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, idList.length) }, worker));
  return {
    items: out.filter(it => it && !it.deleted && !it.dead),
    failed: idList.filter((_, n) => out[n] === undefined),
  };
}
