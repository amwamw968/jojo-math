import type { Parent, PhrasingContent, Root, Text } from "mdast";

/**
 * Lay out a paragraph so a reader can scan it:
 * - two or more numbered sub-questions each start on their own row
 * - a run of inline formulas separated only by punctuation stacks one per row
 *
 * Formula source is never rewritten. Exponents, fractions, and roots stay
 * inside their math nodes.
 */
const SEPARATOR = /[；;，,、。．.]/;
const PUNCT_ONLY = /^[\s；;，,、。．.：:]*$/u;
const LEADING_PUNCT = /^[\s；;，,、。．.：:]+/u;
const SHORT_MARKER = /^[(（]?\d{1,2}[)）.．、.]*$/u;
const PART_MARKER = /[(（]\d{1,2}[)）]/gu;
const PART_MARKER_EXACT = /^[(（]\d{1,2}[)）]$/u;
const CLOSING_PROSE = /^(.*?[。．.])(\s*[\u4e00-\u9fff][\s\S]{7,})$/u;

interface Box {
  type: "eqLine" | "partLine" | "partNo" | "partBody" | "blank";
  children: Phrase[];
  data: {
    hName: "span";
    hProperties: { className: string[] };
  };
}

type Phrase = PhrasingContent | Box;

function isText(node: Phrase): node is Text {
  return node.type === "text";
}

function isInlineMath(node: Phrase): boolean {
  return node.type === "inlineMath";
}

function isPunctText(node: Phrase): node is Text {
  return isText(node) && PUNCT_ONLY.test(node.value);
}

function isPartMarker(node: Phrase): node is Text {
  return isText(node) && PART_MARKER_EXACT.test(node.value);
}

function box(type: Box["type"], className: string, children: Phrase[]): Box {
  return {
    type,
    data: { hName: "span", hProperties: { className: [className] } },
    children,
  };
}

function eqLine(children: PhrasingContent[]): Box {
  return box("eqLine", "eq-line", children);
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

function linesFromRun(nodes: PhrasingContent[]): Box[] {
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

function groupEquations(children: Phrase[]): Phrase[] {
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

function splitMarkerText(value: string): Text[] {
  const out: Text[] = [];
  const pattern = new RegExp(PART_MARKER.source, "gu");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    if (match.index > last) out.push({ type: "text", value: value.slice(last, match.index) });
    out.push({ type: "text", value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  return out.filter((node) => node.value !== "");
}

function flattenMarkers(children: Phrase[]): Phrase[] {
  const out: Phrase[] = [];
  for (const child of children) {
    if (isText(child)) out.push(...splitMarkerText(child.value));
    else out.push(child);
  }
  return out;
}

function peelClosingProse(nodes: Phrase[]): { kept: Phrase[]; tail: string } {
  const last = nodes[nodes.length - 1];
  if (!last || !isText(last)) return { kept: nodes, tail: "" };
  const match = CLOSING_PROSE.exec(last.value);
  if (!match) return { kept: nodes, tail: "" };
  const kept = nodes.slice(0, -1);
  if (match[1]) kept.push({ type: "text", value: match[1] });
  return { kept, tail: match[2] };
}

function applyParts(children: Phrase[]): Phrase[] | null {
  const flat = flattenMarkers(children);
  const marks = flat.flatMap((node, index) => (isPartMarker(node) ? [index] : []));
  if (marks.length < 2) return null;
  const out: Phrase[] = [];
  if (marks[0] > 0) out.push(...flat.slice(0, marks[0]));
  let tail = "";
  for (let index = 0; index < marks.length; index += 1) {
    const start = marks[index];
    const end = index + 1 < marks.length ? marks[index + 1] : flat.length;
    let body = flat.slice(start + 1, end);
    if (index === marks.length - 1) {
      const peeled = peelClosingProse(body);
      body = peeled.kept;
      tail = peeled.tail;
    }
    out.push(box("partLine", "part-line", [
      box("partNo", "part-no", [flat[start]]),
      box("partBody", "part-body", groupEquations(body)),
    ]));
  }
  if (tail.trim()) out.push({ type: "text", value: tail });
  return out;
}

function groupParagraph(children: Phrase[]): Phrase[] {
  return wrapBlanks(applyParts(children) ?? groupEquations(children));
}

const FILL_BLANK = /＿{2,}[。．.]?/gu;

function splitBlank(value: string): Phrase[] {
  const out: Phrase[] = [];
  let last = 0;
  for (const match of value.matchAll(FILL_BLANK)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: "text", value: value.slice(last, index) });
    out.push(box("blank", "fill-blank", [{ type: "text", value: match[0] }]));
    last = index + match[0].length;
  }
  if (last < value.length) out.push({ type: "text", value: value.slice(last) });
  if (last === 0) out.push({ type: "text", value });
  return out;
}

function wrapBlanks(nodes: Phrase[]): Phrase[] {
  return nodes.flatMap((node) => {
    if (isText(node)) return node.value.includes("＿") ? splitBlank(node.value) : [node];
    if ("children" in node && Array.isArray(node.children)) {
      return [{ ...node, children: wrapBlanks(node.children as Phrase[]) } as Phrase];
    }
    return [node];
  });
}

function wrapTree(node: Parent) {
  const children = node.children as Parent[];
  for (const child of children) {
    if (child.type === "paragraph") {
      child.children = wrapBlanks(child.children as Phrase[]) as PhrasingContent[];
      continue;
    }
    if (Array.isArray(child.children)) wrapTree(child);
  }
}

export function remarkWrapBlanks() {
  return (tree: Root) => {
    wrapTree(tree);
  };
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

/**
 * Flow math (`$$`) is one nowrap row, so a phone clips the end of a long
 * formula. Turn it into inline math in display style: KaTeX can break between
 * operators, and a single wide fraction still scrolls inside the line.
 */
export function remarkWrapDisplay() {
  return (tree: Root) => {
    const walk = (node: Parent) => {
      const next: Parent["children"] = [];
      for (const child of node.children) {
        if (child.type === "math") {
          const value = "value" in child && typeof child.value === "string" ? child.value : "";
          const tex = /\\displaystyle\b/.test(value) ? value : `\\displaystyle ${value}`;
          const inline = {
            type: "inlineMath" as const,
            value: tex,
            data: {
              hName: "code",
              hProperties: { className: ["language-math", "math-inline"] },
              hChildren: [{ type: "text" as const, value: tex }],
            },
          };
          next.push(node.type === "paragraph" ? inline : { type: "paragraph", children: [inline] });
          continue;
        }
        if ("children" in child && Array.isArray(child.children)) walk(child as Parent);
        next.push(child);
      }
      node.children = next;
    };
    walk(tree);
  };
}
