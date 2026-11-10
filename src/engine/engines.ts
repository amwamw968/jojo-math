/** Parametric drills for 高思四年级秋季第 1 讲. Numbers are drawn from a seed; the answer is computed here. */

import type { Rng } from "./rng";

export const ENGINE_IDS = [
  "mountain-sum",
  "mountain-transform",
  "diff-of-squares",
  "sum-of-squares",
  "arithmetic-series",
] as const;

export type EngineId = (typeof ENGINE_IDS)[number];

export interface Variant {
  engine: EngineId;
  stem: string;
  answer: string;
  solution: string;
  params: Record<string, number>;
}

export interface Engine {
  id: EngineId;
  name: string;
  desc: string;
  knowledgePointId: string;
  gen: (rng: Rng) => Variant;
}

export const KP_ENGINES: Record<string, EngineId[]> = {
  "arith-mountain-sum": ["mountain-sum"],
  "arith-mountain-transform": ["mountain-transform"],
  "arith-diff-of-squares": ["diff-of-squares"],
  "arith-sum-of-squares": ["sum-of-squares"],
  "arith-arithmetic-series": ["arithmetic-series"],
};

function variant(engine: EngineId, stem: string, answer: string, solution: string, params: Record<string, number>): Variant {
  return { engine, stem, answer, solution, params };
}

function tenthsText(sum: number): string {
  const whole = Math.floor(sum / 10);
  const frac = sum % 10;
  return frac === 0 ? String(whole) : `${whole}.${frac}`;
}

function mountainSum(start: number, peak: number): number {
  return peak * peak - start * (start - 1);
}

