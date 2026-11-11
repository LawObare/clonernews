// main.js
// Owner: Person C
// Wires up the tabs and starts the app.

let requestedFeed = feed;
const requestFeed = debounce(name => {
  if (name !== feed) loadFeed(name);
}, 150);

document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  if (a.dataset.feed === requestedFeed) return;
  requestedFeed = a.dataset.feed;
  document.querySelector('nav .on').classList.remove('on');
  a.classList.add('on');
  requestFeed(requestedFeed);
}));

loadFeed(feed);
schedule();
