---
name: verify-jojo-math
description: >-
  Verify the 小学奥数智能学习平台 study site (jojo-math) in a desktop browser: question
  bank, KaTeX formulas, lecture variants, mistake notebook, knowledge pages,
  and the printable mistake sheet. Use after changing math rendering, layout,
  or those pages, and before delivering a UI change.
---

# Verify 乔乔奥数

The site is the Vite + React app in this repository. It is served locally from the production `dist` build. Evidence screenshots stay in `.cursor/skills/verify-jojo-math/evidence/` and are not deleted by cleanup.

Run the steps in order from the repository root.

## Launch

```bash
.cursor/skills/verify-jojo-math/scripts/launch.sh
```

This builds with `npm run build`, then starts `vite preview` on `http://127.0.0.1:4175` in its own process group. Ready when the log contains `Local:` and `curl -fsS http://127.0.0.1:4175/` returns HTML whose title is `小学奥数智能学习平台`. The script prints `ready http://127.0.0.1:4175/`. The pid is stored in `/tmp/jojo-math-verify.pid`.

Teardown is [Cleanup](#cleanup). Do not leave the preview running.

## Doctor

```bash
.cursor/skills/verify-jojo-math/scripts/doctor.sh
```

Read-only. It checks that port 4175 answers, the HTML title is `小学奥数智能学习平台`, and a headless Chrome page shows `[data-app="jojo-math"]`. It does not click, type, or change server state. A different site on that port fails the check.

## Drive

```bash
.cursor/skills/verify-jojo-math/scripts/drive.sh
```

Playwright drives system Chrome (`/usr/local/bin/google-chrome` or `/usr/bin/google-chrome`). It uses stable selectors only:

- `[data-app="jojo-math"]` and `[data-page="question|knowledge|lecture|print"]`
- `[data-math]` for rendered formulas
- `getByRole('button', { name: '点一点，看答案' })` to reveal an answer
- `getByRole('link', { name: '题库' })` from the home page

The route it walks:

1. `/` then the 题库 link.
2. `/questions/gs4a-01-012` (平方差, figure, KaTeX). Reveal the answer.
3. Resize that question to 390, 820, 1024, and 1440 CSS pixels and record each.
4. `/knowledge/arith-mountain-sum`
5. `/lectures/gs-autumn-4-l01`, reveal the first variant answer.
6. `/mistakes/print` with the “末页附上答案” checkbox checked.

At each stop it fails if `.katex-error` is not 0, if `.katex` is 0, if the visible text still contains `$...$`, `$$`, `\frac`, `\cdots`, `\times`, `\(`, or `\[`, or if the document is wider than the viewport.

## Evidence

Screenshots and `report.json` are written to `.cursor/skills/verify-jojo-math/evidence/`. Cleanup does not remove that directory.

- `question-detail-390.png`, `question-detail-820.png`, `question-detail-1024.png`, `question-detail-1440.png`
- `knowledge-1440.png`
- `lecture-1440.png`
- `print-1440.png`
- `report.json` lists each assertion.

## Cleanup

```bash
.cursor/skills/verify-jojo-math/scripts/cleanup.sh
```

Sends `TERM` then `KILL` only to the process group id stored in `/tmp/jojo-math-verify.pid`, then deletes that pid file. It does not kill Chrome, other ports, or the evidence directory.

## Helpers

| Script | Invocation |
| --- | --- |
| Launch | `.cursor/skills/verify-jojo-math/scripts/launch.sh` |
| Doctor | `.cursor/skills/verify-jojo-math/scripts/doctor.sh` |
| Drive and evidence | `.cursor/skills/verify-jojo-math/scripts/drive.sh` |
| Cleanup | `.cursor/skills/verify-jojo-math/scripts/cleanup.sh` |
| All four, in order | `.cursor/skills/verify-jojo-math/scripts/run.sh` |

Feature notes live in `.cursor/skills/verify-jojo-math/features/`.
