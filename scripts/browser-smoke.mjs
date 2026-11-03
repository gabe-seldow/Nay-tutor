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
    await delay(80);
  };
  const navigate = async (hash) => {
    await evaluate(`location.hash=${JSON.stringify(hash)}`);
    await delay(100);
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
  // Deterministically check the unavailable-voice fallback, rather than claiming device audio verification.
  await cdp("Page.addScriptToEvaluateOnNewDocument", {
    source: `Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],addEventListener(){},removeEventListener(){},speaking:false,pending:false,cancel(){},speak(){throw Error('Unexpected speech without a Korean voice')}}});`,
  });
  await cdp("Page.navigate", { url });
  await waitFor('!!document.querySelector("h1")');
  assert(
    (await evaluate("document.title")).includes("Nay Tutor"),
    "Incorrect app title",
  );
  await evaluate(
    `localStorage.setItem('hangeul.progress.v2','untouched-original-progress')`,
  );
  for (const [width, height] of [
    [1440, 1000],
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    for (const [hash, title] of [
      ["#/learn", "Your Korean starts"],
      ["#/lesson/u1-l1", "Your first two vowels"],
      ["#/hangul", "A small place to start."],
      ["#/review", "Familiar, then unforgettable."],
      ["#/settings", "Your names. Your pace."],
    ]) {
      await navigate(hash);
      await waitFor(
        `document.querySelector('h1')?.innerText.includes(${JSON.stringify(title)})`,
      );
      assert(
        await evaluate("document.documentElement.scrollWidth<=innerWidth"),
        `Horizontal overflow at ${width}: ${hash}`,
      );
      assert(
        await evaluate('document.querySelectorAll("main h1").length===1'),
        `Missing unique heading at ${hash}`,
      );
      if (width < 700)
        assert(
          await evaluate(
            `[...document.querySelectorAll('.mobile-nav a')].every(a=>a.getBoundingClientRect().height>=44)`,
          ),
          "Mobile navigation touch targets too small",
        );
      if (width === 1440 || width === 390)
        await screenshot(
          `${width}-${hash.replace("#/", "").replaceAll("/", "-")}`,
        );
    }
  }
  await navigate("#/lesson/u1-l1");
  await click(".listen");
  await waitFor('!!document.querySelector(".audio-error")');
  assert(
    (
      await evaluate('document.querySelector(".audio-error").textContent')
    ).includes("Korean audio is unavailable"),
    "Missing audio fallback",
  );
  await navigate("#/settings");
  await evaluate(
    `(()=>{const e=document.querySelector('input[name="learner-name"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Jaeyeon QA');e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  await delay(100);
  await click("input[type=checkbox]");
  await click("button[type=submit]");
  await waitFor(
    `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).profile.learner.name==='Jaeyeon QA'`,
  );
  assert(
    await evaluate(
      `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).profile.spellingsConfirmed`,
    ),
    "Confirmation was not saved",
  );
  await cdp("Page.reload");
  await waitFor(
    `document.querySelector('input[name="learner-name"]')?.value==='Jaeyeon QA'`,
  );
  await navigate("#/lesson/u1-l3");
  await waitFor(
    `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).navigation.previewLessonId==='u1-l3'`,
  );
  // A fresh URL restores the saved preview, including across page reload.
  await cdp("Page.navigate", { url });
  await waitFor(
    `document.querySelector('h1')?.textContent==='Round your lips'`,
  );
  assert(
    await evaluate(
      `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).completedLessonIds.length===0`,
    ),
    "Browsing awarded lesson completion",
  );
  assert(
    await evaluate(
      `Object.keys(JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).mastery).length===0`,
    ),
    "Listening awarded mastery",
  );
  assert(
    await evaluate(
      `localStorage.getItem('hangeul.progress.v2')==='untouched-original-progress'`,
    ),
    "Hangeul save was changed",
  );
  await navigate("#/hangul");
  await navigate("#/review");
  await evaluate("history.back()");
  await waitFor(
    `document.querySelector('h1')?.textContent==='A small place to start.'`,
  );
  await navigate("#/invalid-route");
  await waitFor(
    `document.querySelector('h1')?.textContent.includes('Your Korean starts')`,
  );
  // Native validation: a blank required profile name cannot be saved.
  await navigate("#/settings");
  await click(".skip-link");
  assert(
    await evaluate(
      "location.hash==='#/settings' && document.activeElement===document.querySelector('main')",
    ),
    "Skip link changed route or failed to focus content",
  );
  await evaluate(
    `(()=>{const e=document.querySelector('input[name="learner-name"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  await delay(80);
  await click("button[type=submit]");
  assert(
    await evaluate(
      `JSON.parse(localStorage.getItem('nay-tutor.progress.v1')).profile.learner.name==='Jaeyeon QA'`,
    ),
    "Blank profile name was saved",
  );
  // Corrupt data remains intact until a deliberate state change.
  await navigate("#/learn");
  await evaluate(`localStorage.setItem('nay-tutor.progress.v1','corrupt');`);
  await cdp("Page.reload");
  await waitFor('!!document.querySelector(".storage-warning")');
  assert(
    await evaluate(`localStorage.getItem('nay-tutor.progress.v1')==='corrupt'`),
    "Corrupt save silently overwritten on load",
  );
  assert(errors.length === 0, `Browser exceptions: ${errors.join(", ")}`);
  const report = {
    assertions,
    viewports: ["1440×1000", "375×812", "390×844", "430×932"],
    screenshots: output,
    coverage: [
      "navigation/back/invalid routes",
      "profile edit and reload",
      "resume preview",
      "zero false completion/mastery",
      "original storage isolation",
      "missing Korean voice",
      "required fields",
      "malformed storage",
    ],
    limits:
      "Automated Chrome emulation; no physical iPhone, Safari, or audible output verification.",
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
