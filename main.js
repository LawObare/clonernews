// main.js
// Owner: Person C
// Wires up the tabs and starts the app.

document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  if (a.dataset.feed === feed) return;
  document.querySelector('nav .on').classList.remove('on');
  a.classList.add('on');
  loadFeed(a.dataset.feed);
}));

loadFeed(feed);
schedule();
