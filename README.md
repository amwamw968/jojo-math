# 乔乔奥数

给 Jojo 用的四年级奥数练习本。题目、解析和知识点都在仓库的文件里，打开网页就能刷题、看解析、整理错题。没有账号。错题记录保存在自己的浏览器里，可以导出备份。

现在收录的是高思（爱学习）四年级秋季第 1 讲「冠军请听题」（运算能力）：

- 思维课本 `gs4a`，21 道
- 课后练习 `gs4a-hw`，24 道
- 每日一练第 1 周 `gs4a-dp`，10 道（`gs4a-dp-01-001` 到 `010`）

三本书都挂在讲次「高思四年级秋季 · 第 1 讲」。学而思四年级和学校数学思维社团先占着位置，讲次标题是待补，没有编造课名。

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

`validate` 会检查题目是否符合 [SCHEMA.md](SCHEMA.md)，知识点 id 能不能对上，配图在不在，`同题:` 是不是互相指向，以及每道题有没有挂到某一讲。

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

错题集在浏览器的 localStorage 里。页面上可以导出、导入 JSON，也可以打印复习单。换浏览器或清缓存之前先导出。

按薄弱知识点出新题：

```bash
npm run variants -- --kp arith-sum-of-squares --n 2 --seed 7
npm run variants -- --lecture gs-autumn-4-l01 --n 4 --seed 7
```

打印出来的是 JSON。同一个种子会得到同样的题，方便周日复盘时重印。网页上每一讲和错题集都有「举一反三」。

## 部署

静态站点。在 Cloudflare Pages 或 Vercel 里连接这个私有仓库即可，这里不会替你注册或登录。

| 平台 | 构建命令 | 输出目录 | 仓库里的配置 |
| --- | --- | --- | --- |
| Cloudflare Pages | `npm run build` | `dist` | `public/_redirects` 会进 `dist`，刷新 `/questions/某题` 不会 404 |
| Vercel | `npm run build` | `dist` | `vercel.json` 把找不到的路径交回 `index.html` |
| Netlify | `npm run build` | `dist` | 同样用 `public/_redirects` |

框架预设选 Vite 或其他都可以，只要构建命令和输出目录按上表。Node 选 20 或更新。

仓库保持私有时，题目不会出现在 GitHub 的公开页面上。免费托管出来的网址如果被人知道就能打开，因为网站本身没有登录。只在自己电脑上看，用 `npm run dev`。

GitHub Pages：私有仓库要付费计划（Pro、Team 或 Enterprise）。免费的 GitHub Pages 只给公开仓库。如果以后用项目页，构建时加上 `BASE_PATH=/仓库名/`。

## 来源说明

讲次的组织方式，以及「举一反三」这种按专题现算题目的做法，改编自 [kenowong/pep-math-coach](https://github.com/kenowong/pep-math-coach) 的 `js/oly-syllabus.js` 和 `js/olympiad.js`。那个仓库没有声明许可证。因此这些改编只放在私有仓库 `amwamw968/jojo-math` 里，不要再公开分发出去。对方的目录是每个年级 40 周；这里改成 Jojo 实际在上的三门课，并且只给已经收录的讲次写标题。变式题是参数化现算的，没有抄进原书的句子。
