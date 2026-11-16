QFD.course({
  id: "research-methods",
  name: "Research Methods",
  icon: "🔬",
  blurb: "Research questions, literature review, research design, SQL, surveys, scraping and APIs.",
  exam: "Exam: 60 minutes, MCQs + 2 open questions, sessions 1 to 4.",
  sessions: [
    {
      id: "s1", short: "Session 1", name: "Session 1 · Introduction to research",
      themes: [
        { id: "research", name: "What is research? Topics" },
        { id: "rq", name: "Research questions & variables" },
        { id: "paper", name: "Reading a research paper" },
      ],
    },
    {
      id: "s2", short: "Session 2", name: "Session 2 · Literature review, design, pitch",
      themes: [
        { id: "litsearch", name: "Literature review: searching" },
        { id: "litwrite", name: "Literature review: reviewing & writing" },
        { id: "design", name: "Research design & the 4 aims" },
        { id: "variables", name: "Hypotheses & variable roles" },
        { id: "pitch", name: "Research pitch" },
      ],
    },
    {
      id: "s3", short: "Session 3", name: "Session 3 · Databases, SQL, surveys",
      themes: [
        { id: "er", name: "Databases & ER model" },
        { id: "sql", name: "SQL: SELECT, WHERE, GROUP BY" },
        { id: "joins", name: "Joins, subqueries, SQL in Python" },
        { id: "survey", name: "Survey design" },
      ],
    },
    {
      id: "s4", short: "Session 4", name: "Session 4 · HTML, web scraping, APIs",
      themes: [
        { id: "html", name: "HTML" },
        { id: "scraping", name: "Web scraping" },
        { id: "api", name: "APIs" },
      ],
    },
  ],
});

/* Courses not built yet: shown as locked cards on the home screen. */
[
  ["machine-learning", "Machine Learning", "🤖"],
  ["data-mining", "Data Mining", "⛏️"],
  ["data-visualization", "Data Visualization", "📊"],
  ["stats-models", "Statistical Models", "📈"],
  ["python", "Python Programming", "🐍"],
].forEach(([id, name, icon]) => QFD.course({ id, name, icon, locked: true }));
