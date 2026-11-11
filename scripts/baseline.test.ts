import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readQuestions } from "./catalog-files";

/** Files that already existed on main before 运动会筹划. New lecture files are not in this list. */
const ORIGINAL_FILES = [
  "data/books.json",
  "data/questions/gs4a/01.json",
  "data/questions/gs4a-dp/01.json",
  "data/questions/gs4a-hw/01.json",
  "data/questions/xes4a/01.json",
  "data/questions/xes4a-hw/01.json",
  "data/questions/xes4a-hw/07.json",
  "data/knowledge/arith-arithmetic-series.md",
  "data/knowledge/arith-diff-of-squares.md",
  "data/knowledge/arith-mountain-sum.md",
  "data/knowledge/arith-mountain-transform.md",
  "data/knowledge/arith-sum-of-cubes.md",
  "data/knowledge/arith-sum-of-products.md",
  "data/knowledge/arith-sum-of-squares.md",
  "data/knowledge/exp-compare.md",
  "data/knowledge/exp-definition.md",
  "data/knowledge/exp-power.md",
  "data/knowledge/exp-product-power.md",
  "data/knowledge/exp-product.md",
  "data/knowledge/exp-quotient.md",
  "data/knowledge/exp-same-base.md",
  "data/knowledge/exp-zero.md",
  "data/knowledge/fib-sum-of-squares.md",
  "data/knowledge/pigeon-multi-threshold.md",
  "data/knowledge/pigeon-worst-case.md",
  "public/figures/gs4a/gs4a-01-001.png",
  "public/figures/gs4a/gs4a-01-012.png",
  "public/figures/gs4a-hw/gs4a-hw-01-001.png",
  "public/figures/gs4a-hw/gs4a-hw-01-004.png",
];

function bundleHash(files: string[]): string {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

describe("题库基线", () => {
  it("原来的 100 道题和作业本状态没有被改写", () => {
    const questions = readQuestions().filter((question) => !question.id.includes("-02-"));
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
    assert.deepEqual(counts, { correct: 75, wrong: 1, partial: 2, unclear: 0, none: 22 });
  });

  it("原来的题目、知识和配图文件字节没有变", () => {
    assert.equal(ORIGINAL_FILES.length, 29);
    assert.equal(bundleHash(ORIGINAL_FILES), "df94c1b85b8056b14faf749716d8a0b7e1b5adb0c897a0b81de2a6d5997ff769");
  });

  it("原来的 18 个知识点还在索引最前面，标题没有改", () => {
    const index = JSON.parse(readFileSync("data/knowledge/index.json", "utf8")) as { id: string; title: string; category: string }[];
    const head = index.slice(0, 18);
    assert.equal(
      createHash("sha256").update(JSON.stringify(head)).digest("hex"),
      "e83e24498bffababb89e0cd3501f6b96156837aed00cc830759ab53699b72954",
    );
  });
});
