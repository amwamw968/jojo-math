import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateVariants } from "../src/engine/generate";
import type { Variant } from "../src/engine/engines";
import { katexFailure } from "../src/lib/katex-check";

function loopMountain(start: number, peak: number, factor = 1): number {
  let sum = 0;
  for (let i = start; i <= peak; i += 1) sum += factor * i;
  for (let i = peak - 1; i >= start; i -= 1) sum += factor * i;
  return sum;
}

function tenthsText(sum: number): string {
  const whole = Math.floor(sum / 10);
  const frac = sum % 10;
  return frac === 0 ? String(whole) : `${whole}.${frac}`;
}

function loopSquares(from: number, to: number): number {
  let sum = 0;
  for (let i = from; i <= to; i += 1) sum += i * i;
  return sum;
}

function expected(variant: Variant): string {
  const p = variant.params;
  switch (variant.engine) {
    case "mountain-sum":
      return p.kind === 0 ? String(loopMountain(1, p.peak)) : tenthsText(loopMountain(1, p.peak));
    case "mountain-transform":
      if (p.kind === 0) return String(loopMountain(p.start, p.peak));
      if (p.kind === 1) return String(loopMountain(1, p.peak, p.factor));
      return String(loopMountain(p.start, p.peak, p.factor));
    case "diff-of-squares":
      if (p.kind === 0) return String(p.a * p.a - p.b * p.b);
      {
        let sum = 0;
        for (let i = p.n; i >= 2; i -= 2) sum += i * i - (i - 1) * (i - 1);
        return String(sum);
      }
    case "sum-of-squares":
      return p.kind === 0 ? String(loopSquares(1, p.n)) : String(loopSquares(p.from, p.to));
    case "arithmetic-series": {
      let sum = 0;
      for (let i = 0; i < p.n; i += 1) sum += p.a1 + i * p.d;
      return String(sum);
    }
    default:
      return "";
  }
}

describe("变式题答案", () => {
  const ids = [
    "arith-mountain-sum",
    "arith-mountain-transform",
    "arith-diff-of-squares",
    "arith-sum-of-squares",
    "arith-arithmetic-series",
  ];

  for (const id of ids) {
    it(`${id} 的 40 道变式都和独立求和一致`, () => {
      for (let seed = 1; seed <= 40; seed += 1) {
        const [variant] = generateVariants(id, 1, seed);
        assert.ok(variant, `${id} seed ${seed} 没有出题`);
        assert.equal(variant.answer, expected(variant), `${id} seed ${seed} ${variant.stem}`);
        assert.equal(katexFailure(variant.stem), null, variant.stem);
        assert.equal(katexFailure(variant.solution), null, variant.solution);
      }
    });
  }

  it("同一个种子两次结果相同", () => {
    const a = generateVariants("gs-autumn-4-l01", 6, 20261110);
    const b = generateVariants("gs-autumn-4-l01", 6, 20261110);
    assert.deepEqual(a, b);
    assert.equal(a.length, 6);
  });

  it("第 1 讲会轮流用到这一讲的引擎", () => {
    const variants = generateVariants("gs-autumn-4-l01", 5, 3);
    assert.deepEqual(
      [...new Set(variants.map((item) => item.engine))].sort(),
      ["arithmetic-series", "diff-of-squares", "mountain-sum", "mountain-transform", "sum-of-squares"],
    );
  });

  it("待补讲次不出题", () => {
    assert.deepEqual(generateVariants("xes-4-unknown", 4, 1), []);
    assert.deepEqual(generateVariants("没有这个知识点", 2, 1), []);
  });
});
