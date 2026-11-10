# 讲次和变式

## Sub-features

- `/lectures` lists three tracks from `data/syllabus.json`.
- `/lectures/gs-autumn-4-l01` shows 冠军请听题: sources, knowledge points, mistakes, every real problem, and 举一反三.
- Variants come from `generateVariants` in `src/engine/generate.ts`. 再出一组 changes the seed.

## How to get to it (user POV)

Tap 讲次, then the card 第 1 讲 冠军请听题（运算能力）. Scroll to 举一反三 and tap 点一点，看答案 on a new problem. 待补 cards have no problems and no drills.

## Driving it with Playwright

```js
await page.goto(origin + "/lectures/gs-autumn-4-l01");
await page.locator('[data-page="lecture"]').waitFor();
await page.getByRole("heading", { name: "举一反三" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "点一点，看答案" }).first().click();
```

## Gotchas

The first 点一点，看答案 on this page is inside a variant card, not a workbook question. Placeholder lecture ids are `gs-autumn-4-later`, `xes-4-unknown`, and `club-4-unknown`. Generated answers are numbers or short strings also passed through `MathText`.
