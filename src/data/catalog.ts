import booksJson from "../../data/books.json";
import knowledgeIndexJson from "../../data/knowledge/index.json";
import { parseFrontmatter, parseRelated } from "../lib/frontmatter";
import type { Book, KnowledgeDoc, KnowledgeIndexEntry, Question } from "../types";

export const books = booksJson as Book[];
export const knowledgeIndex = knowledgeIndexJson as KnowledgeIndexEntry[];

const questionModules = import.meta.glob<Question[]>("../../data/questions/**/*.json", {
  eager: true,
  import: "default",
});

const knowledgeModules = import.meta.glob<string>("../../data/knowledge/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const bookOrder = new Map(books.map((book, index) => [book.id, index]));

export const questions: Question[] = Object.entries(questionModules)
  .map(([file, list]) => {
    const match = file.match(/questions\/(.+)\/([^/]+)\.json$/);
    return {
      book: match?.[1] ?? "",
      chapter: match?.[2] ?? "",
      list,
    };
  })
  .sort((a, b) => {
    const byBook = (bookOrder.get(a.book) ?? 99) - (bookOrder.get(b.book) ?? 99);
    if (byBook !== 0) return byBook;
    return a.chapter.localeCompare(b.chapter, "en");
  })
  .flatMap((entry) => entry.list);

function loadKnowledge(): KnowledgeDoc[] {
  return knowledgeIndex.map((entry) => {
    const file = Object.entries(knowledgeModules).find(([path]) => path.endsWith(`/${entry.id}.md`));
    if (!file) {
      throw new Error(`找不到知识点文件 ${entry.id}.md`);
    }
    const parsed = parseFrontmatter(file[1]);
    return {
      id: entry.id,
      title: parsed.data.title || entry.title,
      category: parsed.data.category || entry.category,
      related: parseRelated(parsed.data.related),
      body: parsed.body,
    };
  });
}

export const knowledgeDocs = loadKnowledge();

export const questionById = new Map(questions.map((question) => [question.id, question]));
export const bookById = new Map(books.map((book) => [book.id, book]));
export const knowledgeById = new Map(knowledgeDocs.map((doc) => [doc.id, doc]));

export function bookShort(bookId: string): string {
  const book = bookById.get(bookId);
  if (!book) return bookId;
  if (book.title.includes("每日一练")) return "每日一练";
  if (book.title.includes("课后练习")) return "课后练习";
  if (book.title.includes("课本")) return "思维课本";
  if (book.title.includes("讲义")) return "幂运算讲义";
  if (book.title.includes("幂运算") && book.title.includes("练习册")) return "幂运算练习册";
  if (book.title.includes("练习册")) return "学而思练习册";
  return book.title;
}

export function questionsForKnowledge(id: string): Question[] {
  return questions.filter((question) => question.knowledge_points.includes(id));
}

export function chapterOptions(bookId: string): { id: string; title: string }[] {
  const seen = new Map<string, string>();
  for (const question of questions) {
    if (bookId && question.book !== bookId) continue;
    const key = `${question.book}:${question.chapter}`;
    if (!seen.has(key)) seen.set(key, `${question.chapter} ${question.chapter_title}`);
  }
  return [...seen.entries()].map(([key, title]) => ({ id: key.split(":")[1], title }));
}

export function lessonOptions(bookId: string, chapter: string): string[] {
  const seen: string[] = [];
  for (const question of questions) {
    if (bookId && question.book !== bookId) continue;
    if (chapter && question.chapter !== chapter) continue;
    if (question.lesson && !seen.includes(question.lesson)) seen.push(question.lesson);
  }
  return seen;
}

export interface ChapterGroup {
  key: string;
  bookId: string;
  chapter: string;
  title: string;
  questions: Question[];
}

export function chapterGroups(): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  for (const question of questions) {
    const key = `${question.book}:${question.chapter}`;
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) {
      groups.push({
        key,
        bookId: question.book,
        chapter: question.chapter,
        title: question.chapter_title,
        questions: [question],
      });
    } else {
      last.questions.push(question);
    }
  }
  return groups;
}
