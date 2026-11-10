# 知识点

## Sub-features

- The index is `data/knowledge/index.json`. Bodies are the matching markdown files, rendered by `MathText` on `/knowledge/:id`.
- Related knowledge links and the list of questions that cite the id sit under the article.
- `npm run validate` runs KaTeX on the markdown body.

## How to get to it (user POV)

Tap 知识点, then 山顶和公式（山峰数列）. The address is `/knowledge/arith-mountain-sum`. The page shows the squared-summit formula and a list of related problems.

## Driving it with Playwright

```js
await page.goto(origin + "/knowledge/arith-mountain-sum");
await page.locator('[data-page="knowledge"]').waitFor();
await page.locator("[data-math] .katex-display").first().waitFor();
```

## Gotchas

Display math is a `.katex-display` block that scrolls sideways inside `.math-text` instead of widening the page. The five ids are `arith-mountain-sum`, `arith-mountain-transform`, `arith-diff-of-squares`, `arith-sum-of-squares`, and `arith-arithmetic-series`.
