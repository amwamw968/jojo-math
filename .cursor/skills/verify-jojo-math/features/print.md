# 打印错题

## Sub-features

- Route `/mistakes/print` is outside the app sidebar (`src/App.tsx`).
- The sheet lists stems with KaTeX and blank 订正 lines. Checking 末页附上答案 adds `.answer-key`, which starts on a new page under `@page { size: A4 }` in `src/index.css`.
- Print CSS hides `.no-print`, the sidebar, and the toolbars.

## How to get to it (user POV)

From 错题集, tap 打印. On the preview, tick 末页附上答案 if the answers should be on the last page, then tap 打印. The browser print dialog uses A4.

## Driving it with Playwright

```js
await page.goto(origin + "/mistakes/print");
await page.locator('[data-page="print"]').waitFor();
await page.getByRole("checkbox", { name: "末页附上答案" }).check();
await page.locator(".answer-key").waitFor();
```

The fresh mistake is `gs4a-hw-01-005`, so the sheet is not empty.

## Gotchas

This route also sets `data-app="jojo-math"` because it does not use `Layout`. The answer key is absent from the DOM until the checkbox is checked. Do not call `window.print()` in the automated drive; it opens a dialog.
