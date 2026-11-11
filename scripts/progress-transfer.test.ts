import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readQuestions } from "./catalog-files";
import { scheduleReviews } from "../src/lib/review-schedule";
import {
  PROGRESS_LIMITS,
  applyProgress,
  emptyProgress,
  exportProgress,
  inspectProgress,
  inspectProgressText,
  parseStoredPractice,
  type ProgressSnapshot,
} from "../src/lib/progress-transfer";

const catalog = new Set(["gs4a-01-001", "gs4a-hw-01-005"]);
const at = "2026-01-01T00:00:00.000Z";

function snapshot(): ProgressSnapshot {
  const state = emptyProgress();
  state.practice.practice["gs4a-01-001"] = "会了";
  state.practice.notes["gs4a-01-001"] = "本机笔记";
  state.practice.practiceLog.push({
    id: "log-1",
    sessionId: "session-1",
    questionId: "gs4a-01-001",
    at,
    outcome: "会了",
  });
  state.reviews.push({ id: "rev-1", questionId: "gs4a-01-001", rating: 3, reviewedAt: at });
  return state;
}

function envelope(practiceMark: "会了" | "不会", rating: 1 | 2 | 3 | 4) {
  return {
    type: "jojo-math-progress",
    version: 1,
    exportedAt: at,
    practice: {
      version: 1,
      practice: { "gs4a-01-001": practiceMark },
      manual: ["gs4a-hw-01-005"],
      notes: { "gs4a-01-001": "备份笔记" },
      mastered: {},
      activity: [],
      practiceLog: [],
    },
    reviews: {
      version: 1,
      events: [{ id: "rev-1", questionId: "gs4a-01-001", rating, reviewedAt: at }],
    },
  };
}

