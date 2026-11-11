import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECOVERY_STORAGE_KEY, REVIEW_STORAGE_KEY, STORAGE_KEY } from "../src/lib/constants";
import { loadRecords, saveRecords, type KeyValueStore } from "../src/lib/records";
import { emptyProgress, exportProgress } from "../src/lib/progress-transfer";

function memoryStore(fail?: { key: string; times: number }): KeyValueStore & { raw: Map<string, string> } {
  const raw = new Map<string, string>();
  let failed = 0;
  return {
    raw,
    getItem(key) {
      return raw.has(key) ? raw.get(key)! : null;
    },
    setItem(key, value) {
      if (fail && key === fail.key && failed < fail.times) {
        failed += 1;
        const error = new Error("quota");
        error.name = "QuotaExceededError";
        throw error;
      }
      raw.set(key, value);
    },
    removeItem(key) {
      raw.delete(key);
    },
  };
}

describe("本机读写", () => {
  it("读不出来的练习记录不会被后续保存盖掉", () => {
    const store = memoryStore();
    store.raw.set(STORAGE_KEY, "{");
    const loaded = loadRecords(store);
    assert.equal(loaded.practiceBlocked, true);
    assert.equal(loaded.practiceRaw, "{");
    assert.equal(loaded.practice.practiceLog.length, 0);
    const saved = saveRecords(store, emptyProgress(), { recovery: null, writePractice: false, writeReviews: true });
    assert.equal(saved.ok, true);
    assert.equal(store.raw.get(STORAGE_KEY), "{");
  });

  it("复习评分写入失败时，练习记录会回到写入前", () => {
    const store = memoryStore({ key: REVIEW_STORAGE_KEY, times: 1 });
    store.raw.set(STORAGE_KEY, "{\"version\":1,\"kept\":true}");
    store.raw.set(REVIEW_STORAGE_KEY, "{\"version\":1,\"events\":[]}");
    const saved = saveRecords(
      store,
      emptyProgress(),
      { recovery: null, writePractice: true, writeReviews: true },
    );
    assert.equal(saved.ok, false);
    if (!saved.ok) assert.match(saved.error, /存储空间/);
    assert.equal(store.raw.get(STORAGE_KEY), "{\"version\":1,\"kept\":true}");
    assert.equal(store.raw.get(REVIEW_STORAGE_KEY), "{\"version\":1,\"events\":[]}");
  });

  it("恢复副本写不进去时，不改练习和复习", () => {
    const store = memoryStore({ key: RECOVERY_STORAGE_KEY, times: 5 });
    store.raw.set(STORAGE_KEY, "practice");
    store.raw.set(REVIEW_STORAGE_KEY, "reviews");
    const saved = saveRecords(store, emptyProgress(), { recovery: emptyProgress(), writePractice: true, writeReviews: true });
    assert.equal(saved.ok, false);
    assert.equal(store.raw.get(STORAGE_KEY), "practice");
    assert.equal(store.raw.get(REVIEW_STORAGE_KEY), "reviews");
    assert.equal(store.raw.has(RECOVERY_STORAGE_KEY), false);
  });

  it("覆盖前的副本可以再读出来", () => {
    const store = memoryStore();
    const current = emptyProgress();
    current.practice.notes["gs4a-01-001"] = "原来的笔记";
    current.reviews.push({ id: "rev-1", questionId: "gs4a-01-001", rating: 3, reviewedAt: "2026-01-01T00:00:00.000Z" });
    const saved = saveRecords(store, emptyProgress(), { recovery: current, writePractice: true, writeReviews: true });
    assert.equal(saved.ok, true);
    const loaded = loadRecords(store);
    assert.equal(loaded.practiceBlocked, false);
    assert.equal(loaded.reviewsBlocked, false);
    assert.equal(loaded.recovery?.practice.notes["gs4a-01-001"], "原来的笔记");
    assert.equal(loaded.recovery?.reviews[0]?.rating, 3);
    assert.equal(JSON.parse(store.raw.get(RECOVERY_STORAGE_KEY) ?? "{}").type, "jojo-math-progress");
    assert.doesNotMatch(store.raw.get(RECOVERY_STORAGE_KEY) ?? "", /"status"/);
  });

  it("坏掉的恢复副本留在原处", () => {
    const store = memoryStore();
    store.raw.set(RECOVERY_STORAGE_KEY, "{");
    const loaded = loadRecords(store);
    assert.equal(loaded.recovery, null);
    assert.match(loaded.recoveryError ?? "", /没有删除/);
    assert.equal(store.raw.get(RECOVERY_STORAGE_KEY), "{");
    assert.equal(exportProgress(emptyProgress(), "2026-01-01T00:00:00.000Z").type, "jojo-math-progress");
  });
});
