import type { Question } from "../types";

const SAME_PREFIX = "同题:";

export function sameProblemIds(question: Question): string[] {
  const ids: string[] = [];
  for (const tag of question.tags) {
    if (!tag.startsWith(SAME_PREFIX)) continue;
    const id = tag.slice(SAME_PREFIX.length).trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function hasOfficialAgreement(question: Question): boolean {
  return question.tags.includes("官方答案一致");
}
