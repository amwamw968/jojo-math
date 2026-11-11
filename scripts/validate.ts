import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ENGINE_IDS } from "../src/engine/engines";
import { katexFailure } from "../src/lib/katex-check";
import { CATEGORIES, JOJO_STATUSES, PUBLISHERS, QUESTION_TYPES } from "../src/lib/constants";
import { parseFrontmatter, parseIdList, parseRelated } from "../src/lib/frontmatter";
import { prerequisiteCycle } from "../src/lib/prerequisites";

const root = process.cwd();
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

const bookSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id 只能是小写字母、数字和短横线"),
    title: z.string().min(1, "标题不能为空"),
    publisher: z.enum(PUBLISHERS, {
      errorMap: () => ({ message: `publisher 必须是 ${PUBLISHERS.join("、")}` }),
    }),
    grade: z.number().int().min(1).max(12),
    term: z.string().min(1, "学期不能为空"),
  })
  .strict();

const questionSchema = z
  .object({
    id: z.string().min(1),
    book: z.string().min(1),
    chapter: z.string().regex(/^\d{2}$/, "章节要写成两位数字，例如 01"),
    chapter_title: z.string().min(1, "章节名不能为空"),
    lesson: z.string(),
    type: z.enum(QUESTION_TYPES, {
      errorMap: () => ({ message: `题型必须是 ${QUESTION_TYPES.join("、")}` }),
    }),
    page: z.number().int().positive("页码要是正整数"),
    knowledge_points: z.array(z.string().min(1)),
    difficulty: z.number().int().min(1).max(5),
    stem: z.string().min(1, "题干不能为空"),
    figure: z.string().min(1).nullable(),
    answer: z.string().min(1, "答案不能为空"),
    solution: z.string(),
    jojo: z
      .object({
        answer: z.string(),
        status: z.enum(JOJO_STATUSES, {
          errorMap: () => ({ message: `status 必须是 ${JOJO_STATUSES.join("、")}` }),
        }),
        note: z.string().optional(),
      })
      .strict()
      .nullable(),
    tags: z.array(z.string().min(1)),
  })
  .strict();

const indexEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "知识点 id 不合法"),
    title: z.string().min(1),
    category: z.enum(CATEGORIES, {
      errorMap: () => ({ message: `category 必须是 ${CATEGORIES.join("、")}` }),
    }),
  })
  .strict();

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${rel(file)}：JSON 无法解析（${error instanceof Error ? error.message : "未知错误"}）`);
    return undefined;
  }
}

function rel(file: string): string {
  return path.relative(root, file);
}

function reportZod(file: string, label: string, issues: z.ZodIssue[]) {
  for (const issue of issues) {
    const where = issue.path.join(".") || "内容";
    fail(`${rel(file)}${label}：${where} 不符合格式（${issue.message}）`);
  }
}

function walk(dir: string, pred: (name: string) => boolean): string[] {
  if (!statExists(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, pred));
    else if (pred(entry.name)) out.push(full);
  }
  return out.sort();
}

function statExists(file: string): boolean {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}

const booksFile = path.join(root, "data/books.json");
const booksParsed = readJson(booksFile);
const booksResult = z.array(bookSchema).safeParse(booksParsed);
const books = booksResult.success ? booksResult.data : [];
if (!booksResult.success && booksParsed !== undefined) {
  reportZod(booksFile, "", booksResult.error.issues);
}
const bookIds = new Set<string>();
for (const book of books) {
  if (bookIds.has(book.id)) fail(`data/books.json：书 id「${book.id}」重复`);
  bookIds.add(book.id);
}

const indexFile = path.join(root, "data/knowledge/index.json");
const indexParsed = readJson(indexFile);
const indexResult = z.array(indexEntrySchema).safeParse(indexParsed);
const indexEntries = indexResult.success ? indexResult.data : [];
if (!indexResult.success && indexParsed !== undefined) {
  reportZod(indexFile, "", indexResult.error.issues);
}
const knowledgeIds = new Set<string>();
for (const entry of indexEntries) {
  if (knowledgeIds.has(entry.id)) fail(`data/knowledge/index.json：知识点「${entry.id}」重复`);
  knowledgeIds.add(entry.id);
}

const knowledgeDir = path.join(root, "data/knowledge");
const mdFiles = walk(knowledgeDir, (name) => name.endsWith(".md"));
const mdIds = new Set<string>();
const prerequisiteEdges = new Map<string, string[]>();
for (const file of mdFiles) {
  const id = path.basename(file, ".md");
  mdIds.add(id);
  if (!knowledgeIds.has(id)) fail(`${rel(file)}：index.json 里没有这个知识点`);
  let raw = "";
  try {
    raw = readFileSync(file, "utf8");
  } catch (error) {
    fail(`${rel(file)}：无法读取（${error instanceof Error ? error.message : "未知错误"}）`);
    continue;
  }
  let parsed: ReturnType<typeof parseFrontmatter>;
  try {
    parsed = parseFrontmatter(raw);
  } catch (error) {
    fail(`${rel(file)}：${error instanceof Error ? error.message : "frontmatter 无法解析"}`);
    continue;
  }
  const entry = indexEntries.find((item) => item.id === id);
  if (parsed.data.id !== id) fail(`${rel(file)}：frontmatter 的 id 应为 ${id}`);
  if (entry && parsed.data.title !== entry.title) {
    fail(`${rel(file)}：标题和 index.json 不一致（${parsed.data.title} / ${entry.title}）`);
  }
  if (entry && parsed.data.category !== entry.category) {
    fail(`${rel(file)}：分类和 index.json 不一致`);
  }
  if (!parsed.body.trim()) fail(`${rel(file)}：正文是空的`);
  const mathProblem = katexFailure(parsed.body);
  if (mathProblem) fail(`${rel(file)}：正文公式 KaTeX 解析失败（${mathProblem}）`);
  let related: string[] = [];
  try {
    related = parseRelated(parsed.data.related);
  } catch (error) {
    fail(`${rel(file)}：${error instanceof Error ? error.message : "related 无法解析"}`);
    continue;
  }
  const seenRelated = new Set<string>();
  for (const relatedId of related) {
    if (relatedId === id) fail(`${rel(file)}：related 不要指向自己`);
    if (seenRelated.has(relatedId)) fail(`${rel(file)}：related 里「${relatedId}」重复`);
    seenRelated.add(relatedId);
    if (!knowledgeIds.has(relatedId)) fail(`${rel(file)}：related 的「${relatedId}」不是已知知识点`);
  }
  let prerequisites: string[] = [];
  try {
    prerequisites = parseIdList(parsed.data.prerequisites, "prerequisites");
  } catch (error) {
    fail(`${rel(file)}：${error instanceof Error ? error.message : "prerequisites 无法解析"}`);
    continue;
  }
  const seenPrereq = new Set<string>();
  for (const prereqId of prerequisites) {
    if (prereqId === id) fail(`${rel(file)}：先修不要指向自己`);
    if (seenPrereq.has(prereqId)) fail(`${rel(file)}：先修里「${prereqId}」重复`);
    seenPrereq.add(prereqId);
    if (!knowledgeIds.has(prereqId)) fail(`${rel(file)}：先修「${prereqId}」不是已知知识点`);
  }
  prerequisiteEdges.set(id, prerequisites);
}
for (const id of knowledgeIds) {
  if (!prerequisiteEdges.has(id)) prerequisiteEdges.set(id, []);
}
const cycle = prerequisiteCycle(prerequisiteEdges);
if (cycle) fail(`知识点先修成环：${cycle.join(" → ")}`);
for (const id of knowledgeIds) {
  if (!mdIds.has(id)) fail(`data/knowledge/${id}.md：index.json 有这个 id，但文件不存在`);
}

const questionFiles = walk(path.join(root, "data/questions"), (name) => name.endsWith(".json"));
const seenIds = new Set<string>();
const figureRefs = new Set<string>();
let questionCount = 0;
let workbookMistakes = 0;
const perBook = new Map<string, number>();
const sameLinks: { file: string; id: string; other: string }[] = [];
const tagsById = new Map<string, string[]>();

for (const file of questionFiles) {
  const parts = path.relative(path.join(root, "data/questions"), file).split(path.sep);
  if (parts.length !== 2) {
    fail(`${rel(file)}：题目文件应放在 data/questions/<书id>/<章节>.json`);
    continue;
  }
  const [folder, filename] = parts;
  const chapterFromName = filename.replace(/\.json$/, "");
  const parsed = readJson(file);
  if (parsed === undefined) continue;
  const result = z.array(questionSchema).safeParse(parsed);
  if (!result.success) {
    reportZod(file, "", result.error.issues);
    continue;
  }
  let chapterTitle = "";
  for (const question of result.data) {
    questionCount += 1;
    const label = ` · ${question.id || "未命名题目"}`;
    const idMatch = question.id.match(/^(.*)-(\d{2})-(\d{3})$/);
    if (!idMatch) {
      fail(`${rel(file)}${label}：id 必须是「书id-两位章节-三位序号」，例如 gs4a-01-003 或 gs4a-hw-01-001`);
    } else if (idMatch[1] !== question.book || idMatch[2] !== question.chapter) {
      fail(`${rel(file)}${label}：id 里的书或章节和字段不一致`);
    }
    if (seenIds.has(question.id)) fail(`${rel(file)}${label}：id 重复`);
    seenIds.add(question.id);
    if (!bookIds.has(question.book)) fail(`${rel(file)}${label}：books.json 里没有书「${question.book}」`);
    if (question.book !== folder) fail(`${rel(file)}${label}：所在文件夹是 ${folder}，book 字段却是 ${question.book}`);
    if (question.chapter !== chapterFromName) {
      fail(`${rel(file)}${label}：文件名章节是 ${chapterFromName}，chapter 字段却是 ${question.chapter}`);
    }
    if (!chapterTitle) chapterTitle = question.chapter_title;
    else if (question.chapter_title !== chapterTitle) {
      fail(`${rel(file)}${label}：同一章的 chapter_title 要一致`);
    }
    const kpSeen = new Set<string>();
    if (question.knowledge_points.length === 0) {
      fail(`${rel(file)}${label}：至少标一个知识点`);
    }
    for (const kp of question.knowledge_points) {
      if (kpSeen.has(kp)) fail(`${rel(file)}${label}：知识点「${kp}」重复`);
      kpSeen.add(kp);
      if (!knowledgeIds.has(kp)) fail(`${rel(file)}${label}：找不到知识点「${kp}」`);
    }
    if (question.figure) {
      const expected = `figures/${question.book}/${question.id}.png`;
      if (question.figure !== expected) {
        fail(`${rel(file)}${label}：figure 应是 ${expected}`);
      } else if (question.figure.includes("..")) {
        fail(`${rel(file)}${label}：figure 路径不合法`);
      } else {
        const disk = path.join(root, "public", question.figure);
        if (!statExists(disk)) fail(`${rel(file)}${label}：配图不存在 public/${question.figure}`);
        else figureRefs.add(question.figure);
      }
    }
    for (const field of ["stem", "answer", "solution"] as const) {
      const problem = katexFailure(question[field]);
      if (problem) fail(`${rel(file)}${label}：${field} 的公式 KaTeX 解析失败（${problem}）`);
    }
    if (question.jojo?.answer) {
      const problem = katexFailure(question.jojo.answer);
      if (problem) fail(`${rel(file)}${label}：jojo.answer 的公式 KaTeX 解析失败（${problem}）`);
    }
    if (question.jojo?.note) {
      const problem = katexFailure(question.jojo.note);
      if (problem) fail(`${rel(file)}${label}：jojo.note 的公式 KaTeX 解析失败（${problem}）`);
    }
    if (question.jojo?.status === "wrong" || question.jojo?.status === "partial") workbookMistakes += 1;
    perBook.set(question.book, (perBook.get(question.book) ?? 0) + 1);
    tagsById.set(question.id, question.tags);
    const seenSame = new Set<string>();
    for (const tag of question.tags) {
      if (!tag.startsWith("同题:")) continue;
      const other = tag.slice("同题:".length).trim();
      if (!other) {
        fail(`${rel(file)}${label}：同题标签缺少题目 id`);
        continue;
      }
      if (seenSame.has(other)) fail(`${rel(file)}${label}：同题「${other}」重复`);
      seenSame.add(other);
      if (other === question.id) fail(`${rel(file)}${label}：同题不能指向自己`);
      sameLinks.push({ file: rel(file), id: question.id, other });
    }
  }
}

for (const link of sameLinks) {
  if (!seenIds.has(link.other)) {
    fail(`${link.file} · ${link.id}：同题「${link.other}」不是题库里的题目`);
    continue;
  }
  const back = tagsById.get(link.other) ?? [];
  if (!back.includes(`同题:${link.id}`)) {
    fail(`${link.file} · ${link.id}：标了同题:${link.other}，但对方没有标回同题:${link.id}`);
  }
}

const figureFiles = walk(path.join(root, "public/figures"), () => true);
for (const file of figureFiles) {
  const figure = path.relative(path.join(root, "public"), file).split(path.sep).join("/");
  if (!figure.endsWith(".png")) {
    fail(`${rel(file)}：配图请使用 png`);
    continue;
  }
  if (!figureRefs.has(figure)) fail(`${rel(file)}：没有任何题目引用这张图`);
}

const syllabusFile = path.join(root, "data/syllabus.json");
const syllabusParsed = readJson(syllabusFile) as { tracks?: unknown } | undefined;
const trackSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    publisher: z.enum(PUBLISHERS),
    grade: z.number().int().min(1).max(12),
    term: z.string().min(1).nullable(),
    class_type: z.string().min(1).nullable(),
    note: z.string().optional(),
    lectures: z.array(
      z
        .object({
          id: z.string().regex(/^[a-z0-9-]+$/, "讲次 id 不合法"),
          number: z.number().int().positive().nullable(),
          title: z.string().min(1).nullable(),
          focus: z.string().min(1).nullable(),
          status: z.enum(["已收录", "待补"]),
          note: z.string().optional(),
          sources: z.array(
            z
              .object({
                book: z.string().min(1),
                chapter: z.string().regex(/^\d{2}$/),
              })
              .strict(),
          ),
          knowledge_points: z.array(z.string().min(1)),
          engines: z.array(z.string().min(1)),
        })
        .strict(),
    ),
  })
  .strict();
const syllabusSchema = z.object({ tracks: z.array(trackSchema).min(1) }).strict();
const syllabusResult = syllabusSchema.safeParse(syllabusParsed);
const covered = new Map<string, string>();
if (!syllabusResult.success && syllabusParsed !== undefined) {
  reportZod(syllabusFile, "", syllabusResult.error.issues);
} else if (syllabusResult.success) {
  const requiredTracks = ["gs-autumn-4", "xes-4", "club-4"];
  for (const id of requiredTracks) {
    if (!syllabusResult.data.tracks.some((track) => track.id === id)) {
      fail(`data/syllabus.json：缺少课程「${id}」`);
    }
  }
  const lectureIds = new Set<string>();
  for (const track of syllabusResult.data.tracks) {
    for (const lecture of track.lectures) {
      if (lectureIds.has(lecture.id)) fail(`data/syllabus.json：讲次「${lecture.id}」重复`);
      lectureIds.add(lecture.id);
      if (lecture.status === "待补") {
        if (lecture.title !== null) fail(`data/syllabus.json · ${lecture.id}：待补讲次的标题必须是 null，不能编名字`);
        if (lecture.sources.length > 0) fail(`data/syllabus.json · ${lecture.id}：待补讲次还不能挂题目`);
      } else if (!lecture.title) {
        fail(`data/syllabus.json · ${lecture.id}：已收录讲次必须有标题`);
      }
      for (const kp of lecture.knowledge_points) {
        if (!knowledgeIds.has(kp)) fail(`data/syllabus.json · ${lecture.id}：找不到知识点「${kp}」`);
      }
      for (const engine of lecture.engines) {
        if (!(ENGINE_IDS as readonly string[]).includes(engine)) {
          fail(`data/syllabus.json · ${lecture.id}：没有引擎「${engine}」`);
        }
      }
      for (const source of lecture.sources) {
        const key = `${source.book}/${source.chapter}`;
        if (!bookIds.has(source.book)) fail(`data/syllabus.json · ${lecture.id}：没有书「${source.book}」`);
        const questionFile = path.join(root, "data/questions", source.book, `${source.chapter}.json`);
        if (!statExists(questionFile)) fail(`data/syllabus.json · ${lecture.id}：没有题目文件 ${key}.json`);
        if (covered.has(key)) fail(`data/syllabus.json：${key} 同时挂在「${covered.get(key)}」和「${lecture.id}」`);
        covered.set(key, lecture.id);
      }
    }
  }
  const autumn = syllabusResult.data.tracks.find((track) => track.id === "gs-autumn-4");
  const lecture1 = autumn?.lectures.find((lecture) => lecture.number === 1);
  for (const source of [
    ["gs4a", "01"],
    ["gs4a-hw", "01"],
    ["gs4a-dp", "01"],
  ]) {
    if (!lecture1?.sources.some((item) => item.book === source[0] && item.chapter === source[1])) {
      fail(`data/syllabus.json：高思秋季第 1 讲必须包含 ${source[0]}/${source[1]}（每日一练和课后练习都算这一讲）`);
    }
  }
  for (const file of questionFiles) {
    const parts = path.relative(path.join(root, "data/questions"), file).split(path.sep);
    if (parts.length !== 2) continue;
    const key = `${parts[0]}/${parts[1].replace(/\.json$/, "")}`;
    if (!covered.has(key)) fail(`${rel(file)}：没有对应的讲次。请在 data/syllabus.json 里把这一章挂到某一讲`);
  }
}

if (errors.length > 0) {
  console.error(`数据检查没通过，共 ${errors.length} 处：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const bookSummary = books.map((book) => `${book.id} ${perBook.get(book.id) ?? 0}`).join("，");
console.log("数据检查通过。");
console.log(`  书：${books.length}（${bookSummary}）`);
console.log(`  题目：${questionCount}`);
console.log(`  知识点：${knowledgeIds.size}`);
console.log(`  配图：${figureRefs.size}`);
console.log(`  作业本错题（wrong/partial）：${workbookMistakes}`);
