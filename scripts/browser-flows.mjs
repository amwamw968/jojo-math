import { existsSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const origin = process.env.JOJO_ORIGIN ?? "http://127.0.0.1:4175";
const chrome = ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find((path) => existsSync(path));
if (!chrome) throw new Error("system Chrome was not found");

function assertThat(condition, message) {
  if (!condition) throw new Error(message);
}

async function storageSnapshot(page) {
  return page.evaluate(() => ({
    practice: localStorage.getItem("jojo-math-v1"),
    reviews: localStorage.getItem("jojo-math-review-v1"),
  }));
}

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const flow = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await flow.newPage();
await page.clock.install({ time: new Date("2026-01-01T00:00:00.000Z") });

await page.goto(`${origin}/mistakes`, { waitUntil: "networkidle" });
await page.locator('[data-page="mistakes"]').waitFor();
await page.getByRole("link", { name: "再练待复习" }).click();
await page.locator('[data-practice="session"]').waitFor();
await page.getByText("第 1 / 3 题").waitFor();
await page.getByText("原理复现").waitFor();
await page.getByRole("button", { name: "不会" }).click();
await page.goto(`${origin}/practice`, { waitUntil: "networkidle" });
await page.locator('[data-section="practice-history"]').getByText("不会").first().waitFor();
await page.reload({ waitUntil: "networkidle" });
await page.locator('[data-section="practice-history"]').getByText("不会").first().waitFor();

await page.goto(`${origin}/review?id=gs4a-01-012`, { waitUntil: "networkidle" });
await page.locator('[data-page="review"]').waitFor();
await page.getByText("做对了").waitFor();
await page.getByRole("button", { name: "点一点，看答案" }).click();
await page.getByRole("button", { name: "很熟" }).click();
await page.getByText("作业本上的对错没有改").waitFor();
await page.reload({ waitUntil: "networkidle" });
await page.getByText("做对了").waitFor();
await page.locator('[data-section="scheduled"]').getByText("gs4a-01-012").waitFor();

await page.goto(`${origin}/review?id=gs4a-hw-01-005`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "点一点，看答案" }).click();
await page.getByRole("button", { name: "没记住" }).click();
await page.getByText("下次到期").waitFor();
await page.clock.fastForward("24:00:00");
await page.goto(`${origin}/review`, { waitUntil: "networkidle" });
await page.locator('[data-section="due-reviews"]').getByText("gs4a-hw-01-005").waitFor();

await page.goto(`${origin}/mistakes/print`, { waitUntil: "networkidle" });
await page.locator('[data-print-kind="mistakes"]').waitFor();
await page.getByRole("checkbox", { name: "末页附上答案" }).check();
await page.locator(".answer-key").waitFor();
await page.locator(".lines").first().waitFor();
await page.goto(`${origin}/mistakes/print?kind=due`, { waitUntil: "networkidle" });
await page.locator('[data-print-kind="due"]').waitFor();
await page.getByText("gs4a-hw-01-005").waitFor();
await page.getByRole("checkbox", { name: "末页附上答案" }).check();
await page.locator(".answer-key").waitFor();
await flow.close();

const transfer = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const importPage = await transfer.newPage();
await importPage.goto(`${origin}/questions/gs4a-hw-01-005`, { waitUntil: "networkidle" });
await importPage.getByRole("button", { name: "不会" }).click();
await importPage.waitForFunction(() => {
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent === "不会");
  return button?.getAttribute("aria-pressed") === "true";
});
await importPage.reload({ waitUntil: "networkidle" });
await importPage.waitForFunction(() => {
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent === "不会");
  return button?.getAttribute("aria-pressed") === "true";
});
const before = await storageSnapshot(importPage);
await importPage.goto(`${origin}/mistakes`, { waitUntil: "networkidle" });

writeFileSync("/tmp/jojo-bad.json", "{");
await importPage.locator('input[type="file"]').setInputFiles("/tmp/jojo-bad.json");
await importPage.locator('[data-panel="import-preview"]').getByText("没有导入").waitFor();
assertThat(JSON.stringify(await storageSnapshot(importPage)) === JSON.stringify(before), "malformed import changed storage");
await importPage.getByRole("button", { name: "关闭" }).click();

const conflict = {
  type: "jojo-math-progress",
  version: 1,
  exportedAt: "2026-03-01T00:00:00.000Z",
  practice: {
    version: 1,
    practice: { "gs4a-hw-01-005": "会了" },
    manual: [],
    notes: { "gs4a-hw-01-005": "只在备份里的笔记" },
    mastered: {},
    activity: [],
    practiceLog: [],
  },
  reviews: { version: 1, events: [] },
};
writeFileSync("/tmp/jojo-conflict.json", JSON.stringify(conflict));
await importPage.locator('input[type="file"]').setInputFiles("/tmp/jojo-conflict.json");
await importPage.locator('[data-panel="import-preview"]').getByText("如果合并").waitFor();
assertThat(await importPage.getByRole("button", { name: "覆盖本机" }).isDisabled(), "replace was enabled before confirmation");
await importPage.getByRole("button", { name: "取消" }).click();
await importPage.locator('[data-panel="import-preview"]').waitFor({ state: "detached" });
assertThat(JSON.stringify(await storageSnapshot(importPage)) === JSON.stringify(before), "cancel changed storage");

await importPage.locator('input[type="file"]').setInputFiles("/tmp/jojo-conflict.json");
await importPage.getByRole("radio", { name: "冲突时留着本机的" }).check();
await importPage.getByRole("button", { name: "合并到本机" }).click();
await importPage.getByText("已合并到本机。").waitFor();
const merged = JSON.parse((await storageSnapshot(importPage)).practice ?? "{}");
assertThat(merged.practice["gs4a-hw-01-005"] === "不会", "merge keep-local lost the local mark");
assertThat(merged.notes["gs4a-hw-01-005"] === "只在备份里的笔记", "merge dropped the incoming note");
await importPage.reload({ waitUntil: "networkidle" });
const reloaded = JSON.parse((await storageSnapshot(importPage)).practice ?? "{}");
assertThat(reloaded.practice["gs4a-hw-01-005"] === "不会", "reload lost the kept mark");
assertThat(reloaded.notes["gs4a-hw-01-005"] === "只在备份里的笔记", "reload lost the merged note");

await importPage.locator('input[type="file"]').setInputFiles("/tmp/jojo-conflict.json");
await importPage.getByRole("checkbox", { name: "我确定用这份备份覆盖本机现在的记录" }).check();
await importPage.getByRole("button", { name: "覆盖本机" }).click();
await importPage.getByText("已按上面的说明覆盖").waitFor();
const replaced = JSON.parse((await storageSnapshot(importPage)).practice ?? "{}");
assertThat(replaced.practice["gs4a-hw-01-005"] === "会了", "replace did not apply the backup mark");
const recovery = await importPage.evaluate(() => localStorage.getItem("jojo-math-recovery-v1"));
assertThat(recovery?.includes("不会"), "recovery snapshot is missing the previous mark");
await importPage.getByRole("button", { name: "查看恢复副本" }).click();
await importPage.locator('[data-panel="import-preview"]').waitFor();
await importPage.getByRole("button", { name: "取消" }).click();
const afterCancelRecovery = JSON.parse((await storageSnapshot(importPage)).practice ?? "{}");
assertThat(afterCancelRecovery.practice["gs4a-hw-01-005"] === "会了", "cancelling recovery preview changed the replaced data");

await transfer.close();
await browser.close();
console.log("browser flows passed");
