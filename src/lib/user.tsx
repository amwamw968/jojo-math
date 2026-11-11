import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { questionById } from "../data/catalog";
import type { ActivityKind, PracticeMark, UserData } from "../types";
import { RECOVERY_STORAGE_KEY, REVIEW_STORAGE_KEY, STORAGE_KEY } from "./constants";
import { PROGRESS_LIMITS, emptyProgress, emptyUserData, type ProgressSnapshot } from "./progress-transfer";
import { loadRecords, saveRecords } from "./records";
import { dueReviews, scheduleReviews, type ReviewEvent, type ReviewRating, type ScheduledReview } from "./review-schedule";

export interface StorageState {
  practiceBlocked: boolean;
  reviewsBlocked: boolean;
  practiceError: string | null;
  reviewsError: string | null;
  writeError: string | null;
  practiceRaw: string | null;
  reviewsRaw: string | null;
  recovery: ProgressSnapshot | null;
  recoveryError: string | null;
}

interface UserApi {
  data: UserData;
  reviews: ReviewEvent[];
  schedule: ScheduledReview[];
  due: ScheduledReview[];
  storage: StorageState;
  setPractice: (questionId: string, mark: PracticeMark, sessionId?: string) => void;
  skipPractice: (questionId: string, sessionId: string) => void;
  addManual: (questionId: string) => void;
  removeFromMistakes: (questionId: string) => void;
  setNote: (questionId: string, note: string) => void;
  setMastered: (questionId: string, mastered: boolean) => void;
  rateReview: (questionId: string, rating: ReviewRating) => { ok: true; due: string } | { ok: false; error: string };
  commitProgress: (next: ProgressSnapshot, recovery: ProgressSnapshot | null) => string | null;
  discardCorrupt: (part: "practice" | "reviews") => string | null;
  reset: () => string | null;
}

const UserContext = createContext<UserApi | null>(null);

function browserStore() {
  return localStorage;
}

function withActivity(data: UserData, questionId: string, kind: ActivityKind): UserData {
  return {
    ...data,
    activity: [{ questionId, at: new Date().toISOString(), kind }, ...data.activity].slice(0, PROGRESS_LIMITS.maxActivity),
  };
}

