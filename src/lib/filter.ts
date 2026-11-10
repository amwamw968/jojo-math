import { stemPlain } from "./text";
import type { Question } from "../types";

export interface QuestionFilters {
  book: string;
  chapter: string;
  lesson: string;
  kp: string;
  type: string;
  difficulty: string;
  jojo: string;
  q: string;
}

export const EMPTY_FILTERS: QuestionFilters = {
  book: "",
  chapter: "",
  lesson: "",
  kp: "",
  type: "",
  difficulty: "",
  jojo: "",
  q: "",
};

function haystack(question: Question): string {
  return [
    question.id,
    question.stem,
    stemPlain(question.stem),
    question.lesson,
    question.chapter_title,
    question.tags.join(" "),
    question.answer,
    stemPlain(question.answer),
  ]
    .join("\n")
    .toLowerCase();
}

export function filterQuestions(questions: Question[], filters: QuestionFilters): Question[] {
  const query = filters.q.trim().toLowerCase();
  return questions.filter((question) => {
    if (filters.book && question.book !== filters.book) return false;
    if (filters.chapter && question.chapter !== filters.chapter) return false;
    if (filters.lesson && question.lesson !== filters.lesson) return false;
    if (filters.kp && !question.knowledge_points.includes(filters.kp)) return false;
    if (filters.type && question.type !== filters.type) return false;
    if (filters.difficulty && question.difficulty !== Number(filters.difficulty)) return false;
    if (filters.jojo === "note" && !question.jojo?.note?.trim()) return false;
    if (filters.jojo === "wrong" && question.jojo?.status !== "wrong") return false;
    if (filters.jojo === "partial" && question.jojo?.status !== "partial") return false;
    if (filters.jojo === "correct" && question.jojo?.status !== "correct") return false;
    if (filters.jojo === "none" && question.jojo) return false;
    if (query && !haystack(question).includes(query)) return false;
    return true;
  });
}

export interface LessonGroup {
  key: string;
  bookId: string;
  lesson: string;
  questions: Question[];
}

export function groupByLesson(questions: Question[]): LessonGroup[] {
  const groups: LessonGroup[] = [];
  for (const question of questions) {
    const key = `${question.book}:${question.lesson}`;
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) {
      groups.push({ key, bookId: question.book, lesson: question.lesson || "未分活动", questions: [question] });
    } else {
      last.questions.push(question);
    }
  }
  return groups;
}
