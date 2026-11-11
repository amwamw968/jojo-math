// Progress files are checked before anything is written.
// Cancel, invalid files, and unconfirmed overwrite leave the caller's snapshot as-is.
// Review events stay in their own list. This module never reads or writes workbook jojo.status.

import { z } from "zod";
import type { Activity, PracticeLogEntry, UserData } from "../types";
import type { ReviewEvent } from "./review-schedule";

export const PROGRESS_TYPE = "jojo-math-progress";

export const PROGRESS_LIMITS = {
  maxTextChars: 1_500_000,
  maxPractice: 2000,
  maxManual: 2000,
  maxNotes: 2000,
  maxNoteChars: 2000,
  maxActivity: 200,
  maxPracticeLog: 2000,
  maxReviewEvents: 5000,
} as const;

const questionId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "题目 id 不合法").max(80);
const recordId = z.string().min(1).max(80);
const version = z.literal(1, { errorMap: () => ({ message: "只能是 1" }) });

const activitySchema = z
  .object({
    questionId,
    at: z.string().datetime(),
    kind: z.enum(["不会", "会了", "加入错题", "移出错题", "掌握", "取消掌握"]),
  })
  .strict();

const practiceLogSchema = z
  .object({
    id: recordId,
    sessionId: recordId,
    questionId,
    at: z.string().datetime(),
    outcome: z.enum(["会了", "不会", "跳过"]),
  })
  .strict();

const reviewEventSchema = z
  .object({
    id: recordId,
    questionId,
    rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    reviewedAt: z.string().datetime(),
  })
  .strict();

const userSchema = z
  .object({
    version,
    practice: z
      .record(questionId, z.enum(["会了", "不会"]))
      .refine((value) => Object.keys(value).length <= PROGRESS_LIMITS.maxPractice, "练习标记太多"),
    manual: z.array(questionId).max(PROGRESS_LIMITS.maxManual),
    notes: z
      .record(questionId, z.string().min(1).max(PROGRESS_LIMITS.maxNoteChars))
      .refine((value) => Object.keys(value).length <= PROGRESS_LIMITS.maxNotes, "笔记太多"),
    mastered: z
      .record(questionId, z.literal(true))
      .refine((value) => Object.keys(value).length <= PROGRESS_LIMITS.maxPractice, "掌握标记太多"),
    activity: z.array(activitySchema).max(PROGRESS_LIMITS.maxActivity),
    practiceLog: z.array(practiceLogSchema).max(PROGRESS_LIMITS.maxPracticeLog).optional(),
    exportedAt: z.string().datetime().optional(),
  })
  .strict();

const reviewStoreSchema = z
  .object({
    version,
    events: z.array(reviewEventSchema).max(PROGRESS_LIMITS.maxReviewEvents),
  })
  .strict();

const envelopeSchema = z
  .object({
    type: z.literal(PROGRESS_TYPE, { errorMap: () => ({ message: "类型必须是 jojo-math-progress" }) }),
    version,
    exportedAt: z.string().datetime(),
    practice: userSchema,
    reviews: reviewStoreSchema,
  })
  .strict();

export interface ProgressSnapshot {
  practice: UserData;
  reviews: ReviewEvent[];
}

export interface IncomingProgress {
  practice: UserData;
  reviews: ReviewEvent[] | null;
}

export interface ProgressPreview {
  errors: string[];
  notes: string[];
  unknownIds: string[];
  legacy: boolean;
  incoming: IncomingProgress | null;
}

export type ConflictChoice = "keep-local" | "take-incoming";

export type ProgressAction =
  | { type: "cancel" }
  | { type: "merge"; conflict: ConflictChoice; dropUnknown: boolean }
  | { type: "replace"; confirm: boolean; dropUnknown: boolean };

export interface ProgressResult {
  ok: boolean;
  error: string | null;
  next: ProgressSnapshot;
  effects: string[];
  recovery: ProgressSnapshot | null;
}

type ParsedDocument =
  | { ok: true; legacy: boolean; notes: string[]; incoming: IncomingProgress }
  | { ok: false; errors: string[] };

export function emptyUserData(): UserData {
  return { version: 1, practice: {}, manual: [], notes: {}, mastered: {}, activity: [], practiceLog: [] };
}

export function emptyProgress(): ProgressSnapshot {
  return { practice: emptyUserData(), reviews: [] };
}

export function invalidProgress(message: string): ProgressPreview {
  return { errors: [message], notes: [], unknownIds: [], legacy: false, incoming: null };
}

