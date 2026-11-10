# 题库

## Sub-features

- Filter by book, chapter, lesson, knowledge point, type, difficulty, and workbook status. Query keys live in `src/pages/Questions.tsx`.
- Each card renders the stem with KaTeX (`MathText` in `src/components/QuestionCard.tsx`), not a plain-text strip.
- Cards link to `/questions/<id>`.

## How to get to it (user POV)

Open the site, tap 题库 in the sidebar or the bottom bar. The page heading is 题库 and the count line starts with 共.

## Driving it with Playwright

```js
await page.getByRole("link", { name: "题库" }).first().click();
await page.locator('[data-page="questions"]').waitFor();
```

The preview origin in this skill is `http://127.0.0.1:4175`.

## Gotchas

The bottom bar uses the short label 题库 and is `position: fixed` under 980px, so a screenshot of the list can sit above that bar. Book chips are buttons, not links. Searching updates the `q` query immediately.
