# Machine Learning course: design

## Intent
Revise for the ML midterm inside the existing game: concept questions per chapter, plus three original mock exams.

## Goals
- Scope: bias-variance, linear regression, gradient descent, Ridge/Lasso, Naive Bayes, decision and regression trees (slides 1-248).
- About 150 chapter questions on concepts, never on what a given slide shows. A needed table or chart is included in the question.
- 3 mocks of 30 new questions with the practice exam's format, difficulty and topic mix (5 / 3 / 6 / 5 / 5 / 6).
- Five options, "None of the above" always last and sometimes correct.
- 2 minutes for calculations and for each mock question.

## Non-goals
- Ensembles and anything later. No slide images, course files or copied exam questions in the repo.
- No change to how Research Methods plays.

## Approaches
- **Extend the current game (picked):** small opt-in course settings in the engine.
- Separate app: duplicates the engine.
- Data only: cannot do five options, and The Final would be empty without open questions.

## Decisions
- The Show and the default Training selection leave mock questions out, so mocks stay unseen.
- The Final uses hard MCQs when a course has no open question.
- Regression-tree questions state whether the SSR is summed or weighted.
