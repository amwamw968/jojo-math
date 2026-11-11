import assert from "node:assert/strict";
import { describe, it } from "node:test";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { remarkGroupEquations } from "../src/lib/group-equations";

interface Node {
  type: string;
  value?: string;
  children?: Node[];
  url?: string;
  alt?: string;
}

function tree(source: string): Node {
  const processor = unified().use(remarkParse).use(remarkMath).use(remarkGroupEquations);
  const parsed = processor.parse(source) as Node;
  return processor.runSync(parsed) as Node;
}

function walk(node: Node, visit: (node: Node) => void) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function eqLines(root: Node): Node[] {
  const lines: Node[] = [];
  walk(root, (node) => {
    if (node.type === "eqLine") lines.push(node);
  });
  return lines;
}

function mathValues(root: Node): string[] {
  const values: string[] = [];
  walk(root, (node) => {
    if (node.type === "inlineMath" || node.type === "math") values.push(node.value ?? "");
  });
  return values;
}

const mountain = "你发现什么规律？看图填空：$1+2+1=4=\\_\\_\\_$；$1+2+3+2+1=9=\\_\\_\\_$；$1+2+3+4+3+2+1=16=\\_\\_\\_$；$1+2+3+4+5+4+3+2+1=25=\\_\\_\\_$。（用“几的平方”表示）";

describe("题干算式分行", () => {
  it("把分号隔开的山峰算式分成行，公式原文不变", () => {
    const root = tree(mountain);
    const lines = eqLines(root);
    assert.equal(lines.length, 4);
    assert.deepEqual(mathValues(root), [
      "1+2+1=4=\\_\\_\\_",
      "1+2+3+2+1=9=\\_\\_\\_",
      "1+2+3+4+3+2+1=16=\\_\\_\\_",
      "1+2+3+4+5+4+3+2+1=25=\\_\\_\\_",
    ]);
    const text = JSON.stringify(root);
    assert.match(text, /你发现什么规律？看图填空：/);
    assert.match(text, /用“几的平方”表示/);
    const hint = lines[3].children?.filter((child) => child.type === "text").map((child) => child.value).join("") ?? "";
    assert.match(hint, /。/);
    assert.doesNotMatch(hint, /几的平方/);
  });

  it("不拆开带中文说明的分数、指数和配图", () => {
    const mixed = "每个数都是整数的 $\\frac{1}{10}$，先算 $100^2=10000$。\n\n看图：\n\n![山](figures/gs4a/gs4a-01-001.png)\n\n$28^2-18^2=\\_\\_\\_$";
    const root = tree(mixed);
    assert.equal(eqLines(root).length, 0);
    assert.deepEqual(mathValues(root), ["\\frac{1}{10}", "100^2=10000", "28^2-18^2=\\_\\_\\_"]);
    const images: Node[] = [];
    walk(root, (node) => {
      if (node.type === "image") images.push(node);
    });
    assert.equal(images.length, 1);
    assert.equal(images[0].url, "figures/gs4a/gs4a-01-001.png");
    assert.equal(images[0].alt, "山");
  });

  it("多问里的短题号留在第一条算式上，链接仍在原处", () => {
    const source = "(1) $8\\times8^{13}\\times8^9=\\_\\_\\_$；$3^2\\times5^5=\\_\\_\\_$．\n\n见[知识点](/knowledge/arith-mountain-sum)。";
    const root = tree(source);
    const lines = eqLines(root);
    assert.equal(lines.length, 2);
    const firstText = lines[0].children?.filter((child) => child.type === "text").map((child) => child.value).join("") ?? "";
    assert.match(firstText, /\(1\)/);
    const links: Node[] = [];
    walk(root, (node) => {
      if (node.type === "link") links.push(node);
    });
    assert.equal(links.length, 1);
    assert.equal(links[0].url, "/knowledge/arith-mountain-sum");
    assert.equal(lines.some((line) => line.children?.includes(links[0])), false);
  });
});
