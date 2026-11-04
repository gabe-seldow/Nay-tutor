import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// Isolated Chrome automation. This does not touch a personal browser profile.
// Screenshots/emulation are not physical iPhone or Safari verification.
const url = process.argv[2] ?? "http://127.0.0.1:5182/";
const chrome =
  process.env.CHROME_PATH ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "google-chrome");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "nay-tutor-qa-"));
const output = path.resolve("qa-output");
fs.mkdirSync(output, { recursive: true });
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let assertions = 0;
const errors = [];
function assert(value, message) {
  if (!value) throw Error(message);
  assertions++;
}
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try {
      port = fs
        .readFileSync(path.join(profile, "DevToolsActivePort"), "utf8")
        .split("\n")[0];
      break;
    } catch {
      await delay(100);
    }
  }
  if (!port)
    throw Error(
      "Chrome did not start. Set CHROME_PATH to an installed Chrome executable.",
    );
  const tab = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const [resolve, reject] = pending.get(message.id);
      pending.delete(message.id);
      message.error
        ? reject(Error(message.error.message))
        : resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown")
      errors.push(message.params.exceptionDetails.text);
  });
  const cdp = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, [resolve, reject]);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw Error(
        result.exceptionDetails.exception?.description ??
          result.exceptionDetails.text,
      );
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(50);
    }
    throw Error(`Timed out: ${expression}`);
  };
  const click = async (selector) => {
    assert(
      await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`),
      `Missing ${selector}`,
    );
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)}).click()`,
    );
    await delay(12);
  };
  const navigate = async (hash) => {
    await evaluate(`location.hash=${JSON.stringify(hash)}`);
    await delay(35);
  };
  const screenshot = async (name) => {
    await delay(100);
    const capture = await cdp("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      path.join(output, `${name}.png`),
      Buffer.from(capture.data, "base64"),
    );
  };
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  // Use the real speech service with deterministic system-voice/utterance mocks.
  // This tests UI lifecycle, never claims audible or physical-device verification.
  await cdp("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__speechRequests=[];window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{paused:false,speaking:false,pending:false,getVoices:()=>[{lang:'ko-KR',name:'QA Korean'}],addEventListener(){},removeEventListener(){},cancel(){},resume(){},speak(u){window.__speechRequests.push(u.text);u.onstart?.({});setTimeout(()=>u.onend?.({}),25)}}});`,
  });
  const { createServer } = await import("vite");
  const source = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  const { lessons, exerciseById } =
    await source.ssrLoadModule("/src/curriculum.ts");
  await source.close();
  const state = () =>
    evaluate(`JSON.parse(localStorage.getItem('nay-tutor.progress.v1'))`);
  const clickText = async (selector, text) => {
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim()===${JSON.stringify(text)});if(!e||e.disabled)throw Error('Unavailable control: '+${JSON.stringify(text)});e.click();})()`,
    );
    await delay(12);
  };
  const input = async (value, selector = "#answer") => {
    await evaluate(
      `(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await delay(12);
  };
  async function fill(e, wrong = false) {
    if (e.options) {
      await clickText(
        ".answer-option",
        wrong
          ? e.options.find((o) => !e.answers.includes(o.value)).label
          : e.options.find((o) => e.answers.includes(o.value)).label,
      );
    } else if (e.type === "build-syllable") {
      const n = e.answers[0].codePointAt(0) - 0xac00;
      const onset = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"[
        Math.floor(n / 588)
      ];
      const vowel = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"[
        Math.floor((n % 588) / 28)
      ];
      await clickText(
        ".block-builder fieldset:nth-of-type(1) button",
        wrong ? e.onsets.find((x) => x !== onset) : onset,
      );
      await clickText(".block-builder fieldset:nth-of-type(2) button", vowel);
    } else await input(wrong ? "not-the-answer" : e.answers[0]);
  }
  await cdp("Page.navigate", { url });
  await waitFor('!!document.querySelector("h1")');
  // Check the actual Phase 1-to-release migration before the learner journey.
  await evaluate(
    `localStorage.setItem('hangeul.progress.v2','original-sentinel');localStorage.setItem('nay-tutor.progress.v1',JSON.stringify({version:1,curriculumVersion:1,profile:{learner:{name:'Jaeyeon',koreanName:'재연'},brother:{name:'Jaehun',koreanName:'재훈'},dog:{name:'Miguel',koreanName:'미겔'},spellingsConfirmed:false},completedLessonIds:['u1-l1'],mastery:{},preferences:{romanization:'on-demand'},navigation:{page:'learn',previewLessonId:'u2-l1'}}));`,
  );
  await cdp("Page.reload");
  await waitFor('!!document.querySelector(".next-card")');
  assert(
    await evaluate('document.querySelectorAll(".future-unit").length===7'),
    "Expected seven locked preview cards",
  );
  assert(
    await evaluate(
      '[...document.querySelectorAll(".future-unit")].every(x=>!x.querySelector("a,button,progress")&&x.textContent.includes("COMING SOON"))',
    ),
    "Future previews have working lesson controls",
  );
  await navigate("#/lesson/u2-l1");
  assert(
    await evaluate('!!document.querySelector(".next-card")'),
    "Future route loaded a lesson",
  );
  await navigate("#/lesson/u1-day-14");
  await waitFor(
    `document.querySelector('h1')?.textContent==='This step is coming up.'`,
  );
  assert(
    await evaluate('!document.querySelector(".exercise-card,.start-lesson")'),
    "Locked lesson has playable controls",
  );
  let solved = 0,
    wrongCount = 0,
    resumes = 0;
  const types = new Set();
  for (const lesson of lessons) {
    await navigate(`#/lesson/${lesson.id}`);
    await waitFor('!!document.querySelector(".start-lesson")');
    if (lesson.day === 1) {
      await click(".intro-items .listen");
      assert(
        (await evaluate("window.__speechRequests.at(-1)")) === "아",
        "Reference audio used isolated jamo instead of a vowel syllable",
      );
    }
    if (lesson.day === 1)
      assert(!(await state()).streak, "Opening or listening created a streak");
    const requests = await evaluate("window.__speechRequests.length");
    await click(".start-lesson");
    await waitFor('!!document.querySelector(".exercise-card,.keyboard-help")');
    assert(
      (await evaluate("window.__speechRequests.length")) === requests,
      "Starting a lesson autoplayed audio",
    );
    let first = true;
    while ((await state()).session) {
      const before = await state(),
        session = before.session,
        e = exerciseById[session.exerciseIds[session.index]];
      types.add(e.type);
      if (e.requiresKeyboard && !session.keyboardReady) {
        assert(
          (await evaluate(
            'document.querySelector(".keyboard-help h1").textContent',
          )) === "Ask Gabe to help set up the Korean keyboard on your phone.",
          "Missing keyboard message",
        );
        await clickText(".keyboard-help button", "I'm ready");
      }

      if (e.type === "type-sound")
        assert(
          await evaluate(
            '!document.querySelector(".hint-content") && document.querySelector(".exercise-display").textContent=== ' +
              JSON.stringify(e.display),
          ),
          "Sound recall has an unsolicited guide",
        );
      if (e.audio && !e.guided) {
        assert(
          await evaluate('!document.querySelector(".written-support")'),
          "Transcript revealed before request",
        );
        assert(
          !(
            await evaluate(
              'document.querySelector(".question-audio .listen").getAttribute("aria-label")',
            )
          ).includes(e.audio.text),
          "Audio answer leaked in accessible name",
        );
      }
      const wrong = first && [1, 4, 8, 11, 14].includes(lesson.day);
      if (wrong) wrongCount++;
      if (first && lesson.day === 2) {
        await click(".hint-button");
        assert(
          await evaluate('!!document.querySelector(".hint-content")'),
          "Explicit hint did not appear",
        );
      }
      await fill(e, wrong);
      const partial = e.id === "u1-day-01-recall-0";
      if (partial) await input("ah");
      if (e.audio) {
        assert(
          await evaluate('document.querySelector(".check-answer").disabled'),
          "Audio question submitted without listening or support",
        );
        await click(".question-audio .listen");
        await waitFor(
          `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).session.heardAudio===true`,
        );
      }
      if (first && lesson.day === 11) {
        await evaluate(
          `(()=>{const e=document.querySelector('#answer');e.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,isComposing:true,bubbles:true,cancelable:true}));})()`,
        );
        assert(
          !(await state()).session.resolved,
          "IME composition submitted early",
        );
        await evaluate(
          `document.querySelector('#answer').dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}))`,
        );
      }
      await click(".check-answer");
      await waitFor('!!document.querySelector(".feedback")');
      const after = await state();
      assert(
        after.streak?.days === 1,
        "Practice streak did not count exactly one local day",
      );
      assert(after.session.lastCorrect === !wrong, `Wrong feedback: ${e.id}`);
      if (partial) {
        assert(
          after.session.outcome === "sound-correct",
          "Approximation not recognized",
        );
        assert(
          (await evaluate(
            'document.querySelector(".feedback h2").textContent',
          )) === "You got the sound!",
          "Missing sound-correct feedback",
        );
      }
      solved++;
      if (first && [1, 6, 11].includes(lesson.day)) {
        await cdp("Page.reload");
        await waitFor('!!document.querySelector(".feedback")');
        assert(
          (await state()).history.length === after.history.length,
          "Reload duplicated a submitted attempt",
        );
        resumes++;
      }
      await click(".continue");
      first = false;
    }
    assert(
      (await state()).completedLessonIds.includes(lesson.id),
      `Completion missing: ${lesson.id}`,
    );
    console.log(`Playable lesson ${lesson.day}/14 verified: ${lesson.title}`);
  }
  assert(
    (await state()).completedLessonIds.length === 14,
    "Not all fourteen lessons completed",
  );
  assert(
    (await state()).streak.days === 1,
    "Repeated practice changed the same-day streak",
  );
  assert(types.size === 7, "Required exercise type missing");
  assert(
    (await state()).legacyPlan.completedLessonIds[0] === "u1-l1",
    "Phase 1 archive lost",
  );
  await cdp("Page.reload");
  await waitFor('!!document.querySelector(".start-lesson")');
  assert(
    (await state()).completedLessonIds.length === 14,
    "Completion lost on refresh",
  );
  await navigate("#/review");
  await waitFor('!!document.querySelector(".review-start .primary")');
  await click(".review-start .primary");
  await waitFor('!!document.querySelector(".exercise-card,.keyboard-help")');
  const review = (await state()).session;
  assert(
    review.kind === "review" && review.exerciseIds.length <= 8,
    "Review session invalid",
  );
  while ((await state()).session) {
    const session = (await state()).session,
      e = exerciseById[session.exerciseIds[session.index]];
    if (e.requiresKeyboard && !session.keyboardReady)
      await clickText(".keyboard-help button", "I'm ready");
    await fill(e);
    if (e.audio) {
      await click(".question-audio .listen");
      await waitFor(
        `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).session.heardAudio===true`,
      );
    }
    await click(".check-answer");
    await click(".continue");
  }
  assert(
    (await state()).completedLessonIds.length === 14,
    "Review changed lesson completion",
  );
  // Deferring keyboard setup skips typing, records no attempts, and asks only once.
  await navigate("#/lesson/u1-day-11");
  await click(".start-lesson");
  await waitFor('!!document.querySelector(".keyboard-help")');
  const beforeSkip = await state();
  await clickText(".keyboard-help button", "Skip for now");
  await waitFor('!!document.querySelector(".feedback")');
  while ((await state()).session?.outcome === "skipped") {
    await click(".continue");
    await delay(40);
  }
  const afterSkip = await state();
  assert(
    JSON.stringify(afterSkip.mastery) === JSON.stringify(beforeSkip.mastery),
    "Skipping penalized mastery",
  );
  assert(
    afterSkip.history.length === beforeSkip.history.length,
    "Skipping recorded graded attempts",
  );
  assert(
    afterSkip.session.skippedExerciseIds.length === 7,
    "Not all deferred typing skipped",
  );
  assert(
    await evaluate('!document.querySelector(".keyboard-help")'),
    "Keyboard help repeated within a lesson",
  );
  // Representative screens at common iPhone sizes, plus desktop.
  for (const [width, height] of [
    [1440, 1000],
    [375, 812],
    [390, 844],
    [430, 932],
    [390, 460],
  ]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    for (const [hash, name] of [
      ["#/learn", "home"],
      ["#/review", "review"],
      ["#/hangul", "sounds"],
      ["#/settings", "settings"],
      ["#/lesson/u1-day-13", "family-intro"],
    ]) {
      await navigate(hash);
      assert(
        await evaluate("document.documentElement.scrollWidth<=innerWidth"),
        `Overflow: ${width}/${name}`,
      );
      if (width < 700)
        assert(
          await evaluate(
            `[...document.querySelectorAll('.mobile-nav a')].every(x=>x.getBoundingClientRect().height>=44)`,
          ),
          "Mobile nav targets too small",
        );
      if (width === 390 || width === 1440)
        await screenshot(`${width}-${height}-${name}`);
    }
    await navigate("#/lesson/u1-day-01");
    await click(".start-lesson");
    await waitFor('!!document.querySelector(".exercise-card,.keyboard-help")');
    assert(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      `Exercise overflow at ${width}`,
    );
    assert(
      await evaluate(
        `[...document.querySelectorAll('.answer-option')].every(x=>x.getBoundingClientRect().height>=44)`,
      ),
      "Answer target too small",
    );
    if (width === 390 || width === 1440)
      await screenshot(`${width}-${height}-exercise`);
    // Save and leave, then resume an unresolved selected answer exactly.
    const e = exerciseById[(await state()).session.exerciseIds[0]];
    await fill(e);
    await cdp("Page.reload");
    await waitFor('!!document.querySelector(".exercise-card,.keyboard-help")');
    assert(
      (await state()).session.answer === e.answers[0],
      "Unsubmitted answer lost on refresh",
    );
    await navigate("#/learn");
    await navigate("#/lesson/u1-day-13");
    await click(".start-lesson");
    await waitFor('!!document.querySelector(".exercise-card,.keyboard-help")');
    assert(
      await evaluate("document.documentElement.scrollWidth<=innerWidth"),
      `Guided phrase overflow at ${width}`,
    );
    if (width === 390) await screenshot("390-guided-phrase");
  }
  // Simulate the reduced visual viewport of an open phone keyboard.
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 460,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate("#/lesson/u1-day-01");
  await click(".start-lesson");
  for (let i = 0; i < 2; i++) {
    const session = (await state()).session,
      e = exerciseById[session.exerciseIds[session.index]];
    await fill(e);
    if (e.audio) {
      await click(".question-audio .listen");
      await waitFor(
        "JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).session.heardAudio===true",
      );
    }
    await click(".check-answer");
    await click(".continue");
  }
  await evaluate("document.querySelector('#answer').focus()");
  await delay(80);
  assert(
    await evaluate(
      "(()=>{const r=document.querySelector('#answer').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight-64})()",
    ),
    "Typing input hidden by the reduced viewport/navigation",
  );
  await screenshot("390-keyboard-recall");
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  // Missing Korean voice must allow a deliberately supported alternative.
  await navigate("#/lesson/u1-day-13");
  await click(".start-lesson"); // replace the saved keyboard simulation before restarting Lesson 1
  await navigate("#/lesson/u1-day-01");
  await click(".start-lesson"); // replace the saved family session
  await fill(exerciseById[(await state()).session.exerciseIds[0]]);
  await click(".check-answer");
  await click(".continue");
  await evaluate(
    "window.speechSynthesis.getVoices=()=>[{lang:'en-US',name:'English only'}]",
  );
  await click(".question-audio .listen");
  await waitFor('!!document.querySelector(".audio-error")');
  assert(
    await evaluate('!document.querySelector(".written-support")'),
    "Missing voice revealed answer automatically",
  );
  await click(".question-audio .text-link");
  assert(
    (await state()).session.hintUsed,
    "Written fallback did not record support",
  );
  const fallbackE =
    exerciseById[
      (await state()).session.exerciseIds[(await state()).session.index]
    ];
  await fill(fallbackE);
  await click(".check-answer");
  assert(
    (await state()).history.at(-1).hintUsed,
    "Fallback earned independent credit",
  );
  await navigate("#/lesson/u1-day-13");
  await click(".start-lesson");
  const guidedE = exerciseById[(await state()).session.exerciseIds[0]];
  await fill(guidedE);
  await click(".question-audio .listen");
  await waitFor('!!document.querySelector(".audio-error")');
  await click(".question-audio .text-link");
  await click(".check-answer");
  assert(
    (await state()).history.at(-1).mode === "guided",
    "Missing-voice phrase fallback earned recall credit",
  );
  await navigate("#/settings");
  await input("Buddy", 'input[name="dog-name"]');
  await input("버디", 'input[name="dog-korean"]');
  await click(".profile-form button[type=submit]");
  await cdp("Page.reload");
  await waitFor(
    `document.querySelector('input[name="dog-name"]')?.value==='Buddy'`,
  );
  // Deliberately replace the saved family question before inspecting its introduction.
  await navigate("#/lesson/u1-day-01");
  await click(".start-lesson");
  await navigate("#/lesson/u1-day-13");
  assert(
    await evaluate('document.body.innerText.includes("버디 어디 있어요?")'),
    "Configured family spelling not used",
  );
  assert(
    await evaluate(
      `localStorage.getItem('hangeul.progress.v2')==='original-sentinel'`,
    ),
    "Hangeul storage touched",
  );
  assert(errors.length === 0, `Browser exceptions: ${errors.join(", ")}`);
  const report = {
    assertions,
    lessons: 14,
    authoredExercises: lessons.reduce((n, l) => n + l.exercises.length, 0),
    submittedExercises: solved,
    intentionalMistakes: wrongCount,
    resumes,
    exerciseTypes: [...types],
    viewports: [
      "1440×1000",
      "375×812",
      "390×844",
      "430×932",
      "390×460 keyboard simulation",
    ],
    limits:
      "Automated Chrome with deterministic speech mocks; no physical iPhone, Safari, audible Korean output, or native-speaker review.",
  };
  fs.writeFileSync(
    path.join(output, "browser-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  ws?.close();
  browser.kill();
}