function appendLog(data: UserData, questionId: string, sessionId: string, outcome: PracticeMark | "跳过"): UserData {
  return {
    ...data,
    practiceLog: [
      ...data.practiceLog,
      { id: crypto.randomUUID(), sessionId, questionId, at: new Date().toISOString(), outcome },
    ].slice(-PROGRESS_LIMITS.maxPracticeLog),
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => loadRecords(browserStore()));
  const [data, setData] = useState(loaded.practice);
  const [reviews, setReviews] = useState(loaded.reviews);
  const [practiceBlocked, setPracticeBlocked] = useState(loaded.practiceBlocked);
  const [reviewsBlocked, setReviewsBlocked] = useState(loaded.reviewsBlocked);
  const [practiceError, setPracticeError] = useState(loaded.practiceError);
  const [reviewsError, setReviewsError] = useState(loaded.reviewsError);
  const [practiceRaw, setPracticeRaw] = useState(loaded.practiceRaw);
  const [reviewsRaw, setReviewsRaw] = useState(loaded.reviewsRaw);
  const [recovery, setRecovery] = useState(loaded.recovery);
  const [recoveryError] = useState(loaded.recoveryError);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

  useEffect(() => {
    const saved = saveRecords(browserStore(), { practice: data, reviews }, {
      recovery: null,
      writePractice: !practiceBlocked,
      writeReviews: !reviewsBlocked,
    });
    setWriteError((current) => {
      const message = saved.ok ? null : saved.error;
      return current === message ? current : message;
    });
  }, [data, reviews, practiceBlocked, reviewsBlocked]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY && event.key !== REVIEW_STORAGE_KEY && event.key !== RECOVERY_STORAGE_KEY) return;
      const next = loadRecords(browserStore());
      setData(next.practice);
      setReviews(next.reviews);
      setPracticeBlocked(next.practiceBlocked);
      setReviewsBlocked(next.reviewsBlocked);
      setPracticeError(next.practiceError);
      setReviewsError(next.reviewsError);
      setPracticeRaw(next.practiceRaw);
      setReviewsRaw(next.reviewsRaw);
      setRecovery(next.recovery);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const schedule = useMemo(() => scheduleReviews(reviews), [reviews]);
  const due = useMemo(() => dueReviews(reviews, now), [reviews, now]);

  const api = useMemo<UserApi>(() => {
    const storage: StorageState = {
      practiceBlocked,
      reviewsBlocked,
      practiceError,
      reviewsError,
      writeError,
      practiceRaw,
      reviewsRaw,
      recovery,
      recoveryError,
    };
    return {
      data,
      reviews,
      schedule,
      due,
      storage,
      setPractice(questionId, mark, sessionId = "single") {
        if (practiceBlocked) return;
        setData((current) => {
          const mastered = { ...current.mastered };
          if (mark === "不会") delete mastered[questionId];
          return appendLog(
            withActivity({ ...current, practice: { ...current.practice, [questionId]: mark }, mastered }, questionId, mark),
            questionId,
            sessionId,
            mark,
          );
        });
      },
      skipPractice(questionId, sessionId) {
        if (practiceBlocked) return;
        setData((current) => appendLog(current, questionId, sessionId, "跳过"));
      },
      addManual(questionId) {
        if (practiceBlocked) return;
        setData((current) => {
          if (current.manual.includes(questionId)) return current;
          const mastered = { ...current.mastered };
          delete mastered[questionId];
          return withActivity({ ...current, manual: [...current.manual, questionId], mastered }, questionId, "加入错题");
        });
      },
      removeFromMistakes(questionId) {
        if (practiceBlocked) return;
        setData((current) => {
          const practice = { ...current.practice };
          if (practice[questionId] === "不会") delete practice[questionId];
          return withActivity(
            { ...current, practice, manual: current.manual.filter((id) => id !== questionId) },
            questionId,
            "移出错题",
          );
        });
      },
      setNote(questionId, note) {
        if (practiceBlocked) return;
        setData((current) => {
          const notes = { ...current.notes };
          const trimmed = note.slice(0, PROGRESS_LIMITS.maxNoteChars);
          if (trimmed.trim()) notes[questionId] = trimmed;
          else delete notes[questionId];
          if (notes[questionId] === current.notes[questionId]) return current;
          return { ...current, notes };
        });
      },
      setMastered(questionId, masteredFlag) {
        if (practiceBlocked) return;
        setData((current) => {
          const mastered = { ...current.mastered };
          if (masteredFlag) mastered[questionId] = true;
          else delete mastered[questionId];
          return withActivity({ ...current, mastered }, questionId, masteredFlag ? "掌握" : "取消掌握");
        });
      },
      rateReview(questionId, rating) {
        if (reviewsBlocked) return { ok: false, error: "复习评分读不出来，还不能记新的。" };
        if (!questionById.has(questionId)) return { ok: false, error: "题库里没有这道题。" };
        if (reviews.length >= PROGRESS_LIMITS.maxReviewEvents) return { ok: false, error: "复习评分太多，先导出备份。" };
        const event: ReviewEvent = {
          id: crypto.randomUUID(),
          questionId,
          rating,
          reviewedAt: new Date().toISOString(),
        };
        const next = [...reviews, event];
        const scheduled = scheduleReviews(next).find((item) => item.questionId === questionId);
        if (!scheduled) return { ok: false, error: "这次评分没有算出到期日。" };
        setReviews(next);
        return { ok: true, due: scheduled.due };
      },
      commitProgress(next, recoverySnapshot) {
        const saved = saveRecords(browserStore(), next, {
          recovery: recoverySnapshot,
          writePractice: true,
          writeReviews: true,
        });
        if (!saved.ok) {
          setWriteError(saved.error);
          return saved.error;
        }
        setPracticeBlocked(false);
        setReviewsBlocked(false);
        setPracticeError(null);
        setReviewsError(null);
        setPracticeRaw(null);
        setReviewsRaw(null);
        setData(next.practice);
        setReviews(next.reviews);
        setWriteError(null);
        if (recoverySnapshot) setRecovery(recoverySnapshot);
        return null;
      },
      discardCorrupt(part) {
        if (part === "practice") {
          const next = { practice: emptyUserData(), reviews };
          const saved = saveRecords(browserStore(), next, { recovery: null, writePractice: true, writeReviews: false });
          if (!saved.ok) {
            setWriteError(saved.error);
            return saved.error;
          }
          setPracticeBlocked(false);
          setPracticeError(null);
          setPracticeRaw(null);
          setData(emptyUserData());
          setWriteError(null);
          return null;
        }
        const next = { practice: data, reviews: [] as ReviewEvent[] };
        const saved = saveRecords(browserStore(), next, { recovery: null, writePractice: false, writeReviews: true });
        if (!saved.ok) {
          setWriteError(saved.error);
          return saved.error;
        }
        setReviewsBlocked(false);
        setReviewsError(null);
        setReviewsRaw(null);
        setReviews([]);
        setWriteError(null);
        return null;
      },
      reset() {
        if (practiceBlocked || reviewsBlocked) return "有读不出来的记录，请先下载原文，再确认替换。";
        const previous = { practice: data, reviews };
        const next = emptyProgress();
        const saved = saveRecords(browserStore(), next, { recovery: previous, writePractice: true, writeReviews: true });
        if (!saved.ok) {
          setWriteError(saved.error);
          return saved.error;
        }
        setData(next.practice);
        setReviews([]);
        setRecovery(previous);
        setWriteError(null);
        return null;
      },
    };
  }, [
    data,
    reviews,
    schedule,
    due,
    practiceBlocked,
    reviewsBlocked,
    practiceError,
    reviewsError,
    writeError,
    practiceRaw,
    reviewsRaw,
    recovery,
    recoveryError,
  ]);

  return <UserContext.Provider value={api}>{children}</UserContext.Provider>;
}

export function useUser(): UserApi {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUser 必须放在 UserProvider 里");
  return value;
}