export function exportProgress(snapshot: ProgressSnapshot, exportedAt: string) {
  return {
    type: PROGRESS_TYPE,
    version: 1 as const,
    exportedAt,
    practice: {
      version: 1 as const,
      practice: snapshot.practice.practice,
      manual: snapshot.practice.manual,
      notes: snapshot.practice.notes,
      mastered: snapshot.practice.mastered,
      activity: snapshot.practice.activity,
      practiceLog: snapshot.practice.practiceLog,
    },
    reviews: { version: 1 as const, events: snapshot.reviews },
  };
}

export function parseStoredPractice(input: unknown): { ok: true; data: UserData } | { ok: false; error: string } {
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(formatIssue).join(" ") };
  const practice = normalizePractice(parsed.data);
  if (!practice.ok) return practice;
  return { ok: true, data: practice.data };
}

export function parseStoredReviews(input: unknown): { ok: true; events: ReviewEvent[] } | { ok: false; error: string } {
  const parsed = reviewStoreSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(formatIssue).join(" ") };
  const events = dedupeEvents(parsed.data.events);
  if (!events.ok) return events;
  return { ok: true, events: events.events };
}

export function parseRecovery(input: unknown): { ok: true; data: ProgressSnapshot } | { ok: false; error: string } {
  const parsed = parseProgressDocument(input);
  if (!parsed.ok) return { ok: false, error: parsed.errors.join(" ") };
  if (parsed.incoming.reviews === null) return { ok: false, error: "恢复副本里没有复习评分。" };
  return { ok: true, data: { practice: parsed.incoming.practice, reviews: parsed.incoming.reviews } };
}

export function inspectProgress(input: unknown, catalogIds: ReadonlySet<string>): ProgressPreview {
  const parsed = parseProgressDocument(input);
  if (!parsed.ok) return { errors: parsed.errors, notes: [], unknownIds: [], legacy: false, incoming: null };
  return {
    errors: [],
    notes: parsed.notes,
    unknownIds: collectUnknown(parsed.incoming, catalogIds),
    legacy: parsed.legacy,
    incoming: parsed.incoming,
  };
}

export function inspectProgressText(text: string, catalogIds: ReadonlySet<string>): ProgressPreview {
  if (text.length > PROGRESS_LIMITS.maxTextChars) return invalidProgress("文件太大。");
  try {
    return inspectProgress(JSON.parse(text) as unknown, catalogIds);
  } catch {
    return invalidProgress("这个文件不是能用的 JSON。");
  }
}

export function applyProgress(
  current: ProgressSnapshot,
  preview: ProgressPreview,
  action: ProgressAction,
  catalogIds: ReadonlySet<string>,
): ProgressResult {
  if (action.type === "cancel") return { ok: true, error: null, next: current, effects: [], recovery: null };
  if (preview.errors.length || !preview.incoming) {
    return { ok: false, error: preview.errors[0] ?? "文件没有通过检查。", next: current, effects: [], recovery: null };
  }
  const unknown = collectUnknown(preview.incoming, catalogIds);
  if (unknown.length && !("dropUnknown" in action && action.dropUnknown)) {
    return { ok: false, error: "还有题库里没有的题目，没有写入。", next: current, effects: [], recovery: null };
  }
  if (action.type === "replace" && !action.confirm) {
    return { ok: false, error: "覆盖需要先确认。", next: current, effects: [], recovery: null };
  }
  const incoming = unknown.length ? dropUnknownIds(preview.incoming, new Set(unknown)) : preview.incoming;
  if (action.type === "merge") {
    const merged = mergeSnapshot(current, incoming, action.conflict);
    if (progressEqual(current, merged.next)) {
      const effects = [...preview.notes];
      if (unknown.length) effects.push(`会跳过题库里没有的题目：${formatIds(unknown)}。`);
      effects.push("和本机相比，没有要改的内容。");
      return { ok: true, error: null, next: current, effects, recovery: null };
    }
    return {
      ok: true,
      error: null,
      next: merged.next,
      effects: describeChange(current, merged.next, incoming, preview.notes, unknown, merged.overflow, "merge"),
      recovery: null,
    };
  }
  const next = replaceSnapshot(current, incoming);
  return {
    ok: true,
    error: null,
    next,
    effects: describeChange(current, next, incoming, preview.notes, unknown, [], "replace"),
    recovery: current,
  };
}

