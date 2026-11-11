import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { contentHash, readQuestions } from "./catalog-files";

describe("题库基线", () => {
  it("题目、知识点和作业本状态保持这次改动前的数量", () => {
    const questions = readQuestions();
    const knowledge = JSON.parse(readFileSync("data/knowledge/index.json", "utf8")) as unknown[];
    const counts = { correct: 0, wrong: 0, partial: 0, unclear: 0, none: 0 };
    const ids = new Set<string>();
    for (const question of questions) {
      assert.equal(ids.has(question.id), false, question.id);
      ids.add(question.id);
      const status = question.jojo?.status;
      if (!question.jojo) counts.none += 1;
      else if (status === "correct") counts.correct += 1;
      else if (status === "wrong") counts.wrong += 1;
      else if (status === "partial") counts.partial += 1;
      else if (status === "unclear") counts.unclear += 1;
      else assert.fail(`未知状态 ${question.id}`);
    }
    assert.equal(questions.length, 100);
    assert.equal(ids.size, 100);
    assert.equal(knowledge.length, 18);
    assert.deepEqual(counts, { correct: 75, wrong: 1, partial: 2, unclear: 0, none: 22 });
  });

  it("题目、知识和配图文件没有被改写", () => {
    const hashed = contentHash();
    assert.equal(hashed.files, 31);
    assert.equal(hashed.hash, "d211ba785bded897857dc4b312921e4811d22ee35f19b5c7ce8afd68975e8c9a");
  });
});