const ENGINES: Engine[] = [
  {
    id: "mountain-sum",
    name: "山顶和",
    desc: "从 1 加到山顶再加回来，和等于山顶的平方",
    knowledgePointId: "arith-mountain-sum",
    gen(rng) {
      const kind = rng.int(0, 1);
      const peak = kind === 0 ? rng.int(8, 40) : rng.int(5, 12);
      const sum = mountainSum(1, peak);
      if (kind === 0) {
        return variant(
          "mountain-sum",
          `计算：$1+2+\\cdots+${peak}+\\cdots+2+1$。`,
          String(sum),
          `这是山顶为 $${peak}$ 的山峰数列，和等于山顶的平方：$${peak}^2=${sum}$。`,
          { kind, peak },
        );
      }
      return variant(
        "mountain-sum",
        `计算：$0.1+0.2+\\cdots+${tenthsText(peak)}+\\cdots+0.2+0.1$。`,
        tenthsText(sum),
        `先看成整数山峰 $1+2+\\cdots+${peak}+\\cdots+2+1=${sum}$，每个数都是整数的 $\\frac{1}{10}$，所以再除以 $10$，得 $${tenthsText(sum)}$。`,
        { kind, peak },
      );
    },
  },
  {
    id: "mountain-transform",
    name: "山峰转化",
    desc: "不从 1 起时，先补全或提出公因数",
    knowledgePointId: "arith-mountain-transform",
    gen(rng) {
      const kind = rng.int(0, 2);
      if (kind === 0) {
        const start = rng.int(2, 6);
        const peak = rng.int(start + 3, start + 14);
        const sum = mountainSum(start, peak);
        return variant(
          "mountain-transform",
          `计算：$${start}+${start + 1}+\\cdots+${peak}+\\cdots+${start + 1}+${start}$。`,
          String(sum),
          `补成从 $1$ 开始的山峰再减掉缺的数：$${peak}^2-${start}\\times${start - 1}=${peak * peak}-${start * (start - 1)}=${sum}$。`,
          { kind, start, peak },
        );
      }
      if (kind === 1) {
        const factor = rng.int(2, 4);
        const peak = rng.int(4, 12);
        const sum = factor * mountainSum(1, peak);
        return variant(
          "mountain-transform",
          `计算：$${factor}+${factor * 2}+\\cdots+${factor * peak}+\\cdots+${factor * 2}+${factor}$。`,
          String(sum),
          `每个数都是 $${factor}$ 的倍数，提出来就是标准山峰：$${factor}\\times${peak}^2=${sum}$。`,
          { kind, factor, peak },
        );
      }
      const factor = rng.int(2, 4);
      const start = rng.int(2, 4);
      const peak = rng.int(start + 3, start + 10);
      const sum = factor * mountainSum(start, peak);
      return variant(
        "mountain-transform",
        `计算：$${factor * start}+${factor * (start + 1)}+\\cdots+${factor * peak}+\\cdots+${factor * (start + 1)}+${factor * start}$。`,
        String(sum),
        `先提出 $${factor}$，括号里是从 $${start}$ 加到 $${peak}$ 再回来的山：$${factor}\\times(${peak}^2-${start}\\times${start - 1})=${sum}$。`,
        { kind, factor, start, peak },
      );
    },
  },
  {
    id: "diff-of-squares",
    name: "平方差",
    desc: "a²−b²=(a+b)(a−b)，或两两相差 1 的平方差",
    knowledgePointId: "arith-diff-of-squares",
    gen(rng) {
      const kind = rng.int(0, 1);
      if (kind === 0) {
        const gap = rng.int(1, 12);
        const b = rng.int(8, 36);
        const a = b + gap;
        const answer = a * a - b * b;
        return variant(
          "diff-of-squares",
          `计算：$${a}^2-${b}^2$。`,
          String(answer),
          `平方差公式：$(${a}+${b})\\times(${a}-${b})=${a + b}\\times${gap}=${answer}$。`,
          { kind, a, b },
        );
      }
      const pairs = rng.int(3, 12);
      const n = pairs * 2;
      const answer = (n * (n + 1)) / 2;
      return variant(
        "diff-of-squares",
        `计算：$${n}^2-${n - 1}^2+${n - 2}^2-${n - 3}^2+\\cdots+2^2-1^2$。`,
        String(answer),
        `每组都是相邻两数的平方差，差是 $1$，所以原式 $=${n}+${n - 1}+\\cdots+1=\\dfrac{${n}\\times${n + 1}}{2}=${answer}$。`,
        { kind, n },
      );
    },
  },
  {
    id: "sum-of-squares",
    name: "平方和",
    desc: "1²+…+n²=n(n+1)(2n+1)÷6",
    knowledgePointId: "arith-sum-of-squares",
    gen(rng) {
      const kind = rng.int(0, 1);
      const formula = (n: number) => (n * (n + 1) * (2 * n + 1)) / 6;
      if (kind === 0) {
        const n = rng.int(4, 20);
        const answer = formula(n);
        return variant(
          "sum-of-squares",
          `计算：$1^2+2^2+\\cdots+${n}^2$。`,
          String(answer),
          `平方和公式：$${n}\\times${n + 1}\\times${2 * n + 1}\\div6=${answer}$。`,
          { kind, n },
        );
      }
      const from = rng.int(3, 8);
      const to = rng.int(from + 4, from + 16);
      const answer = formula(to) - formula(from - 1);
      return variant(
        "sum-of-squares",
        `计算：$${from}^2+${from + 1}^2+\\cdots+${to}^2$。`,
        String(answer),
        `先算到 $${to}$，再减掉前面 $1^2+\\cdots+${from - 1}^2$：$${formula(to)}-${formula(from - 1)}=${answer}$。`,
        { kind, from, to },
      );
    },
  },
  {
    id: "arithmetic-series",
    name: "等差数列求和",
    desc: "和 =（首项 + 末项）× 项数 ÷ 2",
    knowledgePointId: "arith-arithmetic-series",
    gen(rng) {
      const a1 = rng.int(2, 15);
      const d = rng.int(2, 9);
      const n = rng.int(6, 18);
      const an = a1 + (n - 1) * d;
      const answer = ((a1 + an) * n) / 2;
      const second = a1 + d;
      const third = a1 + 2 * d;
      return variant(
        "arithmetic-series",
        `从 $${a1}$ 开始写，每次增加 $${d}$，写成 $${a1}$、$${second}$、$${third}$、…… 一共写 $${n}$ 个数。这些数加起来是多少？`,
        String(answer),
        `最后一个数是 $${a1}+${n - 1}\\times${d}=${an}$。把这列数正着、倒着各加一遍，每对都是 $${a1 + an}$，一共 $${n}$ 对，所以和是 $(${a1}+${an})\\times${n}\\div2=${answer}$。`,
        { kind: 0, a1, d, n },
      );
    },
  },
];

export const ENG: Record<EngineId, Engine> = Object.fromEntries(ENGINES.map((engine) => [engine.id, engine])) as Record<EngineId, Engine>;

export function isEngineId(value: string): value is EngineId {
  return (ENGINE_IDS as readonly string[]).includes(value);
}
