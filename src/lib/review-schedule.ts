// ts-fsrs 5.4.2. v6 asks for Node >= 24; this site's Pages build uses Node 22.
// Ratings are an explicit Again/Hard/Good/Easy log. Workbook status and 会了/不会 are not inputs.
// The schedule is the replay of that log with fuzz off, so the same events always produce the same due times.

import { createEmptyCard, fsrs, generatorParameters, Rating, type Card } from "ts-fsrs";

export type ReviewRating = 1 | 2 | 3 | 4;

export interface ReviewEvent {
  id: string;
  questionId: string;
  rating: ReviewRating;
  reviewedAt: string;
}

export interface ScheduledReview {
  questionId: string;
  due: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: string | null;
  lastRating: ReviewRating;
}

export const REVIEW_RATING_LABEL: Record<ReviewRating, string> = {
  1: "没记住",
  2: "有点难",
  3: "记住了",
  4: "很熟",
};

const scheduler = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: true }));

export function asReviewRating(value: unknown): ReviewRating | null {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
}

function gradeOf(rating: ReviewRating) {
  if (rating === 1) return Rating.Again;
  if (rating === 2) return Rating.Hard;
  if (rating === 3) return Rating.Good;
  return Rating.Easy;
}

function compareEvents(a: ReviewEvent, b: ReviewEvent): number {
  if (a.reviewedAt < b.reviewedAt) return -1;
  if (a.reviewedAt > b.reviewedAt) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function replay(events: ReviewEvent[]): Card {
  const ordered = [...events].sort(compareEvents);
  let card = createEmptyCard(new Date(ordered[0].reviewedAt));
  for (const event of ordered) {
    card = scheduler.next(card, new Date(event.reviewedAt), gradeOf(event.rating)).card;
  }
  return card;
}

export function scheduleReviews(events: ReviewEvent[]): ScheduledReview[] {
  const grouped = new Map<string, ReviewEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.questionId);
    if (list) list.push(event);
    else grouped.set(event.questionId, [event]);
  }
  const scheduled: ScheduledReview[] = [];
  for (const [questionId, list] of grouped) {
    const ordered = [...list].sort(compareEvents);
    const card = replay(ordered);
    scheduled.push({
      questionId,
      due: card.due.toISOString(),
      stability: card.stability,
      difficulty: card.difficulty,
      scheduledDays: card.scheduled_days,
      reps: card.reps,
      lapses: card.lapses,
      state: Number(card.state),
      lastReview: card.last_review ? new Date(card.last_review).toISOString() : null,
      lastRating: ordered[ordered.length - 1].rating,
    });
  }
  scheduled.sort((a, b) => a.due.localeCompare(b.due) || a.questionId.localeCompare(b.questionId));
  return scheduled;
}

export function dueReviews(events: ReviewEvent[], now: Date): ScheduledReview[] {
  const time = now.getTime();
  return scheduleReviews(events).filter((item) => Date.parse(item.due) <= time);
}
