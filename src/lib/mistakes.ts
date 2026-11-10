import type { Question, UserData } from "../types";

export function isWorkbookMistake(question: Question): boolean {
  const status = question.jojo?.status;
  return status === "wrong" || status === "partial";
}

export function mistakeReasons(question: Question, user: UserData): string[] {
  const reasons: string[] = [];
  if (question.jojo?.status === "wrong") reasons.push("作业本做错了");
  if (question.jojo?.status === "partial") reasons.push("作业本部分对");
  if (user.practice[question.id] === "不会") reasons.push("练习时不会");
  if (user.manual.includes(question.id)) reasons.push("手动加入");
  return reasons;
}

export function isMistake(question: Question, user: UserData): boolean {
  return mistakeReasons(question, user).length > 0;
}

export function workbookNote(question: Question): string {
  return question.jojo?.note?.trim() ?? "";
}

export interface KpStat {
  id: string;
  title: string;
  category: string;
  total: number;
  unmastered: number;
}

export function knowledgeStats(
  questions: Question[],
  user: UserData,
  index: { id: string; title: string; category: string }[],
): KpStat[] {
  return index
    .map((entry) => {
      const related = questions.filter((question) => question.knowledge_points.includes(entry.id));
      const unmastered = related.filter(
        (question) => isMistake(question, user) && !user.mastered[question.id],
      ).length;
      return { ...entry, total: related.length, unmastered };
    })
    .sort((a, b) => b.unmastered - a.unmastered || b.total - a.total);
}

export function recentMistakes(questions: Question[], user: UserData): Question[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set<string>();
  const result: Question[] = [];
  for (const item of user.activity) {
    if (item.kind !== "不会" && item.kind !== "加入错题") continue;
    const question = byId.get(item.questionId);
    if (!question || seen.has(question.id) || !isMistake(question, user)) continue;
    seen.add(question.id);
    result.push(question);
    if (result.length >= 5) return result;
  }
  for (const question of questions) {
    if (seen.has(question.id) || !isWorkbookMistake(question)) continue;
    result.push(question);
    if (result.length >= 5) break;
  }
  return result;
}
