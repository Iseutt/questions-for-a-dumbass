# Host mode — design

## Intent
A host reads each question aloud to the player(s), then clicks **Start**. Only then do the answers appear and a 30 s timer runs. Makes the game playable as a live quiz show on one screen.

## Goals
- Toggle "Host mode" on the course page, off by default, remembered in the browser.
- When on, every question first shows alone (tags, question text, code) with a **Start** button.
- MCQ: Start reveals the options and starts a 30 s timer, in every mode (Show rounds, Training, My mistakes). Ladder uses 30 s too.
- Open questions: Start reveals the textarea + "Reveal the model answer"; no timer.
- Space / Enter triggers Start.

## Non-goals
- No separate host device, no backend. Same screen only.
- Solo play (host mode off) unchanged.

## Approaches
- **Same screen, toggle in existing app (picked):** small change to `renderQ` in `js/app.js`, stays a static site.
- Host on own device: needs realtime backend; rejected, host is on same screen.

## Builder notes
- Setting stored in existing localStorage `store` (`store.host`).
- Quick Fire speed bonus keeps using time left on the 30 s timer.
