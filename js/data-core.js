/* Question registry. Each course file calls QFD.course(), each question file calls QFD.add(). */
(function () {
  "use strict";
  const QFD = (window.QFD = { courses: [], byId: {} });

  QFD.NONE = "None of the above";

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  QFD.course = function (c) {
    c.questions = [];
    c.themeMap = {};
    (c.sessions || []).forEach((s) =>
      s.themes.forEach((t) => (c.themeMap[t.id] = { id: t.id, name: t.name, session: s.short, sessionId: s.id }))
    );
    QFD.courses.push(c);
    QFD.byId[c.id] = c;
  };

  QFD.add = function (courseId, list) {
    const c = QFD.byId[courseId];
    list.forEach((q) => {
      // Courses with none: true always offer "None of the above" as the extra last option.
      if (c.none && q.type === "mcq" && !q.o.includes(QFD.NONE)) q.o.push(QFD.NONE);
      q.id = courseId + ":" + hash(q.q + (q.code || ""));
      c.questions.push(q);
    });
  };

  /* MCQ: the FIRST option is always the correct one (options are shuffled at display time). */
  window.m = (t, q, o, e, r, code) => ({ type: "mcq", t, q, o, e, r, code });
  /* Calculation: an MCQ with a 2 minute timer. */
  window.calc = (...a) => Object.assign(window.m(...a), { calc: true });
  /* Hard: eligible for The Final in courses without open questions. */
  window.hard = (q) => Object.assign(q, { hard: true });
  /* Attach an SVG from the course's own files. */
  window.withFig = (fig, q) => Object.assign(q, { fig });
  /* Open question: keys = points a good answer must contain, model = full model answer. */
  window.op = (t, q, keys, model, r, code) => ({ type: "open", t, q, keys, model, r, code });
})();
