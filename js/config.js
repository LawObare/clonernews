const API = 'https://hacker-news.firebaseio.com/v0';
const HN = 'https://news.ycombinator.com';
const FEEDS = { new: 'newstories', jobs: 'jobstories', ask: 'askstories', show: 'showstories' };
// HN has no polls endpoint and polls are rare, so the polls tab reads this list. Verify each id with curl (type must be "poll").
const POLL_IDS = [126809];
const PAGE = 20, CHUNK = 10, POLL_MS = 5000;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => document.querySelector(s);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
