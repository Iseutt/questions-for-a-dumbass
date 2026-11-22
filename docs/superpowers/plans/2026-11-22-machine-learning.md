# Machine Learning Course Implementation Plan

**Goal:** Add the Machine Learning course and three mock exams to the game.

**Spec:** `docs/superpowers/specs/2026-11-22-machine-learning-design.md`

**Architecture:** Course options `none`, `mocks`, `legend`; question flags `calc`, `hard`, `topic`, `fig`. Static site, no dependencies.

## Review Focus
- "None of the above" is last after every shuffle, including when it is correct.
- E and 5 answer the fifth option, and do nothing in a four-option question.
- Mock questions never appear in The Show.
- Host mode keeps its gate and gives calculations 2 minutes.
- Research Methods keeps four options, its timers and its open-question Final.

## Tasks
- [x] Engine: options, timers, Final, mock launcher, figures (`js/`, `css/`).
- [x] Chapters: `data/ml-c1.js` to `data/ml-c4.js`.
- [x] Mocks: `data/ml-mock1.js` to `data/ml-mock3.js`.
- [x] Verify: schema, recomputed numeric answers, similarity to the practice exam, browser run of both courses.
- [x] Commit, push to `main`, check the live site.
