/* Questions for a Dumbass: game engine. No dependencies. */
(function () {
  "use strict";

  const $app = document.getElementById("app");
  const KEY = "qfd-v1";
  const LADDER = [10, 20, 30, 40];
  const QUICK_TIME = 30, LADDER_TIME = 40, OPEN_PTS = 40;
  const HOST_TIME = 30; // host mode: MCQs get 30 s once the host clicks Start, unless they are long
  const LONG_TIME = 120; // calculations, mock exams, MCQ finals
  const LETTERS = "ABCDE";

  // ---------- storage ----------
  let store = { stats: {}, best: {}, host: false };
  try { store = Object.assign(store, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* private mode */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } }
  function record(q, ok) {
    const s = store.stats[q.id] || (store.stats[q.id] = { s: 0, r: 0, last: 0 });
    s.s++; if (ok) s.r++; s.last = ok ? 1 : 0;
    save();
  }

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const pct = (x) => Math.round(x * 100);
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Unseen and last-wrong questions come up more often.
  // "None of the above" never moves from the last position.
  function options(q) {
    const all = q.o.map((t, i) => ({ t, ok: i === 0 })), last = (o) => o.t === QFD.NONE;
    return shuffle(all.filter((o) => !last(o))).concat(all.filter(last));
  }
  const figure = (q) => (q.fig ? `<figure class="fig">${q.fig}</figure>` : "");
  const isMock = (c, q) => (c.mocks || []).includes(q.t);
  function weight(q) { const s = store.stats[q.id]; return !s ? 3 : s.last ? 1 : 4; }
  function pick(pool, n) {
    pool = pool.slice(); const out = [];
    while (out.length < n && pool.length) {
      let tot = 0; const cum = pool.map((q) => (tot += weight(q)));
      const r = Math.random() * tot; let i = cum.findIndex((x) => x > r); if (i < 0) i = pool.length - 1;
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
  const mastered = (q) => !!(store.stats[q.id] && store.stats[q.id].last);
  const mastery = (qs) => (qs.length ? qs.filter(mastered).length / qs.length : 0);
  const mistakes = (c) => c.questions.filter((q) => store.stats[q.id] && !store.stats[q.id].last);

  let keyHandler = null;
  document.addEventListener("keydown", (e) => {
    if (!keyHandler || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "textarea" || tag === "input") return;
    keyHandler(e);
  });

  function screen(html) { stopTimer(); keyHandler = null; $app.innerHTML = html; window.scrollTo(0, 0); }
  function on(sel, fn) { $app.querySelectorAll(sel).forEach((el) => el.addEventListener("click", (e) => fn(el, e))); }

  // ---------- timer ----------
  let tHandle = null, tLeft = 0;
  function startTimer(sec, onOut) {
    stopTimer();
    const bar = document.getElementById("tbar"), num = document.getElementById("tnum");
    const t0 = performance.now(); tLeft = sec;
    tHandle = setInterval(() => {
      tLeft = Math.max(0, sec - (performance.now() - t0) / 1000);
      if (bar) { bar.style.width = (tLeft / sec) * 100 + "%"; bar.classList.toggle("low", tLeft < 8); }
      if (num) num.textContent = Math.ceil(tLeft);
      if (tLeft <= 0) { stopTimer(); onOut(); }
    }, 100);
  }
  function stopTimer() { if (tHandle) { clearInterval(tHandle); tHandle = null; } }

  // ---------- home ----------
  function home() {
    const cards = QFD.courses.slice().sort((a, b) => !!a.locked - !!b.locked).map((c) => {
      if (c.locked) {
        return `<div class="course locked"><span class="c-icon">${c.icon}</span><h3>${esc(c.name)}</h3><p>Coming soon</p><span class="lock">🔒</span></div>`;
      }
      const best = store.best[c.id];
      return `<button class="course" data-course="${c.id}">
        <span class="c-icon">${c.icon}</span><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p>
        <div class="meter"><i style="width:${pct(mastery(c.questions))}%"></i></div>
        <div class="c-foot"><span>${pct(mastery(c.questions))}% mastered · ${c.questions.length} questions</span><span>${best != null ? "Best show: " + best + " pts" : "Not played yet"}</span></div>
      </button>`;
    }).join("");
    screen(`
      <header class="hero">
        <p class="eyebrow">The quiz show with one contestant</p>
        <h1>Questions<br>for a <span class="stamp">Dumbass</span></h1>
        <p class="lead">Pick a course. Answer questions. Get told why you were wrong. Repeat until the exam is no longer scary.</p>
      </header>
      <h2 class="section">Choose your category</h2>
      <section class="courses">${cards}</section>
      <footer class="foot">Progress is saved in this browser only.</footer>`);
    on("[data-course]", (el) => course(QFD.byId[el.dataset.course]));
  }

  // ---------- course page ----------
  const setup = {};
  function course(c) {
    const st = setup[c.id] || (setup[c.id] = { themes: new Set(Object.keys(c.themeMap).filter((id) => !(c.mocks || []).includes(id))), type: "both", count: 20 });
    const byTheme = (id) => c.questions.filter((q) => q.t === id);
    const nMcq = c.questions.filter((q) => q.type === "mcq").length;
    const miss = mistakes(c).length;
    const best = store.best[c.id];

    const sessions = c.sessions.map((s) => `
      <div class="session">
        <div class="session-head"><h4>${esc(s.name)}</h4><button class="link" data-session="${s.id}">toggle all</button></div>
        <div class="chips">${s.themes.map((t) => {
          const qs = byTheme(t.id);
          return `<button class="chip" data-theme="${t.id}" aria-pressed="${st.themes.has(t.id)}">
            <span>${esc(t.name)}</span><small>${qs.length} q · ${pct(mastery(qs))}%</small>
            <span class="mini"><i style="width:${pct(mastery(qs))}%"></i></span></button>`;
        }).join("")}</div>
      </div>`).join("");

    const mocks = (c.mocks || []).map((id) => {
      const qs = byTheme(id), seen = qs.filter((q) => store.stats[q.id]).length;
      const state = seen === qs.length ? pct(mastery(qs)) + "% right last time" : seen ? seen + " / " + qs.length + " answered" : "Not taken yet";
      return `<button class="mode" data-mock="${id}"><h3>${esc(c.themeMap[id].name)}</h3><p>${qs.length} questions, 2 min each. ${state}.</p></button>`;
    }).join("");

    const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join("")}</div>`;

    screen(`
      <div class="bar"><button class="ghost" data-home>← Categories</button><div class="bar-mid"><strong>${c.icon} ${esc(c.name)}</strong><span>${esc(c.exam || "")}</span></div><div></div></div>
      <div class="stats">
        <div><b>${pct(mastery(c.questions))}%</b><span>mastered</span></div>
        <div><b>${nMcq}</b><span>MCQs</span></div>
        ${c.mocks ? `<div><b>${c.mocks.length}</b><span>mock exams</span></div>` : `<div><b>${c.questions.length - nMcq}</b><span>open questions</span></div>`}
        <div><b>${best != null ? best : "–"}</b><span>best show score</span></div>
      </div>
      <button class="host-toggle" data-host aria-pressed="${!!store.host}">
        <span class="sw" aria-hidden="true"></span>
        <span class="ht-text"><b>🎤 Host mode</b><small>A host reads each question out loud, then clicks Start to show the answers and a ${HOST_TIME} s timer${c.mocks ? " (2 min for calculations and mocks)" : ""}.</small></span>
      </button>
      <section class="modes">
        <button class="mode show" data-show><span class="m-icon">🏆</span><h3>The Show</h3><p>Three rounds: Quick Fire, The Ladder, The Final. About 15 minutes. Chase your best score.</p></button>
        <button class="mode" data-scroll><span class="m-icon">📚</span><h3>Training</h3><p>Pick themes, no timer, explanation after every answer. Use it to cover the whole course.</p></button>
        <button class="mode" data-mistakes ${miss ? "" : "disabled"}><span class="m-icon">🔁</span><h3>My mistakes</h3><p>${miss ? miss + " question" + (miss > 1 ? "s" : "") + " you got wrong last time." : "Nothing here yet. Go make some mistakes."}</p></button>
      </section>
      ${mocks ? `<section class="card"><h2>Mock exams</h2><p class="sub">New questions in the style of the practice exam. The Show never uses them, so each mock stays fresh.</p><div class="modes">${mocks}</div></section>` : ""}
      <section class="card" id="training">
        <h2>Training setup</h2>
        ${sessions}
        <div class="opts-row">
          ${nMcq < c.questions.length ? `<div><label>Question type</label>${seg("type", [["both", "MCQ + open"], ["mcq", "MCQ only"], ["open", "Open only"]], st.type)}</div>` : ""}
          <div><label>How many</label>${seg("count", [[10, "10"], [20, "20"], [40, "40"], [0, "All"]], st.count)}</div>
        </div>
        <div class="start-row"><span id="pool"></span><button class="btn big" data-train>Start training →</button></div>
      </section>
      <p class="legend">${esc(c.legend || "Sources shown after each answer: “S2 p.51” = Session 2 slides, PDF page 51.")}</p>
      <p class="foot"><button class="link danger" data-reset>Reset my progress for this course</button></p>`);

    const pool = () => c.questions.filter((q) => st.themes.has(q.t) && (st.type === "both" || q.type === st.type));
    function refresh() {
      const n = pool().length;
      document.getElementById("pool").textContent = n + " question" + (n === 1 ? "" : "s") + " in your selection";
      $app.querySelector("[data-train]").disabled = !n;
      $app.querySelectorAll(".chip").forEach((el) => el.setAttribute("aria-pressed", st.themes.has(el.dataset.theme)));
      $app.querySelectorAll(".seg").forEach((s) => s.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(st[s.dataset.seg]) === b.dataset.v)));
    }
    refresh();

    on("[data-home]", home);
    on("[data-host]", (el) => { store.host = !store.host; save(); el.setAttribute("aria-pressed", String(store.host)); });
    on("[data-show]", () => startShow(c));
    on("[data-mock]", (el) => startList(c, c.themeMap[el.dataset.mock].name, byTheme(el.dataset.mock), LONG_TIME));
    on("[data-scroll]", () => document.getElementById("training").scrollIntoView({ behavior: "smooth" }));
    on("[data-mistakes]", () => startList(c, "My mistakes", shuffle(mistakes(c))));
    on(".chip", (el) => { const id = el.dataset.theme; st.themes.has(id) ? st.themes.delete(id) : st.themes.add(id); refresh(); });
    on("[data-session]", (el) => {
      const ids = c.sessions.find((s) => s.id === el.dataset.session).themes.map((t) => t.id);
      const allOn = ids.every((id) => st.themes.has(id));
      ids.forEach((id) => (allOn ? st.themes.delete(id) : st.themes.add(id)));
      refresh();
    });
    on(".seg button", (el) => { const k = el.parentNode.dataset.seg; st[k] = k === "count" ? Number(el.dataset.v) : el.dataset.v; refresh(); });
    on("[data-train]", () => {
      const p = pool();
      startList(c, "Training", st.count ? pick(p, st.count) : shuffle(p));
    });
    on("[data-reset]", (el) => {
      if (el.dataset.armed) {
        c.questions.forEach((q) => delete store.stats[q.id]); delete store.best[c.id]; save(); course(c);
      } else { el.dataset.armed = "1"; el.textContent = "Click again to erase all progress for this course"; }
    });
  }

  // ---------- game state ----------
  let G = null;

  function startList(c, name, qs, timer = 0) {
    if (!qs.length) return;
    G = { c, mode: "train", score: 0, max: 0, log: [], ri: 0, qi: -1, level: 0, rounds: [{ kind: "train", name, timer, qs }] };
    nextQ();
  }

  function startShow(c) {
    const playable = c.questions.filter((q) => !isMock(c, q));
    const mcq = playable.filter((q) => q.type === "mcq"), open = playable.filter((q) => q.type === "open");
    const last = pick(open.length ? open : mcq.filter((q) => q.hard), 2), lastIds = new Set(last.map((q) => q.id));
    G = {
      c, mode: "show", score: 0, max: 0, log: [], ri: -1, qi: -1, level: 0,
      rounds: [
        { kind: "quick", name: "Round 1 · Quick Fire", timer: QUICK_TIME, qs: pick(mcq.filter((q) => !lastIds.has(q.id)), 9),
          desc: `9 questions from the whole course, ${QUICK_TIME} seconds each${mcq.some((q) => q.calc) ? " (2 min for calculations)" : ""}. 10 points per right answer, plus up to 5 for speed.` },
        { kind: "ladder", name: "Round 2 · The Ladder", timer: LADDER_TIME, qs: null,
          desc: "You pick a theme, then get 6 questions on it. Right answers in a row are worth 10, 20, 30, then 40 points. One miss sends you back to the bottom." },
        { kind: "final", name: "Round 3 · The Final", timer: open.length ? 0 : LONG_TIME, qs: last,
          desc: open.length
            ? `Two open questions, like the exam. Write your answer, then grade yourself against the key points. Up to ${OPEN_PTS} points each.`
            : `Two of the hardest questions in the course, 2 minutes each. ${OPEN_PTS} points each, all or nothing.` },
      ],
    };
    nextRound();
  }

  function nextRound() {
    G.ri++; G.qi = -1; G.level = 0;
    if (G.ri >= G.rounds.length) return results();
    const R = G.rounds[G.ri];
    if (R.kind === "ladder" && !R.qs) return themePick(R);
    roundIntro(R);
  }

  function roundIntro(R) {
    screen(`
      <div class="bar"><button class="ghost" data-quit>✕ Quit</button><div class="bar-mid"><strong>The Show</strong><span>${esc(G.c.name)}</span></div><div class="score"><span>${G.score}</span> pts</div></div>
      <section class="intro card">
        <p class="eyebrow">Round ${G.ri + 1} of ${G.rounds.length}</p>
        <h1>${esc(R.name.split("·")[1].trim())}</h1>
        <p class="lead">${esc(R.desc)}</p>
        ${R.theme ? `<p class="tags"><span class="tag alt">${esc(R.theme)}</span></p>` : ""}
        <button class="btn big" data-go>Start round →</button>
        <p class="hint">Keyboard: ${G.c.none ? "A–E or 1–5" : "A–D or 1–4"} to answer, Enter for next.</p>
      </section>`);
    on("[data-quit]", () => course(G.c));
    on("[data-go]", nextQ);
    keyHandler = (e) => { if (e.key === "Enter") { e.preventDefault(); nextQ(); } };
  }

  function themePick(R) {
    const used = new Set(G.rounds[0].qs.concat(G.rounds[2].qs).map((q) => q.id));
    const cands = Object.values(G.c.themeMap).filter((t) => !(G.c.mocks || []).includes(t.id)).map((t) => {
      const all = G.c.questions.filter((q) => q.t === t.id && q.type === "mcq");
      return { t, all, free: all.filter((q) => !used.has(q.id)) };
    }).filter((x) => x.free.length >= 6);
    // Weak themes are offered more often.
    const offered = [];
    const poolT = cands.slice();
    while (offered.length < 3 && poolT.length) {
      let tot = 0; const cum = poolT.map((x) => (tot += 1.2 - mastery(x.all)));
      const r = Math.random() * tot; let i = cum.findIndex((v) => v > r); if (i < 0) i = poolT.length - 1;
      offered.push(poolT.splice(i, 1)[0]);
    }
    screen(`
      <div class="bar"><button class="ghost" data-quit>✕ Quit</button><div class="bar-mid"><strong>The Show</strong><span>Round 2 of 3</span></div><div class="score"><span>${G.score}</span> pts</div></div>
      <section class="intro">
        <p class="eyebrow">Round 2 · The Ladder</p>
        <h1>Pick your theme</h1>
        <p class="lead">Six questions on one theme. The braver choice is the one you know least.</p>
        <div class="themes">${offered.map((x, i) => `
          <button class="theme" data-i="${i}"><small>${esc(x.t.session)}</small><h3>${esc(x.t.name)}</h3>
          <div class="meter"><i style="width:${pct(mastery(x.all))}%"></i></div><span>${pct(mastery(x.all))}% mastered</span></button>`).join("")}</div>
      </section>`);
    on("[data-quit]", () => course(G.c));
    on(".theme", (el) => { const x = offered[+el.dataset.i]; R.qs = pick(x.free, 6); R.theme = x.t.name; roundIntro(R); });
  }

  function nextQ() {
    G.qi++;
    if (G.qi >= G.rounds[G.ri].qs.length) return nextRound();
    renderQ();
  }

  function ladderHTML() {
    return `<div class="ladder">${LADDER.map((v, i) => `<span class="${i === Math.min(G.level, 3) ? "on" : i < G.level ? "done" : ""}">${v}</span>`).join("")}</div>`;
  }

  // ---------- question screen ----------
  function renderQ() {
    const R = G.rounds[G.ri], q = R.qs[G.qi], th = G.c.themeMap[q.t];
    const isMcq = q.type === "mcq", lastQ = G.qi === R.qs.length - 1;
    const opts = isMcq ? options(q) : null;
    const host = !!store.host;
    const timed = isMcq && !!(host || R.timer);
    const tSec = q.calc || R.timer === LONG_TIME ? LONG_TIME : host ? HOST_TIME : R.timer;
    const qMax = R.kind === "quick" ? 15 : R.kind === "ladder" ? LADDER[Math.min(G.qi, 3)] : R.kind === "final" ? OPEN_PTS : 10;
    let done = false, started = !host, onBegin = null;
    const hid = host ? " hidden" : "";

    screen(`
      <div class="bar">
        <button class="ghost" data-quit>✕ Quit</button>
        <div class="bar-mid"><strong>${esc(R.name)}</strong><span>Question ${G.qi + 1} / ${R.qs.length}</span></div>
        <div class="score"><span id="score">${G.score}</span> pts</div>
      </div>
      <div class="progress"><i style="width:${(G.qi / R.qs.length) * 100}%"></i></div>
      ${R.kind === "ladder" ? ladderHTML() : ""}
      ${timed ? `<div class="timer" data-gated${hid}><div id="tbar"></div><span id="tnum">${tSec}</span></div>` : ""}
      <article class="card q">
        <div class="tags"><span class="tag">${esc(th.session)}</span><span class="tag alt">${esc(th.name)}</span>${isMcq ? "" : '<span class="tag open">Open question</span>'}</div>
        <h2 class="qtext">${fmt(q.q)}</h2>
        ${q.code ? `<pre>${esc(q.code)}</pre>` : ""}
        ${figure(q)}
        ${host ? `<div class="host-gate"><button class="btn big" data-start>Start ▶</button>
          <p class="hint">Host: read the question out loud, then press Start (or Space / Enter).</p></div>` : ""}
        <div data-gated${hid}>
        ${isMcq
          ? `<div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="letter">${LETTERS[i]}</span><span>${fmt(o.t)}</span></button>`).join("")}</div>`
          : `<textarea id="ans" rows="7" placeholder="Write your answer as you would in the exam. Not saved, not checked by a machine: you grade it yourself on the next step."></textarea>
             <button class="btn" data-reveal>Reveal the model answer</button>`}
        </div>
        <div id="fb" aria-live="polite"></div>
      </article>`);

    const fb = document.getElementById("fb");
    on("[data-quit]", () => (G.log.length ? results() : course(G.c)));

    // Host mode: answers stay hidden until the host clicks Start.
    function begin() {
      if (started) return;
      started = true;
      const gate = $app.querySelector(".host-gate"); if (gate) gate.remove();
      $app.querySelectorAll("[data-gated]").forEach((el) => (el.hidden = false));
      if (onBegin) onBegin();
    }
    on("[data-start]", begin);
    const startKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); begin(); } };

    function finish(ok, pts, head, entry) {
      done = true; stopTimer();
      G.score += pts; G.max += qMax;
      record(q, ok);
      G.log.push(Object.assign({ q, ok, pts }, entry));
      document.getElementById("score").textContent = G.score;
      const lad = $app.querySelector(".ladder"); if (lad) lad.outerHTML = ladderHTML();
      const box = document.createElement("div");
      box.className = "fb " + (ok ? "good" : "bad");
      box.innerHTML = `
        <div class="fb-head"><span>${head}</span>${pts ? `<span class="pts">+${pts}</span>` : ""}</div>
        ${isMcq ? `<p><strong>Answer:</strong> ${fmt(q.o[0])}</p><p>${fmt(q.e)}</p>` : ""}
        <div class="fb-foot"><span class="ref">📖 ${esc(q.r)}</span><button class="btn" data-next>${lastQ ? (G.ri === G.rounds.length - 1 ? "See results" : "End of round") : "Next"} →</button></div>`;
      fb.appendChild(box);
      const nx = box.querySelector("[data-next]");
      nx.addEventListener("click", nextQ);
      nx.focus({ preventScroll: true });
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (isMcq) {
      const btns = Array.from($app.querySelectorAll(".opt"));
      const answer = (i) => {
        if (done) return;
        const ok = i >= 0 && opts[i].ok;
        let pts = 0;
        if (R.kind === "quick") pts = ok ? 10 + Math.min(5, Math.floor((tLeft * 6) / tSec)) : 0;
        else if (R.kind === "ladder") { pts = ok ? LADDER[Math.min(G.level, 3)] : 0; G.level = ok ? G.level + 1 : 0; }
        else pts = ok ? qMax : 0;
        btns.forEach((b, j) => { b.disabled = true; if (opts[j].ok) b.classList.add("right"); else if (j === i) b.classList.add("wrong"); });
        const head = i < 0 ? "⏰ Time's up." : ok ? rnd(GOOD) : rnd(BAD);
        finish(ok, pts, head, { chosen: i >= 0 ? opts[i].t : null });
      };
      btns.forEach((b) => b.addEventListener("click", () => answer(+b.dataset.i)));
      keyHandler = (e) => {
        if (!started) return startKey(e);
        if (done) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nextQ(); } return; }
        const k = e.key.toLowerCase(); if (k.length !== 1) return;
        const i = "abcde".indexOf(k) >= 0 ? "abcde".indexOf(k) : "12345".indexOf(k);
        if (i >= 0 && i < opts.length) answer(i);
      };
      onBegin = () => { if (timed) startTimer(tSec, () => answer(-1)); };
      if (started) onBegin();
    } else {
      const maxPts = R.kind === "final" ? OPEN_PTS : 10;
      on("[data-reveal]", (el) => {
        el.remove();
        document.getElementById("ans").readOnly = true;
        fb.innerHTML = `
          <div class="model">
            <h3>Model answer</h3><p class="pre">${fmt(q.model)}</p>
            <h3>Tick every point your answer covered</h3>
            ${q.keys.map((k, i) => `<label class="key"><input type="checkbox" data-k="${i}"><span>${fmt(k)}</span></label>`).join("")}
            <button class="btn" data-grade>Score my answer</button>
          </div>`;
        on("[data-grade]", (g) => {
          if (done) return;
          const boxes = Array.from(fb.querySelectorAll("input[data-k]"));
          const hit = boxes.filter((b) => b.checked).length, frac = hit / boxes.length;
          boxes.forEach((b) => (b.disabled = true)); g.remove();
          const ok = frac >= 0.6;
          finish(ok, Math.round(maxPts * frac), `${hit} / ${boxes.length} key points. ${ok ? "That would score on the exam." : "Read the model answer again, out loud."}`,
            { frac, missed: q.keys.filter((k, i) => !boxes[i].checked) });
        });
      });
      onBegin = () => document.getElementById("ans").focus();
      keyHandler = (e) => {
        if (!started) return startKey(e);
        if (done && e.key === "Enter") { e.preventDefault(); nextQ(); }
      };
    }
  }

  const GOOD = ["✅ Correct. Not so dumb after all.", "✅ Right. Suspicious, but right.", "✅ Yes. The dumbass is learning.", "✅ Correct. Who are you?", "✅ Right. Do that again on exam day."];
  const BAD = ["❌ Wrong. On brand.", "❌ No. But now you know.", "❌ Nope. Read this carefully.", "❌ Wrong. Classic trap.", "❌ No. Better here than in the exam."];
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- results ----------
  function rank(p) {
    if (p >= 0.9) return ["Champion", "Officially no longer a dumbass. Go sit the exam."];
    if (p >= 0.75) return ["Dangerously Competent", "A few gaps left. Hit 'My mistakes' and close them."];
    if (p >= 0.55) return ["Occasionally Smart", "You pass on a good day. Make every day a good day."];
    if (p >= 0.35) return ["Dumbass in Recovery", "Progress. Train the weak themes below, then come back."];
    return ["Certified Dumbass", "It can only go up from here. Start with Training, one session at a time."];
  }

  function results() {
    stopTimer();
    const c = G.c, p = G.max ? G.score / G.max : 0, [title, line] = rank(p);
    const full = G.mode === "show" && G.ri >= G.rounds.length;
    let record_ = false;
    if (full && (store.best[c.id] == null || G.score > store.best[c.id])) { store.best[c.id] = G.score; save(); record_ = true; }

    const per = {};
    G.log.forEach((l) => { const id = l.q.topic || l.q.t, t = per[id] || (per[id] = { ok: 0, n: 0 }); t.n++; if (l.ok) t.ok++; });
    const themeRows = Object.keys(per).map((id) => {
      const t = per[id];
      return `<div class="trow"><span>${esc(c.themeMap[id].name)}</span><div class="meter"><i style="width:${pct(t.ok / t.n)}%"></i></div><b>${t.ok}/${t.n}</b></div>`;
    }).join("");
    const wrong = G.log.filter((l) => !l.ok);
    const review = wrong.map((l) => `
      <details class="rev"><summary>${fmt(l.q.q)}</summary>
        ${l.q.code ? `<pre>${esc(l.q.code)}</pre>` : ""}
        ${figure(l.q)}
        ${l.q.type === "mcq"
          ? `<p class="bad-t">Your answer: ${l.chosen ? fmt(l.chosen) : "none (time ran out)"}</p><p class="good-t">Correct answer: ${fmt(l.q.o[0])}</p><p>${fmt(l.q.e)}</p>`
          : `<p class="bad-t">Points you missed:</p><ul>${l.missed.map((k) => `<li>${fmt(k)}</li>`).join("")}</ul><p class="pre">${fmt(l.q.model)}</p>`}
        <p class="ref">📖 ${esc(l.q.r)}</p>
      </details>`).join("");

    screen(`
      <section class="result card">
        <p class="eyebrow">${G.mode === "show" ? (full ? "The Show · final score" : "The Show · stopped early") : esc(G.rounds[0].name) + " · done"}</p>
        <div class="big-score">${G.score}<small> / ${G.max} pts</small></div>
        <h1>${esc(title)}</h1>
        <p class="lead">${esc(line)}</p>
        ${record_ ? '<p class="tags"><span class="tag open">New best score</span></p>' : ""}
        <p class="sub">${G.log.filter((l) => l.ok).length} right out of ${G.log.length} · ${pct(p)}%</p>
        <div class="actions">
          <button class="btn big" data-again>${G.mode === "show" ? "Play The Show again" : "Back to the course"}</button>
          ${wrong.length ? `<button class="btn alt" data-retry>Retry these ${wrong.length} mistake${wrong.length > 1 ? "s" : ""}</button>` : ""}
          <button class="ghost" data-course>Course page</button>
        </div>
      </section>
      ${themeRows ? `<section class="card"><h2>By theme</h2>${themeRows}</section>` : ""}
      ${review ? `<section class="card"><h2>What you got wrong</h2><p class="sub">Click a question to see the answer and the explanation.</p>${review}</section>` : ""}`);
    on("[data-again]", () => (G.mode === "show" ? startShow(c) : course(c)));
    on("[data-retry]", () => startList(c, "Retry", shuffle(wrong.map((l) => l.q))));
    on("[data-course]", () => course(c));
  }

  home();
})();
