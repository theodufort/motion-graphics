import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const url = "file:///storage_block/motion-graphics/pgsodium-salted-hashing/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "networkidle" });
const info = await page.evaluate(() => ({
  hasSeek: typeof window.__time === "function",
  loop: (window.LOOP) || null,
  canvas: !!document.querySelector("canvas"),
}));
console.log(JSON.stringify({ errors, info }));
mkdirSync("shots/pgsodium-salted-hashing", { recursive: true });
if (info.hasSeek) await page.evaluate(() => window.__time(7500));
await page.screenshot({ path: "shots/pgsodium-salted-hashing/t7500.png" });
await browser.close();
console.log("shot saved");
