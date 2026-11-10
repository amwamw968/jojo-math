import { STORAGE_KEY } from "./constants";
import type { Activity, ActivityKind, PracticeMark, UserData } from "../types";

const KINDS: ActivityKind[] = ["不会", "会了", "加入错题", "移出错题", "掌握", "取消掌握"];

export function emptyUserData(): UserData {
  return { version: 1, practice: {}, manual: [], notes: {}, mastered: {}, activity: [] };
}

function isMark(value: unknown): value is PracticeMark {
  return value === "会了" || value === "不会";
}

export function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyUserData();
    const parsed: unknown = JSON.parse(raw);
    const result = parseImported(parsed);
    return result.ok ? result.data : emptyUserData();
  } catch {
    return emptyUserData();
  }
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function parseImported(
  input: unknown,
): { ok: true; data: UserData } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "文件内容不是一个对象。" };
  }
  const obj = input as Record<string, unknown>;
  if (obj.version !== 1) {
    return { ok: false, error: "只能导入版本 1 的记录。请用本网站导出的 JSON。" };
  }

  const practice: UserData["practice"] = {};
  if (obj.practice && typeof obj.practice === "object" && !Array.isArray(obj.practice)) {
    for (const [id, mark] of Object.entries(obj.practice as Record<string, unknown>)) {
      if (typeof id === "string" && isMark(mark)) practice[id] = mark;
    }
  } else if (obj.practice !== undefined) {
    return { ok: false, error: "practice 应该是对象。" };
  }

  const manual = Array.isArray(obj.manual)
    ? obj.manual.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  const notes: Record<string, string> = {};
  if (obj.notes && typeof obj.notes === "object" && !Array.isArray(obj.notes)) {
    for (const [id, note] of Object.entries(obj.notes as Record<string, unknown>)) {
      if (typeof note === "string" && note.trim()) notes[id] = note.slice(0, 2000);
    }
  }

  const mastered: Record<string, true> = {};
  if (obj.mastered && typeof obj.mastered === "object" && !Array.isArray(obj.mastered)) {
    for (const [id, value] of Object.entries(obj.mastered as Record<string, unknown>)) {
      if (value === true) mastered[id] = true;
    }
  }

  const activity: Activity[] = [];
  if (Array.isArray(obj.activity)) {
    for (const item of obj.activity) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (typeof row.questionId !== "string") continue;
      if (typeof row.at !== "string") continue;
      if (!KINDS.includes(row.kind as ActivityKind)) continue;
      activity.push({ questionId: row.questionId, at: row.at, kind: row.kind as ActivityKind });
      if (activity.length >= 200) break;
    }
  }

  return {
    ok: true,
    data: {
      version: 1,
      practice,
      manual: [...new Set(manual)],
      notes,
      mastered,
      activity,
    },
  };
}
