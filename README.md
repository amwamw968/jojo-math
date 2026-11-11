# 小学奥数智能学习平台

给 Jojo 用的四年级奥数练习本。题目、解析和知识点都在仓库的文件里，打开网页就能刷题、看解析、整理错题。没有账号。错题记录保存在自己的浏览器里，可以导出备份。

现在收录的是高思（爱学习）四年级秋季第 1 讲「冠军请听题」（运算能力）：

- 思维课本 `gs4a`，21 道
- 课后练习 `gs4a-hw`，24 道
- 每日一练第 1 周 `gs4a-dp`，10 道（`gs4a-dp-01-001` 到 `010`）

三本书都挂在讲次「高思四年级秋季 · 第 1 讲」。

学而思四年级秋季（班型在原书上没有印，标题里写班型待确认）：

- 讲义 `xes4a`，31 道（`xes4a-01-001` 到 `031`），第 1 讲「幂运算」
- 练习册 `xes4a-hw`，14 道：第 1 讲 12 道（`xes4a-hw-01-001` 到 `012`）；第 7 讲只录入第 6、8 题（`xes4a-hw-07-006`、`xes4a-hw-07-008`），中文课题名还没拍到

第 1 讲的讲义和练习册挂在「学而思四年级 · 第 1 讲」。第 7 讲挂在「学而思四年级 · 第 7 讲（课题名待补）」。学校数学思维社团仍是待补，没有编造课名。

## 本地运行

需要 Node.js 20 或更新。

```bash
npm install
npm run validate
npm run test
npm run dev
```

浏览器打开 http://localhost:5173 。

```bash
npm run typecheck
npm run build
npm run preview
```

`validate` 会检查题目是否符合 [SCHEMA.md](SCHEMA.md)，知识点 id 能不能对上，配图在不在，`同题:` 是不是互相指向，每道题有没有挂到某一讲，以及题干、答案、解析和知识点里的公式能不能被 KaTeX 解析。

## 怎么加题目

1. 新书先写进 `data/books.json`。`publisher` 只能是：高思、学而思、学校社团、其他。
2. 题目放在 `data/questions/<书id>/<章节两位>.json`，内容是数组。题目 id 必须是「书id-章节-三位序号」。书 id 可以带短横线，例如 `gs4a-hw-01-001`、`gs4a-dp-01-003`。
3. 知识点写在 `data/knowledge/<id>.md`，开头用 frontmatter（`id`、`title`、`category`、`related`），并在 `data/knowledge/index.json` 登记。分类用：计算、数论、几何、计数、应用题、逻辑。
4. 配图放在 `public/figures/<书id>/<题目id>.png`。题目里的 `figure` 写成 `figures/<书id>/<题目id>.png`，没有图就写 `null`。
5. 在 `data/syllabus.json` 里把这一章挂到某一讲的 `sources`。还没核对的讲次把 `title` 留成 `null`、`status` 写成 `待补`，不要先起名字。
6. 两道题如果是同一道，两边的 `tags` 都加上 `同题:对方id`。和官方答案相同可以加标签 `官方答案一致`。
7. 再跑一遍 `npm run validate`。

`jojo.status` 为 `wrong` 或 `partial` 会自动进错题集。`correct` 上的 `note` 只是作业本批注，会显示在题目上，不会自动算错题。

## 错题和变式

错题集、练习记录和间隔复习评分都在这台浏览器的 localStorage 里，分开放。页面上可以导出、导入 JSON，也可以打印复习单。导入会先检查格式并预览，取消或文件不合格时不会改本机记录。换浏览器或清缓存之前先导出。

练习页可以整本练、练还没做过的，或再练错题。错题集里的「再练这题」「再练待复习」打开的是同一页。会了、不会和跳过会留下练习记录，刷新还在。这不会改题目文件里的作业本对错，也不会自动记成间隔复习评分。

打印可以出待复习错题、这一轮不会的题，或已经到了复习时间的题。勾选后，末页附上答案。订正区留了横线。

间隔复习用依赖 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) 5.4.2（MIT）计算到期日，fuzz 关闭，同一串评分重放会得到同一个到期日。评分只有没记住、有点难、记住了、很熟，必须自己点。作业本的 correct、wrong、partial、unclear 不会换算过去。评分在 `jojo-math-review-v1`，练习记录在原来的 `jojo-math-v1`。周日在讲次页用同一个种子重印变式，那是出题引擎，不读这张到期表。

导出文件的类型是 `jojo-math-progress`、版本 1。以前只含练习记录的版本 1 文件仍能导入，并且不会因为文件里没有评分就删掉本机评分。题库里没有的题目 id 会列出来，不勾选跳过就不会写入。覆盖和清空都会先留一份恢复副本。读不出来的本机记录不会被空记录盖掉。

本仓库根目录没有项目许可证。ts-fsrs 5.4.2 的 MIT 全文在 `public/third-party/ts-fsrs-LICENSE.txt`（Copyright 2026 Open Spaced Repetition），校验用的 zod 的 MIT 全文在 `public/third-party/zod-LICENSE.txt`（Copyright 2025 Colin McDonnell）。两份都会随网站一并发布。题目、解析和配图的权利与这些代码许可分开。错题再练、可打印复习单和本机练习记录的想法来自 [shiyi-math-practice](https://github.com/jackli01030/shiyi-math-practice)，导入前校验和冲突预览的想法来自 [quizmill](https://github.com/quizmill/quizmill) 与 [quizer](https://github.com/sayre4ux/quizer)。没有复制这些仓库或 math-mastery 的代码、题目或图片。

按薄弱知识点出新题：

```bash
npm run variants -- --kp arith-sum-of-squares --n 2 --seed 7
npm run variants -- --lecture gs-autumn-4-l01 --n 4 --seed 7
```

打印出来的是 JSON。同一个种子会得到同样的题，方便周日复盘时重印。网页上每一讲和错题集都有「举一反三」。

## 部署到 GitHub Pages

网站地址是 https://amwamw968.github.io/jojo-math/ 。推到 `main` 之后，`.github/workflows/pages.yml` 会执行 `npm run build`（`BASE_PATH=/jojo-math/`），把 `dist` 交给 `actions/deploy-pages`。

本地预览仍用根路径。要在本地看和 Pages 一样的路径：

```bash
BASE_PATH=/jojo-math/ npm run build
npm run preview
```

打开 http://127.0.0.1:4173/jojo-math/ 。深链接靠构建时复制的 `dist/404.html`：GitHub Pages 找不到文件时会交出这份页面，地址栏仍停在原来的题目或讲次上。

第一次要在 GitHub 上打开 Pages，只做一次：

1. 打开仓库的 Settings → Pages。
2. Build and deployment 里，Source 选 **GitHub Actions**。
3. 把本分支合并进 `main`。工作流跑完后，上面的地址就可以打开。

网站没有登录。仓库公开后，知道地址的人都能看题。

Cloudflare Pages 或 Vercel 也可以接同一个构建：命令 `npm run build`，输出目录 `dist`。那时候不要设 `BASE_PATH`（站点在域名根上）。`public/_redirects` 和 `vercel.json` 是给这两种托管刷新子页面用的。

## 灵感来源

「一讲对应一组可出题的算法」这个想法，受到 [kenowong/pep-math-coach](https://github.com/kenowong/pep-math-coach) 的启发。那个仓库没有许可证，所以这里没有复制它的代码或 40 周目录。讲次表、变式题生成器都是为本仓库写的。
