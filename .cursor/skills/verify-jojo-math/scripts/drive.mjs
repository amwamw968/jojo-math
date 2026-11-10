import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const evidence = resolve(here, "../evidence");
const origin = "http://127.0.0.1:4175";
mkdirSync(evidence, { recursive: true });

const chrome = ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find((path) => existsSync(path));
if (!chrome) throw new Error("system Chrome was not found");

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
const report = [];

async function assertMath(label) {
  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      errors: document.querySelectorAll(".katex-error").length,
      katex: document.querySelectorAll(".katex").length,
      raw: /\\frac|\\cdots|\\times|\\\[|\\\(|\$\$|\$[^$\n]+\$/.test(text),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  });
  report.push({ label, ...result, url: page.url() });
  if (result.errors !== 0 || result.katex < 1 || result.raw || result.overflow) {
    throw new Error(`${label} failed ${JSON.stringify(result)}`);
  }
}

async function shot(name) {
  await page.screenshot({ path: resolve(evidence, name), fullPage: false });
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(origin + "/", { waitUntil: "networkidle" });
await page.locator('[data-app="jojo-math"]').waitFor();
await page.getByRole("link", { name: "题库" }).first().click();
await page.locator('[data-page="questions"]').waitFor();

await page.goto(origin + "/questions/gs4a-01-012", { waitUntil: "networkidle" });
await page.locator('[data-page="question"]').waitFor();
await page.getByRole("button", { name: "点一点，看答案" }).click();
await page.getByRole("button", { name: "收起答案" }).waitFor();

for (const width of [390, 820, 1024, 1440]) {
  await page.setViewportSize({ width, height: width < 800 ? 844 : 1100 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await assertMath(`question-${width}`);
  await shot(`question-detail-${width}.png`);
}

await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(origin + "/knowledge/arith-mountain-sum", { waitUntil: "networkidle" });
await page.locator('[data-page="knowledge"]').waitFor();
await assertMath("knowledge");
await shot("knowledge-1440.png");

await page.goto(origin + "/lectures/gs-autumn-4-l01", { waitUntil: "networkidle" });
await page.locator('[data-page="lecture"]').waitFor();
await page.getByRole("heading", { name: "举一反三" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "点一点，看答案" }).first().click();
await assertMath("lecture");
await shot("lecture-1440.png");

await page.goto(origin + "/mistakes/print", { waitUntil: "networkidle" });
await page.locator('[data-page="print"]').waitFor();
await page.getByRole("checkbox", { name: "末页附上答案" }).check();
await page.locator(".answer-key").waitFor();
await assertMath("print");
await shot("print-1440.png");

writeFileSync(resolve(evidence, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
console.log(`evidence written to ${evidence}`);
