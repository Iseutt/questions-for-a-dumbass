QFD.course({
  id: "machine-learning",
  name: "Machine Learning",
  icon: "🤖",
  blurb: "Bias-variance, linear regression, gradient descent, Ridge and Lasso, Naive Bayes, decision trees.",
  exam: "Midterm: 60 minutes, MCQs with five options, up to decision and regression trees.",
  legend: "Sources shown after each answer: “Slides 31-34” = the slide numbers printed on the course deck, numbered 1 to 248 across the four chapters.",
  none: true,
  mocks: ["ml-mock1", "ml-mock2", "ml-mock3"],
  sessions: [
    {
      id: "ml1", short: "Chapter 1", name: "Chapter 1 · Foundations and linear regression",
      themes: [
        { id: "ml-bv", name: "ML basics & bias-variance" },
        { id: "ml-lr", name: "Linear regression" },
      ],
    },
    {
      id: "ml2", short: "Chapter 2", name: "Chapter 2 · Optimisation and regularisation",
      themes: [
        { id: "ml-gd", name: "Gradient descent" },
        { id: "ml-reg", name: "Ridge & Lasso" },
      ],
    },
    {
      id: "ml3", short: "Chapter 3", name: "Chapter 3 · Classification",
      themes: [
        { id: "ml-nb", name: "Naive Bayes" },
        { id: "ml-dt", name: "Decision trees" },
      ],
    },
    {
      id: "ml4", short: "Chapter 4", name: "Chapter 4 · Trees for regression",
      themes: [{ id: "ml-rt", name: "Regression trees" }],
    },
    {
      id: "mlmock", short: "Mock exam", name: "Mock exams · 3 × 30 questions",
      themes: [
        { id: "ml-mock1", name: "Mock 1" },
        { id: "ml-mock2", name: "Mock 2" },
        { id: "ml-mock3", name: "Mock 3" },
      ],
    },
  ],
});

/* Original figures used inside questions. Labels are neutral so they never give the answer away. */
QFD.mlFig = (() => {
  const svg = (label, body, h = 210) => `<svg viewBox="0 0 420 ${h}" role="img" aria-label="${label}">${body}</svg>`;
  const text = (x, y, s) => `<text x="${x}" y="${y}">${s}</text>`;
  const line = (d, color = "currentColor", extra = "") => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" ${extra}/>`;
  const dot = (x, y, r = 4, color = "#ffd23f") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  const axes = line("M40 15V175H405", "#a9a2c7");

  return {
    complexity: svg("Two error curves against model complexity. P always falls. Q falls, then rises.",
      axes + line("M55 45C130 115 240 150 395 165", "#3ddc97") + line("M55 30C140 130 250 145 395 35", "#ff5d73") +
      text(372, 155, "P") + text(372, 35, "Q") + text(10, 12, "Error") + text(160, 200, "Model complexity")),

    target: svg("A target with shots tightly grouped, far from the centre.",
      [90, 62, 34].map((r) => `<circle cx="210" cy="105" r="${r}" fill="none" stroke="#a9a2c7" stroke-width="2"/>`).join("") +
      dot(210, 105, 9, "#ff5d73") + [[262, 48], [270, 52], [265, 58], [275, 45], [258, 54], [272, 62]].map((p) => dot(...p)).join("")),

    bounce: svg("Gradient descent steps jumping from side to side of a valley, climbing higher each time.",
      axes + line("M80 20Q220 320 360 20", "#9b7bff") + line("M190 163L260 158L160 142L305 115L106 70L355 31", "#ff5d73") +
      dot(190, 163) + dot(355, 31) + text(138, 172, "start") + text(10, 12, "Loss") + text(180, 200, "Parameter")),

    threshold: svg("Penalised coefficient against OLS coefficient. The curve is flat at zero around the origin.",
      line("M40 100H390M210 15V185", "#a9a2c7") + line("M125 185L295 15", "#a9a2c7", 'stroke-dasharray="5 5"') +
      line("M75 185L160 100H260L345 15", "#ffd23f") + text(305, 120, "OLS estimate") + text(80, 18, "Penalised estimate") + text(60, 208, "Dashed line: no penalty"), 220),

    circle: svg("A circular constraint region touched by an elliptical loss contour away from both axes.",
      line("M40 130H390M150 15V205", "#a9a2c7") + '<circle cx="150" cy="130" r="60" fill="none" stroke="#3ddc97" stroke-width="2.5"/>' +
      '<ellipse cx="256" cy="68" rx="70" ry="45" fill="none" stroke="#ff5d73" stroke-width="2.5"/>' + dot(195, 90) +
      text(375, 150, "β₁") + text(125, 25, "β₂"), 215),

    steps: svg("A prediction made of horizontal steps over the training range that stays flat afterwards.",
      axes + line("M45 40H100V70H160V105H215V135H260V150H395", "#ffd23f") + line("M270 15V175", "#a9a2c7", 'stroke-dasharray="5 5"') +
      text(95, 200, "training range") + text(290, 200, "new range") + text(10, 12, "Prediction")),

    regions: svg("A square feature space cut by one full vertical line and one horizontal line on the right side only.",
      '<rect x="100" y="10" width="220" height="170" fill="none" stroke="#a9a2c7" stroke-width="2"/>' +
      line("M190 10V180M190 80H320", "#ffd23f") + text(138, 100, "A") + text(250, 50, "B") + text(250, 135, "A") + text(185, 202, "x = 4") + text(330, 84, "y = 6")),
  };
})();
