import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const siteUrl = process.env.SITE_URL || "http://127.0.0.1:4000/";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = path.join(root, `.qa-browser-profile-${process.pid}`);

if (!fs.existsSync(chrome)) throw new Error(`Chrome not found: ${chrome}`);
fs.mkdirSync(profile, { recursive: true });

const browser = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, options) {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw lastError || new Error(`Unable to connect to ${url}`);
}

async function run() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("No Chrome page target found");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", { url: siteUrl });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await evaluate("document.readyState") === "complete") break;
    await delay(250);
  }
  await delay(600);

  const before = await evaluate(`({
    title: document.title,
    width: window.innerWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    lang: document.documentElement.dataset.lang,
    theme: document.documentElement.dataset.theme,
    hasEngineering: document.body.innerText.includes("Engineering Projects"),
    hasInProgress: document.body.innerText.includes("In Progress")
  })`);
  await evaluate("document.getElementById('lang-toggle').click()");
  const afterLanguage = await evaluate(`({
    lang: document.documentElement.dataset.lang,
    chineseVisible: getComputedStyle(document.querySelector('.lang-zh')).display !== 'none',
    englishHidden: getComputedStyle(document.querySelector('.lang-en')).display === 'none'
  })`);
  await evaluate("document.getElementById('theme-toggle').click()");
  const afterTheme = await evaluate(`({
    theme: document.documentElement.dataset.theme,
    background: getComputedStyle(document.body).backgroundColor
  })`);

  socket.close();
  const report = { before, afterLanguage, afterTheme };
  if (before.scrollWidth > before.width) throw new Error(`Horizontal overflow: ${before.scrollWidth}px > ${before.width}px`);
  if (afterLanguage.lang !== "zh" || !afterLanguage.chineseVisible || !afterLanguage.englishHidden) {
    throw new Error("Language toggle did not switch the visible language");
  }
  if (afterTheme.theme !== "dark") throw new Error("Theme toggle did not activate dark mode");
  console.log(JSON.stringify(report, null, 2));
}

try {
  await run();
} finally {
  browser.kill();
  await delay(300);
  const resolvedProfile = path.resolve(profile);
  if (resolvedProfile.startsWith(`${root}${path.sep}.qa-browser-profile-`)) {
    fs.rmSync(resolvedProfile, { recursive: true, force: true });
  }
}