describe("进度导入导出", () => {
  it("旧的本机练习记录没有练习流水也能读出来", () => {
    const parsed = parseStoredPractice({
      version: 1,
      practice: { "gs4a-01-001": "不会" },
      manual: [],
      notes: {},
      mastered: {},
      activity: [{ questionId: "gs4a-01-001", at, kind: "不会" }],
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.deepEqual(parsed.data.practiceLog, []);
      assert.equal(parsed.data.practice["gs4a-01-001"], "不会");
    }
  });

  it("导出再导入后练习记录和复习评分都还在，并且没有作业本状态", () => {
    const state = snapshot();
    const file = exportProgress(state, at);
    const text = JSON.stringify(file);
    assert.equal(text.includes('"status"'), false);
    const preview = inspectProgress(file, catalog);
    assert.deepEqual(preview.errors, []);
    assert.deepEqual(preview.unknownIds, []);
    const applied = applyProgress(emptyProgress(), preview, { type: "replace", confirm: true, dropUnknown: false }, catalog);
    assert.equal(applied.ok, true);
    assert.deepEqual(applied.next, state);
    assert.deepEqual(scheduleReviews(applied.next.reviews), scheduleReviews(state.reviews));
    assert.equal(applied.recovery?.practice.practice["gs4a-01-001"], undefined);
  });

  it("题库里的题目 id 都能通过格式检查", () => {
    const ids = readQuestions().map((question) => question.id);
    assert.equal(ids.length, 148);
    const catalogIds = new Set(ids);
    for (const id of ids) assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const state = emptyProgress();
    state.practice.practice[ids[0]] = "不会";
    const preview = inspectProgress(exportProgress(state, at), catalogIds);
    assert.deepEqual(preview.errors, []);
    assert.deepEqual(preview.unknownIds, []);
  });

  it("冲突时可以留着本机，也可以改用备份，本机独有的记录不会丢", () => {
    const current = snapshot();
    current.practice.practice["gs4a-hw-01-005"] = "会了";
    const preview = inspectProgress(envelope("不会", 1), catalog);
    const keep = applyProgress(current, preview, { type: "merge", conflict: "keep-local", dropUnknown: false }, catalog);
    assert.equal(keep.ok, true);
    assert.equal(keep.recovery, null);
    assert.equal(keep.next.practice.practice["gs4a-01-001"], "会了");
    assert.equal(keep.next.practice.notes["gs4a-01-001"], "本机笔记");
    assert.equal(keep.next.practice.practice["gs4a-hw-01-005"], "会了");
    assert.equal(keep.next.reviews[0]?.rating, 3);
    assert.ok(keep.next.practice.manual.includes("gs4a-hw-01-005"));
    assert.match(keep.effects.join("\n"), /gs4a-01-001/);
    assert.match(keep.effects.join("\n"), /冲突/);

    const take = applyProgress(current, preview, { type: "merge", conflict: "take-incoming", dropUnknown: false }, catalog);
    assert.equal(take.next.practice.practice["gs4a-01-001"], "不会");
    assert.equal(take.next.practice.notes["gs4a-01-001"], "备份笔记");
    assert.equal(take.next.reviews[0]?.rating, 1);
    assert.equal(take.next.practice.practice["gs4a-hw-01-005"], "会了");
    assert.equal(current.practice.practice["gs4a-01-001"], "会了");
  });

  it("取消、未确认覆盖和非法文件都不会改动原来的记录", () => {
    const current = snapshot();
    const preview = inspectProgress(envelope("不会", 1), catalog);
    const cancelled = applyProgress(current, preview, { type: "cancel" }, catalog);
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.next, current);
    assert.equal(cancelled.recovery, null);

    const unconfirmed = applyProgress(current, preview, { type: "replace", confirm: false, dropUnknown: false }, catalog);
    assert.equal(unconfirmed.ok, false);
    assert.equal(unconfirmed.next, current);
    assert.equal(unconfirmed.recovery, null);

    const bad = inspectProgressText("{", catalog);
    assert.match(bad.errors.join("\n"), /JSON/);
    const rejected = applyProgress(current, bad, { type: "replace", confirm: true, dropUnknown: true }, catalog);
    assert.equal(rejected.ok, false);
    assert.equal(rejected.next, current);
  });

  it("覆盖要确认，确认后留下恢复副本并换成备份", () => {
    const current = snapshot();
    const preview = inspectProgress(envelope("不会", 1), catalog);
    const replaced = applyProgress(current, preview, { type: "replace", confirm: true, dropUnknown: false }, catalog);
    assert.equal(replaced.ok, true);
    assert.equal(replaced.recovery, current);
    assert.equal(replaced.next.practice.practice["gs4a-01-001"], "不会");
    assert.equal(replaced.next.reviews[0]?.rating, 1);
    assert.equal(current.practice.notes["gs4a-01-001"], "本机笔记");
    assert.match(replaced.effects.join("\n"), /恢复副本/);
  });

  it("旧版练习备份不会清掉本机复习评分", () => {
    const current = snapshot();
    const legacy = {
      version: 1,
      practice: { "gs4a-01-001": "不会" },
      manual: [],
      notes: {},
      mastered: {},
      activity: [],
      exportedAt: at,
    };
    const preview = inspectProgress(legacy, catalog);
    assert.equal(preview.legacy, true);
    const merged = applyProgress(current, preview, { type: "merge", conflict: "take-incoming", dropUnknown: false }, catalog);
    assert.equal(merged.next.practice.practice["gs4a-01-001"], "不会");
    assert.equal(merged.next.reviews[0]?.rating, 3);
    assert.match(merged.effects.join("\n"), /没有复习评分/);
  });

  it("题库里没有的题目不跳过就不能写入", () => {
    const current = snapshot();
    const file = envelope("会了", 3);
    (file.practice.practice as Record<string, "会了" | "不会">)["xes4a-01-099"] = "不会";
    const preview = inspectProgress(file, catalog);
    assert.deepEqual(preview.unknownIds, ["xes4a-01-099"]);
    const blocked = applyProgress(current, preview, { type: "merge", conflict: "keep-local", dropUnknown: false }, catalog);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.next, current);
    const dropped = applyProgress(current, preview, { type: "merge", conflict: "keep-local", dropUnknown: true }, catalog);
    assert.equal(dropped.ok, true);
    assert.equal(dropped.next.practice.practice["xes4a-01-099"], undefined);
    assert.equal(dropped.next.practice.practice["gs4a-01-001"], "会了");
    assert.match(dropped.effects.join("\n"), /xes4a-01-099/);
  });

  it("拒绝错误类型、版本、评分、多余字段、坏 id、超限和过大文件", () => {
    const current = snapshot();
    const cases: unknown[] = [
      null,
      [],
      { type: "other", version: 1 },
      { ...envelope("会了", 3), version: 2 },
      {
        ...envelope("会了", 3),
        reviews: { version: 1, events: [{ id: "rev-9", questionId: "gs4a-01-001", rating: "wrong", reviewedAt: at }] },
      },
      {
        ...envelope("会了", 3),
        reviews: { version: 1, events: [{ id: "rev-9", questionId: "gs4a-01-001", rating: 3, reviewedAt: at, status: "wrong" }] },
      },
      {
        ...envelope("会了", 3),
        practice: { ...envelope("会了", 3).practice, practice: { "BAD ID": "会了" } },
      },
      {
        ...envelope("会了", 3),
        practice: {
          ...envelope("会了", 3).practice,
          activity: Array.from({ length: PROGRESS_LIMITS.maxActivity + 1 }, (_, index) => ({
            questionId: "gs4a-01-001",
            at: new Date(Date.parse(at) + index * 1000).toISOString(),
            kind: "会了",
          })),
        },
      },
    ];
    for (const input of cases) {
      const preview = inspectProgress(input, catalog);
      assert.ok(preview.errors.length > 0, JSON.stringify(input).slice(0, 120));
      const applied = applyProgress(current, preview, { type: "replace", confirm: true, dropUnknown: true }, catalog);
      assert.equal(applied.ok, false);
      assert.equal(applied.next, current);
    }
    const huge = inspectProgressText("x".repeat(PROGRESS_LIMITS.maxTextChars + 1), catalog);
    assert.equal(huge.errors[0], "文件太大。");
    const applied = applyProgress(current, huge, { type: "merge", conflict: "keep-local", dropUnknown: true }, catalog);
    assert.equal(applied.next, current);
  });

  it("同一条评分内容不同则整份拒绝，内容相同则只留一条", () => {
    const current = snapshot();
    const conflicted = envelope("会了", 3);
    conflicted.reviews.events = [
      { id: "rev-9", questionId: "gs4a-01-001", rating: 1, reviewedAt: at },
      { id: "rev-9", questionId: "gs4a-01-001", rating: 4, reviewedAt: at },
    ];
    const bad = inspectProgress(conflicted, catalog);
    assert.match(bad.errors.join("\n"), /重复/);
    assert.equal(applyProgress(current, bad, { type: "merge", conflict: "take-incoming", dropUnknown: false }, catalog).next, current);

    const duplicated = envelope("会了", 3);
    duplicated.reviews.events = [
      { id: "rev-9", questionId: "gs4a-hw-01-005", rating: 4, reviewedAt: at },
      { id: "rev-9-copy", questionId: "gs4a-hw-01-005", rating: 4, reviewedAt: at },
    ];
    const preview = inspectProgress(duplicated, catalog);
    assert.match(preview.notes.join("\n"), /相同/);
    const merged = applyProgress(emptyProgress(), preview, { type: "replace", confirm: true, dropUnknown: false }, catalog);
    assert.equal(merged.next.reviews.length, 1);
    assert.equal(merged.next.reviews[0]?.id, "rev-9");
  });
});
