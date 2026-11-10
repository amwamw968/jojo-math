# 题目详情

## Sub-features

- Stem, figure, answer, and solution render through `MathText` (`src/pages/QuestionDetail.tsx`).
- Delimiters `$...$`, `$$...$$`, `\(...\)`, and `\[...\]` are normalized in `src/lib/katex-check.ts` before remark-math.
- 会了 / 不会 and 加入错题集 write to localStorage. 同题 links come from tags.

## How to get to it (user POV)

From 题库, tap a card. A direct example is 思维课本第 15 页的平方差题, address `/questions/gs4a-01-012`. Tap 点一点，看答案 to open the answer. The button label becomes 收起答案.

## Driving it with Playwright

```js
await page.goto(origin + "/questions/gs4a-01-012");
await page.locator('[data-page="question"]').waitFor();
await page.getByRole("button", { name: "点一点，看答案" }).click();
await page.locator("[data-math] .katex").first().waitFor();
```

Check widths 390, 820, 1024, and 1440. `.katex-error` must be 0 and the page must not be wider than the viewport.

## Gotchas

The answer is not in the DOM until the reveal button is pressed, so a formula check before the click only covers the stem. The figure is an `img` under `.figure`. Workbook notes that contain `$...$` also go through `MathText`.
