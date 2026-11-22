# Questions for a Dumbass

A quiz game to revise for exams. One category per course.

Open `index.html` in a browser, or use the GitHub Pages link of this repo.

## Modes

- **The Show**: three rounds (Quick Fire, The Ladder, The Final) with a score.
- **Training**: pick themes, no timer, explanation after every answer.
- **Mock exams** (Machine Learning): 30 new questions per mock, 2 minutes each. The Show never uses them.
- **My mistakes**: only the questions you got wrong last time.

**Host mode** (switch on the course page): each question shows alone so a host can read it out loud; clicking **Start** (or Space / Enter) shows the answers and starts a 30 s timer. Open questions show the answer box, no timer.

Progress is saved in the browser (localStorage).

## Add a course

1. Copy `data/research-methods.js` and declare the course with its sessions and themes.
2. Add question files that call `QFD.add("course-id", [...])`:
   - `m(theme, question, [correct, wrong, wrong, wrong], explanation, source, code?)`: the first option is always the correct one, options are shuffled on screen.
   - `op(theme, question, [key points], modelAnswer, source)`: open question, self-graded against the key points.
   - Optional course settings: `none: true` (adds "None of the above" as a fifth, always-last option), `mocks: [theme ids]`, `legend`.
   - Optional question wrappers: `calc(...)` (2 min timer), `hard(q)` (can come up in The Final when there are no open questions), `withFig(svg, q)`.
3. Add the `<script>` tags in `index.html`.