export function progressEqual(a: ProgressSnapshot, b: ProgressSnapshot): boolean {
  return JSON.stringify(sortKeys(canonicalize(a))) === JSON.stringify(sortKeys(canonicalize(b)));
}

function parseProgressDocument(input: unknown): ParsedDocument {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, errors: ["文件内容不是一个对象。"] };
  const record = input as Record<string, unknown>;
  if ("type" in record) return parseEnvelope(record);
  return parseLegacy(record);
}

function parseEnvelope(input: Record<string, unknown>): ParsedDocument {
  const parsed = envelopeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map(formatIssue) };
  const practice = normalizePractice(parsed.data.practice);
  if (!practice.ok) return { ok: false, errors: [practice.error] };
  const events = dedupeEvents(parsed.data.reviews.events);
  if (!events.ok) return { ok: false, errors: [events.error] };
  return {
    ok: true,
    legacy: false,
    notes: [...practice.notes, ...events.notes],
    incoming: { practice: practice.data, reviews: events.events },
  };
}

function parseLegacy(input: Record<string, unknown>): ParsedDocument {
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map(formatIssue) };
  const practice = normalizePractice(parsed.data);
  if (!practice.ok) return { ok: false, errors: [practice.error] };
  return {
    ok: true,
    legacy: true,
    notes: ["这是以前的练习备份，里面没有复习评分。", ...practice.notes],
    incoming: { practice: practice.data, reviews: null },
  };
}

function normalizePractice(
  parsed: z.infer<typeof userSchema>,
): { ok: true; data: UserData; notes: string[] } | { ok: false; error: string } {
  const notes: string[] = [];
  const manual = [...new Set(parsed.manual)];
  if (manual.length !== parsed.manual.length) notes.push("手动加入里的重复题目会合成一条。");
  const logs = dedupeLogs(parsed.practiceLog ?? []);
  if (!logs.ok) return logs;
  notes.push(...logs.notes);
  const activity = dedupeActivity(parsed.activity);
  if (activity.length !== parsed.activity.length) notes.push("完全相同的活动记录会合成一条。");
  return {
    ok: true,
    notes,
    data: {
      version: 1,
      practice: parsed.practice,
      manual,
      notes: parsed.notes,
      mastered: parsed.mastered,
      activity,
      practiceLog: logs.logs,
    },
  };
}

function dedupeLogs(
  entries: PracticeLogEntry[],
): { ok: true; logs: PracticeLogEntry[]; notes: string[] } | { ok: false; error: string } {
  const map = new Map<string, PracticeLogEntry>();
  let same = 0;
  for (const entry of entries) {
    const existing = map.get(entry.id);
    if (!existing) {
      map.set(entry.id, entry);
      continue;
    }
    if (!sameLog(existing, entry)) return { ok: false, error: `练习记录「${entry.id}」重复了，但内容不一样。` };
    same += 1;
  }
  return { ok: true, logs: [...map.values()], notes: same ? [`有 ${same} 条重复的练习记录，会只留一条。`] : [] };
}

function dedupeEvents(events: ReviewEvent[]): { ok: true; events: ReviewEvent[]; notes: string[] } | { ok: false; error: string } {
  const byId = new Map<string, ReviewEvent>();
  const seenContent = new Set<string>();
  let sameId = 0;
  let sameContent = 0;
  for (const event of events) {
    const existing = byId.get(event.id);
    if (existing) {
      if (!sameEvent(existing, event)) return { ok: false, error: `复习评分「${event.id}」重复了，但内容不一样。` };
      sameId += 1;
      continue;
    }
    const content = `${event.questionId}|${event.reviewedAt}|${event.rating}`;
    if (seenContent.has(content)) {
      sameContent += 1;
      continue;
    }
    seenContent.add(content);
    byId.set(event.id, event);
  }
  const notes: string[] = [];
  if (sameId) notes.push(`有 ${sameId} 条重复的复习评分，会只留一条。`);
  if (sameContent) notes.push(`有 ${sameContent} 条题目、时间和评分都相同的记录，会只留一条。`);
  return { ok: true, events: [...byId.values()], notes };
}

