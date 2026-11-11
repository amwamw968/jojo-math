import { RECOVERY_STORAGE_KEY, REVIEW_STORAGE_KEY, STORAGE_KEY } from "./constants";
import {
  emptyUserData,
  exportProgress,
  parseRecovery,
  parseStoredPractice,
  parseStoredReviews,
  type ProgressSnapshot,
} from "./progress-transfer";
import type { UserData } from "../types";
import type { ReviewEvent } from "./review-schedule";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadedRecords {
  practice: UserData;
  reviews: ReviewEvent[];
  practiceBlocked: boolean;
  reviewsBlocked: boolean;
  practiceError: string | null;
  reviewsError: string | null;
  practiceRaw: string | null;
  reviewsRaw: string | null;
  recovery: ProgressSnapshot | null;
  recoveryError: string | null;
}

export interface SaveOptions {
  recovery: ProgressSnapshot | null;
  writePractice: boolean;
  writeReviews: boolean;
}

export function loadRecords(store: KeyValueStore): LoadedRecords {
  const practiceRaw = store.getItem(STORAGE_KEY);
  const reviewsRaw = store.getItem(REVIEW_STORAGE_KEY);
  const recoveryRaw = store.getItem(RECOVERY_STORAGE_KEY);
  const loaded: LoadedRecords = {
    practice: emptyUserData(),
    reviews: [],
    practiceBlocked: false,
    reviewsBlocked: false,
    practiceError: null,
    reviewsError: null,
    practiceRaw: null,
    reviewsRaw: null,
    recovery: null,
    recoveryError: null,
  };

  if (practiceRaw !== null) {
    const parsed = parseJson(practiceRaw);
    const result = parsed.ok ? parseStoredPractice(parsed.value) : { ok: false as const, error: "本机练习记录不是能用的 JSON。" };
    if (result.ok) loaded.practice = result.data;
    else {
      loaded.practiceBlocked = true;
      loaded.practiceError = result.error;
      loaded.practiceRaw = practiceRaw;
    }
  }

  if (reviewsRaw !== null) {
    const parsed = parseJson(reviewsRaw);
    const result = parsed.ok ? parseStoredReviews(parsed.value) : { ok: false as const, error: "本机复习评分不是能用的 JSON。" };
    if (result.ok) loaded.reviews = result.events;
    else {
      loaded.reviewsBlocked = true;
      loaded.reviewsError = result.error;
      loaded.reviewsRaw = reviewsRaw;
    }
  }

  if (recoveryRaw !== null) {
    const parsed = parseJson(recoveryRaw);
    const result = parsed.ok ? parseRecovery(parsed.value) : { ok: false as const, error: "恢复副本不是能用的 JSON。" };
    if (result.ok) loaded.recovery = result.data;
    else loaded.recoveryError = `${result.error} 没有删除这份副本。`;
  }

  return loaded;
}

export function saveRecords(
  store: KeyValueStore,
  snapshot: ProgressSnapshot,
  options: SaveOptions,
): { ok: true } | { ok: false; error: string } {
  if (!options.writePractice && !options.writeReviews && !options.recovery) return { ok: true };
  const previousPractice = store.getItem(STORAGE_KEY);
  const previousReviews = store.getItem(REVIEW_STORAGE_KEY);
  if (options.recovery) {
    try {
      store.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(exportProgress(options.recovery, new Date().toISOString())));
    } catch (error) {
      return { ok: false, error: writeError(error) };
    }
  }
  try {
    if (options.writePractice) store.setItem(STORAGE_KEY, JSON.stringify(snapshot.practice));
    if (options.writeReviews) store.setItem(REVIEW_STORAGE_KEY, JSON.stringify({ version: 1, events: snapshot.reviews }));
    return { ok: true };
  } catch (error) {
    try {
      restore(store, STORAGE_KEY, previousPractice);
      restore(store, REVIEW_STORAGE_KEY, previousReviews);
    } catch {
      return { ok: false, error: "写入失败，而且没能把原来的记录写回去。请马上导出备份。" };
    }
    return { ok: false, error: writeError(error) };
  }
}

function restore(store: KeyValueStore, key: string, previous: string | null) {
  if (previous === null) store.removeItem(key);
  else store.setItem(key, previous);
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false };
  }
}

function writeError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return "浏览器存储空间不够，这次没有写入。请先导出备份。";
  }
  return "这次没有写入浏览器。原来的记录还在。";
}
