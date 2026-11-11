import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function factorial(n: number): number {
  let value = 1;
  for (let i = 2; i <= n; i += 1) value *= i;
  return value;
}

function perm(n: number, k: number): number {
  let value = 1;
  for (let i = 0; i < k; i += 1) value *= n - i;
  return value;
}

function comb(n: number, k: number): number {
  return perm(n, k) / factorial(k);
}

/** Subsets of 4 cells that match after a fold on at least one axis of the 4×4 square. */
function axialColorings(): number {
  const cells: [number, number][] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) cells.push([row, col]);
  }
  const folds: ((row: number, col: number) => [number, number])[] = [
    (row, col) => [row, 3 - col],
    (row, col) => [3 - row, col],
    (row, col) => [col, row],
    (row, col) => [3 - col, 3 - row],
  ];
  let count = 0;
  const choose = (start: number, picked: [number, number][]) => {
    if (picked.length === 4) {
      const key = picked.map(([row, col]) => row * 4 + col).sort((a, b) => a - b).join(",");
      const symmetric = folds.some((fold) => {
        const folded = picked.map(([row, col]) => fold(row, col)).map(([row, col]) => row * 4 + col).sort((a, b) => a - b).join(",");
        return folded === key;
      });
      if (symmetric) count += 1;
      return;
    }
    for (let i = start; i < cells.length; i += 1) {
      picked.push(cells[i]);
      choose(i + 1, picked);
      picked.pop();
    }
  };
  choose(0, []);
  return count;
}

interface Stored {
  id: string;
  answer: string;
  jojo: { status?: string } | null;
}

function lectureQuestions(): Stored[] {
  const files = ["data/questions/gs4a/02.json", "data/questions/gs4a-hw/02.json"];
  return files.flatMap((file) => JSON.parse(readFileSync(file, "utf8")) as Stored[]);
}

describe("运动会筹划的独立计数", () => {
  it("4×4 涂 4 格、沿正方形的对称轴对折能重合的涂法是 146", () => {
    assert.equal(comb(16, 4), 1820);
    assert.equal(axialColorings(), 146);
    const question = lectureQuestions().find((item) => item.id === "gs4a-hw-02-017");
    assert.equal(question?.answer, "$146$");
  });

  it("有名字的分组是 12600，去掉同人数组的重复后是 2100", () => {
    assert.equal(3 * comb(10, 4) * comb(6, 3), 12600);
    assert.equal(comb(10, 4) * comb(6, 3) / 2, 2100);
    assert.equal(12600 / (3 * 2), 2100);
    const question = lectureQuestions().find((item) => item.id === "gs4a-02-023");
    assert.match(question?.answer ?? "", /12600/);
    assert.match(question?.answer ?? "", /2100/);
  });

  it("圆桌只把旋转算成同一种", () => {
    assert.equal(factorial(7) / 7, 720);
    assert.equal(perm(7, 5) / 5, 504);
    const question = lectureQuestions().find((item) => item.id === "gs4a-02-022");
    assert.match(question?.answer ?? "", /720/);
    assert.match(question?.answer ?? "", /504/);
  });

  it("借书、班委和两位同学的数字和可以再算一遍", () => {
    assert.equal(3 * comb(8, 2) * comb(6, 3), 1680);
    assert.equal(comb(11, 3) * factorial(3), 990);
    assert.equal(perm(11, 3), 990);
    const digits = [0, 1, 3, 5, 7, 9];
    let count = 0;
    let sum = 0;
    for (const hundreds of digits) {
      if (hundreds === 0) continue;
      for (const tens of digits) {
        if (tens === hundreds) continue;
        for (const ones of digits) {
          if (ones === hundreds || ones === tens) continue;
          count += 1;
          sum += hundreds * 100 + tens * 10 + ones;
        }
      }
    }
    assert.equal(count, 100);
    assert.equal(sum, 54400);
    assert.equal((1 + 2 + 3 + 4 + 5 + 6) * 20 * 111, 46620);
    const books = lectureQuestions().find((item) => item.id === "gs4a-hw-02-019");
    const places = lectureQuestions().find((item) => item.id === "gs4a-hw-02-021");
    assert.match(books?.answer ?? "", /1680/);
    assert.match(places?.answer ?? "", /46620/);
    assert.match(places?.answer ?? "", /54400/);
  });

  it("上一讲连加不放进这一讲的排列组合知识点", () => {
    const rows = JSON.parse(readFileSync("data/questions/gs4a-hw/02.json", "utf8")) as {
      id: string;
      knowledge_points: string[];
      tags: string[];
    }[];
    const review = rows.find((item) => item.id === "gs4a-hw-02-022");
    assert.deepEqual(review?.knowledge_points, ["arith-arithmetic-series"]);
    assert.equal(review?.tags.includes("上一讲复习"), true);
    assert.equal(6 + 8 + 10 + 12 + 14 + 16 + 14 + 12 + 10 + 8 + 6, 116);
  });

  it("新题都有作答记录，而且这一讲没有变式引擎", () => {
    const questions = lectureQuestions();
    assert.equal(questions.length, 48);
    for (const question of questions) {
      assert.equal(question.jojo?.status, "correct", question.id);
    }
    const syllabus = JSON.parse(readFileSync("data/syllabus.json", "utf8")) as {
      tracks: { id: string; lectures: { id: string; engines: string[]; title: string | null }[] }[];
    };
    const lecture = syllabus.tracks.find((track) => track.id === "gs-autumn-4")?.lectures.find((item) => item.id === "gs-autumn-4-l02");
    assert.deepEqual(lecture?.engines, []);
    assert.equal(lecture?.title, "运动会筹划");
  });
});
