import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MathText } from "../src/components/MathText";

function visibleText(html: string): string {
  return html
    .replace(/<annotation[\s\S]*?<\/annotation>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function render(source: string, flow: "prose" | "stem" = "stem"): string {
  return renderToStaticMarkup(<MathText flow={flow}>{source}</MathText>);
}

const parts = `计算：(1) $\\frac{1}{2}+\\frac{1}{3}=$______；(2) $\\sqrt{144}-3^{2}=$______；(3) $A_{12}^{4}=12\\times11\\times10\\times9=$______。`;
const longLine = "独立公式：\n\n$$1^{2}+2^{2}+3^{2}+\\cdots+30^{2}=\\dfrac{30\\times31\\times61}{6}$$";
const table = `| 名称 | 式子 |\n| --- | --- |\n| 分数 | $\\frac{3}{6}$ |\n| 根式 | $\\sqrt{144}$ |`;
const mixed = "每个数都是整数的 $\\frac{1}{10}$，先算 $100^2$。";

describe("公式排版渲染", () => {
  it("小问、分数、根式和上下标都变成 KaTeX，页面上看不见原始公式", () => {
    const html = render(parts);
    assert.equal((html.match(/class="part-line"/g) ?? []).length, 3);
    assert.match(html, /mfrac/);
    assert.match(html, /sqrt/);
    assert.match(html, /msupsub/);
    assert.doesNotMatch(html, /katex-error/);
    const text = visibleText(html);
    assert.match(text, /计算/);
    assert.doesNotMatch(text, /\\frac|\\sqrt|\$|\\times/);
  });

  it("独立长公式和表格留在可滚动的容器里", () => {
    const display = render(longLine);
    assert.match(display, /mfrac/);
    assert.doesNotMatch(display, /katex-display/);
    assert.ok((display.match(/class="base"/g) ?? []).length >= 2);
    assert.doesNotMatch(visibleText(display), /\\dfrac|\$\$/);

    const grid = render(table, "prose");
    assert.match(grid, /class="table-scroll"/);
    assert.match(grid, /<table>/);
    assert.match(grid, /mfrac/);
    assert.match(grid, /sqrt/);
  });

  it("公式后面的分号和句号跟着公式，不单独成行", () => {
    const blank = render("$1+2+3+4+3+2+1=16=$______；");
    assert.match(blank, /class="fill-blank"[^>]*>＿+；<\/span>/);
    const period = render("$A_{5}^{4}=5\\times4\\times3\\times2=120$。");
    assert.match(period, /120<\/span>。/);
    assert.doesNotMatch(period, /<\/span><\/span><\/span>。/);
  });

  it("填空横线整段留在一起，句号不掉到下一截", () => {
    const html = render("特别长：$2^{10}\\times2^{9}\\times2^{8}\\times2^{7}\\times2^{6}\\times2^{5}=$______。");
    assert.match(html, /class="fill-blank"[^>]*>＿+。<\/span>/);
    assert.doesNotMatch(visibleText(html), /\\times|\$/);
  });

  it("一句里的单个分数不会被拆成小问", () => {
    const html = render(mixed);
    assert.doesNotMatch(html, /part-line/);
    assert.match(html, /mfrac/);
    assert.match(visibleText(html), /每个数都是整数的/);
  });

  it("样式把长公式关在栏目里，而不是整页横滚", () => {
    const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
    assert.match(css, /\.fill-blank\s*\{[^}]*display:\s*inline-block/);
    assert.match(css, /\.part-line\s*\{[^}]*display:\s*flex/);
    assert.match(css, /\.eq-line\s*\{[^}]*overflow-x:\s*auto/);
    assert.match(css, /\.table-scroll\s*\{[^}]*overflow-x:\s*auto/);
    assert.match(css, /\.page\.narrow\s*\{[^}]*42rem/);
    assert.doesNotMatch(css, /overflow-x:\s*clip/);
  });
});
