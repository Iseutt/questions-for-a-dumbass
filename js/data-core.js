/* Question registry. Each course file calls QFD.course(), each question file calls QFD.add(). */
(function () {
  "use strict";
  const QFD = (window.QFD = { courses: [], byId: {} });

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
      q.id = courseId + ":" + hash(q.q + (q.code || ""));
      c.questions.push(q);
    });
  };

  /* MCQ: the FIRST option is always the correct one (options are shuffled at display time). */
  window.m = (t, q, o, e, r, code) => ({ type: "mcq", t, q, o, e, r, code });
  /* Open question: keys = points a good answer must contain, model = full model answer. */
  window.op = (t, q, keys, model, r, code) => ({ type: "open", t, q, keys, model, r, code });
})();