function dedupeActivity(entries: Activity[]): Activity[] {
  const seen = new Set<string>();
  const result: Activity[] = [];
  for (const entry of entries) {
    const key = `${entry.questionId}|${entry.at}|${entry.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

function collectUnknown(incoming: IncomingProgress, catalogIds: ReadonlySet<string>): string[] {
  const ids = new Set<string>();
  const consider = (id: string) => {
    if (!catalogIds.has(id)) ids.add(id);
  };
  for (const id of Object.keys(incoming.practice.practice)) consider(id);
  for (const id of incoming.practice.manual) consider(id);
  for (const id of Object.keys(incoming.practice.notes)) consider(id);
  for (const id of Object.keys(incoming.practice.mastered)) consider(id);
  for (const item of incoming.practice.activity) consider(item.questionId);
  for (const item of incoming.practice.practiceLog) consider(item.questionId);
  for (const event of incoming.reviews ?? []) consider(event.questionId);
  return [...ids].sort();
}

function dropUnknownIds(incoming: IncomingProgress, unknown: Set<string>): IncomingProgress {
  const practice = clonePractice(incoming.practice);
  for (const id of unknown) {
    delete practice.practice[id];
    delete practice.notes[id];
    delete practice.mastered[id];
  }
  practice.manual = practice.manual.filter((id) => !unknown.has(id));
  practice.activity = practice.activity.filter((item) => !unknown.has(item.questionId));
  practice.practiceLog = practice.practiceLog.filter((item) => !unknown.has(item.questionId));
  return {
    practice,
    reviews: incoming.reviews === null ? null : incoming.reviews.filter((event) => !unknown.has(event.questionId)).map((event) => ({ ...event })),
  };
}

function mergeSnapshot(
  current: ProgressSnapshot,
  incoming: IncomingProgress,
  conflict: ConflictChoice,
): { next: ProgressSnapshot; overflow: string[] } {
  const overflow: string[] = [];
  const practice = { ...current.practice.practice };
  for (const [id, mark] of Object.entries(incoming.practice.practice)) {
    if (!(id in practice) || (practice[id] !== mark && conflict === "take-incoming")) practice[id] = mark;
  }
  const notes = { ...current.practice.notes };
  for (const [id, note] of Object.entries(incoming.practice.notes)) {
    if (!(id in notes) || (notes[id] !== note && conflict === "take-incoming")) notes[id] = note;
  }
  const mastered = { ...current.practice.mastered };
  for (const id of Object.keys(incoming.practice.mastered)) mastered[id] = true;
  const manual = [...current.practice.manual];
  for (const id of incoming.practice.manual) if (!manual.includes(id)) manual.push(id);

  const activitySeen = new Set<string>();
  const activity: Activity[] = [];
  for (const item of [...current.practice.activity, ...incoming.practice.activity]) {
    const key = `${item.questionId}|${item.at}|${item.kind}`;
    if (activitySeen.has(key)) continue;
    activitySeen.add(key);
    activity.push({ ...item });
  }
  activity.sort((a, b) => b.at.localeCompare(a.at) || a.questionId.localeCompare(b.questionId) || a.kind.localeCompare(b.kind, "zh"));
  if (activity.length > PROGRESS_LIMITS.maxActivity) {
    overflow.push(`活动记录超过 ${PROGRESS_LIMITS.maxActivity} 条，只留下最近的 ${PROGRESS_LIMITS.maxActivity} 条。`);
    activity.length = PROGRESS_LIMITS.maxActivity;
  }

  const logs = new Map<string, PracticeLogEntry>();
  for (const item of current.practice.practiceLog) logs.set(item.id, { ...item });
  for (const item of incoming.practice.practiceLog) {
    const local = logs.get(item.id);
    if (!local || (!sameLog(local, item) && conflict === "take-incoming")) logs.set(item.id, { ...item });
  }
  const practiceLog = [...logs.values()].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  if (practiceLog.length > PROGRESS_LIMITS.maxPracticeLog) {
    overflow.push(`练习记录超过 ${PROGRESS_LIMITS.maxPracticeLog} 条，只留下最近的 ${PROGRESS_LIMITS.maxPracticeLog} 条。`);
    practiceLog.splice(0, practiceLog.length - PROGRESS_LIMITS.maxPracticeLog);
  }

  let reviews: ReviewEvent[];
  if (incoming.reviews === null) reviews = current.reviews.map((event) => ({ ...event }));
  else {
    const map = new Map<string, ReviewEvent>();
    for (const event of current.reviews) map.set(event.id, { ...event });
    for (const event of incoming.reviews) {
      const local = map.get(event.id);
      if (!local || (!sameEvent(local, event) && conflict === "take-incoming")) map.set(event.id, { ...event });
    }
    reviews = [...map.values()].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt) || a.id.localeCompare(b.id));
    if (reviews.length > PROGRESS_LIMITS.maxReviewEvents) {
      overflow.push(`复习评分超过 ${PROGRESS_LIMITS.maxReviewEvents} 条，只留下最近的 ${PROGRESS_LIMITS.maxReviewEvents} 条。`);
      reviews = reviews.slice(reviews.length - PROGRESS_LIMITS.maxReviewEvents);
    }
  }

  return {
    next: { practice: { version: 1, practice, manual, notes, mastered, activity, practiceLog }, reviews },
    overflow,
  };
}

function replaceSnapshot(current: ProgressSnapshot, incoming: IncomingProgress): ProgressSnapshot {
  return {
    practice: clonePractice(incoming.practice),
    reviews: incoming.reviews === null ? current.reviews.map((event) => ({ ...event })) : incoming.reviews.map((event) => ({ ...event })),
  };
}

function describeChange(
  before: ProgressSnapshot,
  after: ProgressSnapshot,
  incoming: IncomingProgress,
  notes: string[],
  unknown: string[],
  overflow: string[],
  mode: "merge" | "replace",
): string[] {
  if (progressEqual(before, after)) {
    const lines = [...notes];
    if (mode === "replace") lines.push("覆盖前会先留下恢复副本。");
    lines.push("和本机相比，没有要改的内容。");
    return lines;
  }
  const lines = [...notes];
  if (mode === "merge") lines.push("合并会保留本机独有的记录。");
  if (mode === "replace") lines.push("覆盖会换成备份里的练习记录。覆盖前会先留下恢复副本。");
  if (unknown.length) lines.push(`会跳过题库里没有的题目：${formatIds(unknown)}。`);
  if (incoming.reviews === null) lines.push(`这份备份没有复习评分，本机的 ${before.reviews.length} 条会保留。`);

  const markConflicts: string[] = [];
  const addedMarks: string[] = [];
  const removedMarks: string[] = [];
  for (const id of [...new Set([...Object.keys(before.practice.practice), ...Object.keys(incoming.practice.practice)])].sort()) {
    const local = before.practice.practice[id];
    const inc = incoming.practice.practice[id];
    const next = after.practice.practice[id];
    if (local && inc && local !== inc) {
      markConflicts.push(`「${id}」的练习标记有冲突：本机是「${local}」，备份是「${inc}」，采用「${next ?? "去掉"}」。`);
      continue;
    }
    if (!local && next) addedMarks.push(`会新记下「${id}」：${next}。`);
    if (local && !next) removedMarks.push(`会去掉练习标记「${id}」。`);
  }
  pushCapped(lines, markConflicts);
  pushCapped(lines, addedMarks);
  pushCapped(lines, removedMarks);

  const noteConflicts: string[] = [];
  const noteAdded: string[] = [];
  const noteRemoved: string[] = [];
  for (const id of [...new Set([...Object.keys(before.practice.notes), ...Object.keys(incoming.practice.notes)])].sort()) {
    const local = before.practice.notes[id];
    const inc = incoming.practice.notes[id];
    const next = after.practice.notes[id];
    if (local && inc && local !== inc) {
      noteConflicts.push(`「${id}」的复习笔记有冲突：采用${next === inc ? "备份" : "本机"}。`);
      continue;
    }
    if (!local && next) noteAdded.push(id);
    if (local && !next) noteRemoved.push(id);
  }
  if (noteAdded.length) lines.push(`会写入复习笔记 ${formatIds(noteAdded)}。`);
  if (noteRemoved.length) lines.push(`会去掉复习笔记 ${formatIds(noteRemoved)}。`);
  pushCapped(lines, noteConflicts);

  idDiff(Object.keys(before.practice.mastered), Object.keys(after.practice.mastered), "会标成已掌握：", "会取消已掌握：", lines);
  idDiff(before.practice.manual, after.practice.manual, "会加入手动错题：", "会移出手动错题：", lines);

  if (before.practice.activity.length !== after.practice.activity.length) {
    lines.push(`活动记录从 ${before.practice.activity.length} 条变成 ${after.practice.activity.length} 条。`);
  }

  const beforeLogs = new Map(before.practice.practiceLog.map((item) => [item.id, item]));
  const afterLogs = new Map(after.practice.practiceLog.map((item) => [item.id, item]));
  const logConflicts: string[] = [];
  let logAdded = 0;
  for (const item of incoming.practice.practiceLog) {
    const local = beforeLogs.get(item.id);
    const next = afterLogs.get(item.id);
    if (local && !sameLog(local, item)) logConflicts.push(`练习记录「${item.id}」有冲突：采用${next && sameLog(next, item) ? "备份" : "本机"}。`);
    else if (!local && next) logAdded += 1;
  }
  if (logAdded) lines.push(`会加上 ${logAdded} 条练习记录。`);
  const logRemoved = before.practice.practiceLog.filter((item) => !afterLogs.has(item.id)).length;
  if (logRemoved) lines.push(`会去掉 ${logRemoved} 条练习记录。`);
  pushCapped(lines, logConflicts);

  if (incoming.reviews !== null) {
    const localEvents = new Map(before.reviews.map((event) => [event.id, event]));
    const nextEvents = new Map(after.reviews.map((event) => [event.id, event]));
    const reviewConflicts: string[] = [];
    let added = 0;
    for (const event of incoming.reviews) {
      const local = localEvents.get(event.id);
      if (local && !sameEvent(local, event)) {
        const chosen = nextEvents.get(event.id);
        reviewConflicts.push(`复习评分「${event.id}」有冲突：采用${chosen && sameEvent(chosen, event) ? "备份" : "本机"}。`);
      } else if (!local && nextEvents.has(event.id)) added += 1;
    }
    if (added) lines.push(`会加上 ${added} 条复习评分，再按时间重放到期日。`);
    const removed = before.reviews.filter((event) => !nextEvents.has(event.id)).length;
    if (removed) lines.push(`会去掉 ${removed} 条只在本机的复习评分。`);
    pushCapped(lines, reviewConflicts);
  }

  lines.push(...overflow);
  return lines;
}

function idDiff(beforeIds: string[], afterIds: string[], added: string, removed: string, lines: string[]) {
  const before = new Set(beforeIds);
  const after = new Set(afterIds);
  const plus = [...after].filter((id) => !before.has(id)).sort();
  const minus = [...before].filter((id) => !after.has(id)).sort();
  if (plus.length) lines.push(`${added}${formatIds(plus)}。`);
  if (minus.length) lines.push(`${removed}${formatIds(minus)}。`);
}

function pushCapped(target: string[], lines: string[]) {
  if (lines.length <= 8) target.push(...lines);
  else {
    target.push(...lines.slice(0, 8));
    target.push(`还有 ${lines.length - 8} 条类似的变化。`);
  }
}

function formatIds(ids: string[]): string {
  const shown = ids.slice(0, 8).map((id) => `「${id}」`).join("、");
  return ids.length > 8 ? `${shown}，另外 ${ids.length - 8} 条` : shown;
}

function clonePractice(data: UserData): UserData {
  return {
    version: 1,
    practice: { ...data.practice },
    manual: [...data.manual],
    notes: { ...data.notes },
    mastered: { ...data.mastered },
    activity: data.activity.map((item) => ({ ...item })),
    practiceLog: data.practiceLog.map((item) => ({ ...item })),
  };
}

function sameLog(a: PracticeLogEntry, b: PracticeLogEntry): boolean {
  return a.id === b.id && a.sessionId === b.sessionId && a.questionId === b.questionId && a.at === b.at && a.outcome === b.outcome;
}

function sameEvent(a: ReviewEvent, b: ReviewEvent): boolean {
  return a.id === b.id && a.questionId === b.questionId && a.rating === b.rating && a.reviewedAt === b.reviewedAt;
}

function canonicalize(snapshot: ProgressSnapshot): ProgressSnapshot {
  return {
    practice: {
      ...snapshot.practice,
      manual: [...snapshot.practice.manual].sort(),
      activity: [...snapshot.practice.activity].sort((a, b) => a.at.localeCompare(b.at) || a.questionId.localeCompare(b.questionId) || a.kind.localeCompare(b.kind)),
      practiceLog: [...snapshot.practice.practiceLog].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
    },
    reviews: [...snapshot.reviews].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt) || a.id.localeCompare(b.id)),
  };
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) sorted[key] = sortKeys(source[key]);
  return sorted;
}

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length ? issue.path.join(".") : "内容";
  if (issue.code === "unrecognized_keys") return `${path}：有不能识别的字段 ${issue.keys.join("、")}`;
  if (issue.code === "invalid_string" && issue.validation === "datetime") return `${path}：不是合法的时间`;
  if (issue.code === "too_big") return `${path}：超过了数量或长度上限`;
  return `${path}：${issue.message}`;
}
