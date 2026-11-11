import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Rating } from "ts-fsrs";
import {
  asReviewRating,
  dueReviews,
  scheduleReviews,
  type ReviewEvent,
  type ReviewRating,
} from "../src/lib/review-schedule";

const at = "2026-01-01T00:00:00.000Z";
const later = "2026-01-01T00:10:00.000Z";

function event(id: string, questionId: string, rating: ReviewRating, reviewedAt: string): ReviewEvent {
  return { id, questionId, rating, reviewedAt };
}

describe("间隔复习", () => {
  it("只接受四档评分，不接受作业本状态或会了/不会", () => {
    assert.equal(Rating.Again, 1);
    assert.equal(asReviewRating(1), 1);
    assert.equal(asReviewRating(4), 4);
    for (const value of ["wrong", "correct", "partial", "unclear", "会了", "不会", "1", 0, 5]) {
      assert.equal(asReviewRating(value), null, String(value));
    }
  });

  it("同一串评分重放两次，到期日相同，输入顺序不影响结果", () => {
    const events = [
      event("b", "gs4a-01-001", 3, later),
      event("a", "gs4a-01-001", 1, at),
    ];
    const first = scheduleReviews(events);
    const second = scheduleReviews([...events].reverse());
    assert.deepEqual(first, second);
    assert.equal(first.length, 1);
    assert.equal(first[0].questionId, "gs4a-01-001");
    assert.equal(first[0].lastRating, 3);
    assert.ok(Date.parse(first[0].due) > Date.parse(later));
  });

  it("没记住比很熟更早到期，而且不会把另一道题算进去", () => {
    const again = scheduleReviews([event("a", "gs4a-01-001", 1, at)])[0];
    const easy = scheduleReviews([event("e", "gs4a-01-001", 4, at)])[0];
    assert.ok(Date.parse(again.due) < Date.parse(easy.due));
    assert.ok(Date.parse(again.due) > Date.parse(at));
    assert.ok(Date.parse(again.due) - Date.parse(at) < 24 * 60 * 60 * 1000);
    const both = scheduleReviews([
      event("a", "gs4a-01-001", 1, at),
      event("b", "gs4a-hw-01-005", 4, at),
    ]);
    assert.deepEqual(both.find((item) => item.questionId === "gs4a-01-001"), again);
  });

  it("到了到期时间才出现在待复习里", () => {
    const events = [event("a", "gs4a-01-001", 1, at)];
    assert.equal(dueReviews(events, new Date(at)).length, 0);
    const due = dueReviews(events, new Date(Date.parse(scheduleReviews(events)[0].due) + 1000));
    assert.equal(due.length, 1);
    assert.equal(due[0].questionId, "gs4a-01-001");
  });
});
