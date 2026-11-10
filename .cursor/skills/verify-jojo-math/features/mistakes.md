# 错题集

## Sub-features

- Membership is workbook `wrong` or `partial`, plus 不会 and manual adds (`src/lib/mistakes.ts`). Correct answers with a note stay out.
- Each row shows the stem with KaTeX, a 标记掌握 button, and a 复习笔记 textarea saved in localStorage.
- 举一反三 on this page calls `generateVariants` for the weak knowledge points, or for lecture `gs-autumn-4-l01` when nothing is waiting.

## How to get to it (user POV)

Tap 错题. The badge count matches 待复习. Filters are 待复习, 全部, and 已掌握. 打印 goes to the print view.

## Driving it with Playwright

```js
await page.goto(origin + "/mistakes");
await page.locator('[data-page="mistakes"]').waitFor();
await page.getByRole("button", { name: "待复习" }).waitFor();
```

The sample data has one partial question, `gs4a-hw-01-005`, so the list is not empty on a fresh browser.

## Gotchas

localStorage key is `jojo-math-v1` (`src/lib/constants.ts`). Import replaces the whole record after a confirm dialog. Drive should not call 清空本机记录.
