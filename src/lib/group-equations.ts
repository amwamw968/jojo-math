import type { Parent, PhrasingContent, Root, Text } from "mdast";

/**
 * Stack semicolon-separated inline formulas onto their own lines.
 * This walks the parsed markdown tree. It does not split formula source,
 * so exponents, fractions, and escaped blanks stay inside their math nodes.
 */
const SEPARATOR = /[；;，,、。．.]/;
const PUNCT_ONLY = /^[\s；;，,、。．.：:]*$/u;
const LEADING_PUNCT = /^[\s；;，,、。．.：:]+/u;
const SHORT_MARKER = /^[(（]?\d{1,2}[)）.．、.]*$/u;

interface EqLine extends Parent {
  type: "eqLine";
  children: PhrasingContent[];
  data: {
    hName: "span";
    hProperties: { className: string[] };
  };
}

type Phrase = PhrasingContent | EqLine;

function isText(node: Phrase): node is Text {
  return node.type === "text";
}

function isInlineMath(node: Phrase): boolean {
  return node.type === "inlineMath";
}

function isPunctText(node: Phrase): node is Text {
  return isText(node) && PUNCT_ONLY.test(node.value);
}

function eqLine(children: PhrasingContent[]): EqLine {
  return {
    type: "eqLine",
    data: { hName: "span", hProperties: { className: ["eq-line"] } },
    children,
  };
}

function isShortLead(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (SHORT_MARKER.test(trimmed)) return true;
  return trimmed.length <= 6 && /[：:]$/.test(trimmed) && !/[？?。]/.test(trimmed);
}

function findRun(children: Phrase[], start: number): { start: number; end: number } | null {
  if (!isInlineMath(children[start])) return null;
  let end = start;
  let count = 1;
  let index = start + 1;
  while (index < children.length) {
    const gapStart = index;
    while (index < children.length && isPunctText(children[index])) index += 1;
    if (index === gapStart || index >= children.length || !isInlineMath(children[index])) break;
    const gap = children.slice(gapStart, index).map((node) => (node as Text).value).join("");
    if (!SEPARATOR.test(gap)) break;
    end = index;
    count += 1;
    index += 1;
  }
  if (count < 2) return null;
  return { start, end };
}

function linesFromRun(nodes: PhrasingContent[]): EqLine[] {
  const lines: PhrasingContent[][] = [];
  let current: PhrasingContent[] = [];
  for (const node of nodes) {
    if (node.type === "inlineMath" && current.length > 0) {
      lines.push(current);
      current = [node];
    } else {
      current.push(node);
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.map((children) => eqLine(children));
}

function groupParagraph(children: Phrase[]): Phrase[] {
  const out: Phrase[] = [];
  let index = 0;
  while (index < children.length) {
    const run = findRun(children, index);
    if (!run) {
      out.push(children[index]);
      index += 1;
      continue;
    }
    const lines = linesFromRun(children.slice(run.start, run.end + 1) as PhrasingContent[]);
    const previous = out[out.length - 1];
    if (previous && isText(previous) && isShortLead(previous.value)) {
      out.pop();
      lines[0].children.unshift(previous);
    }
    index = run.end + 1;
    const trailing = children[index];
    if (trailing && isText(trailing)) {
      const value = trailing.value;
      const peeled = LEADING_PUNCT.exec(value);
      if (peeled) lines[lines.length - 1].children.push({ type: "text", value: peeled[0] });
      const rest = value.slice(peeled ? peeled[0].length : 0);
      out.push(...lines);
      if (rest) out.push({ type: "text", value: rest });
      index += 1;
    } else {
      out.push(...lines);
    }
  }
  return out;
}

function transform(node: Parent) {
  const children = node.children as Parent[];
  for (const child of children) {
    if (child.type === "paragraph") {
      child.children = groupParagraph(child.children as Phrase[]) as PhrasingContent[];
      continue;
    }
    if (Array.isArray(child.children)) transform(child);
  }
}

export function remarkGroupEquations() {
  return (tree: Root) => {
    transform(tree);
  };
}
