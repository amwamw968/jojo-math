# jojo-math 题库数据格式 (v1)

仓库目录约定：
- data/books.json            书/课程列表: [{id, title, publisher(高思/学而思/学校社团/其他), grade, term}]
- data/questions/<book_id>/<chapter_id>.json   每章一个文件，内容为题目数组
- data/knowledge/<kp_id>.md  知识点总结（frontmatter: id, title, category, related[]），正文 Markdown + KaTeX
- data/knowledge/index.json  [{id, title, category}]  category 如 计算/数论/几何/计数/应用题/逻辑
- public/figures/<book_id>/<question_id>.png   题目配图（可选）

单道题 (Question)：
{
  "id": "gs4a-01-003",               // <book_id>-<chapter>-<序号>，全局唯一
  "book": "gs4a",
  "chapter": "01",
  "chapter_title": "冠军请听题",
  "lesson": "活动一 个人闯关赛",      // 小节/活动名，可空
  "type": "例题|试一试|实战|练习|拓展",
  "page": 6,                          // 原书页码（若可辨认）
  "knowledge_points": ["arith-gauss-sum"],   // 对应 data/knowledge 的 id
  "difficulty": 1,                    // 1-5
  "stem": "计算：$1+2+3+\\cdots+99+100$",     // Markdown + KaTeX ($...$ 行内, $$...$$ 独立)
  "figure": null,                     // "figures/gs4a/gs4a-01-003.png" 或 null
  "answer": "5050",                   // 标准答案（简短）
  "solution": "首尾配对……",           // 解析，Markdown + KaTeX，可空
  "jojo": {                           // Jojo 在原材料上的作答记录，没有作答则为 null
    "answer": "5050",
    "status": "correct|wrong|partial|unclear",
    "note": "第二步漏了括号"           // 可空
  },
  "tags": []
}
错题集 = 所有 jojo.status 为 wrong/partial 的题 + 网站上用户手动标记的错题（存浏览器 localStorage，可导出/导入 JSON）。

讲次（data/syllabus.json）：
- tracks[]：一门课。id、title、publisher、grade、term、class_type（未知则为 null）
- lectures[]：一讲。id、number（未知为 null）、title（待补必须是 null）、focus、status（已收录|待补）
- sources[]：{book, chapter}，指向 data/questions/<book>/<chapter>.json
- knowledge_points[]、engines[]：这一讲用到的知识点和变式引擎
每道题所在的书和章节必须出现在恰好一个已收录讲次的 sources 里。
标签里的 `同题:<题目id>` 表示两道题是同一道，两边都要写，并且 id 必须存在。
`官方答案一致` 只是备注，不改变对错。
