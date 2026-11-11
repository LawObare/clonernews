const API = 'https://hacker-news.firebaseio.com/v0';
const HN = 'https://news.ycombinator.com';
// The API has no dedicated poll list. The Polls view scans new stories in small batches.
const FEEDS = { new: 'newstories', jobs: 'jobstories', polls: 'newstories', ask: 'askstories', show: 'showstories' };
const PAGE = 20, CHUNK = 10, POLL_MS = 5000;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
