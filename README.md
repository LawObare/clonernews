# Hacker News Reader

A responsive front page for following Hacker News stories and discussions. The reader loads data directly from the public Hacker News API and updates while the page is open.

## Run locally

You need Python 3 and an internet connection. There are no packages to install or build steps.

From the project directory, start a static web server:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser. Stop the server with `Ctrl+C`.

Use the **Stories**, **Jobs**, and **Polls** links in the header to switch feeds. The Polls view searches the recent story list in small batches because the API has no dedicated poll-list endpoint. Story comments can be expanded from each card.

## Features

- New stories, job listings, and polls from Hacker News
- Progressive loading as you scroll
- Live checks for new stories and changes to scores and comment counts
- Expandable story discussions and nested replies
- Responsive layout for desktop and mobile screens

## Project layout

- `index.html` — page structure and script loading order
- `css/style.css` — responsive editorial layout and story styles
- `js/config.js` — Hacker News API settings and feed configuration
- `js/api.js` — API requests and item cache
- `js/utils.js` — shared DOM and formatting helpers
- `js/render.js` — story, poll, and comment rendering
- `feed.js` — feed selection, loading, and pagination
- `live.js` — update polling and new story notifications
- `main.js` — application startup and feed navigation

The app has no backend. It requests story data from the public Hacker News Firebase API in the browser.
