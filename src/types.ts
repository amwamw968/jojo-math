import type { JOJO_STATUSES, QUESTION_TYPES } from "./lib/constants";

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type JojoStatus = (typeof JOJO_STATUSES)[number];

export interface Book {
  id: string;
  title: string;
  publisher: string;
  grade: number;
  term: string;
}

export interface JojoRecord {
  answer: string;
  status: JojoStatus;
  note?: string;
}

export interface Question {
  id: string;
  book: string;
  chapter: string;
  chapter_title: string;
  lesson: string;
  type: QuestionType;
  page: number;
  knowledge_points: string[];
  difficulty: number;
  stem: string;
  figure: string | null;
  answer: string;
  solution: string;
  jojo: JojoRecord | null;
  tags: string[];
}

export interface KnowledgeIndexEntry {
  id: string;
  title: string;
  category: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  related: string[];
  /** Topics that should be learned before this one. Directed; not the same as `related`. */
  prerequisites: string[];
  body: string;
}

export type PracticeMark = "会了" | "不会";

export type ActivityKind = "不会" | "会了" | "加入错题" | "移出错题" | "掌握" | "取消掌握";

export interface Activity {
  questionId: string;
  at: string;
  kind: ActivityKind;
}

export type PracticeOutcome = PracticeMark | "跳过";

export interface PracticeLogEntry {
  id: string;
  sessionId: string;
  questionId: string;
  at: string;
  outcome: PracticeOutcome;
}

export interface UserData {
  version: 1;
  practice: Record<string, PracticeMark>;
  manual: string[];
  notes: Record<string, string>;
  mastered: Record<string, true>;
  activity: Activity[];
  practiceLog: PracticeLogEntry[];
}
