import katex from "katex";

/** Turn \( \) and \[ \] into the dollar delimiters remark-math understands.
 * remark-math only treats $$ as a display block when the dollars sit on their own lines.
 * One-line $$...$$ is the form used in this repo, so expand it before rendering.
 * Runs of underscores outside math are fill-in blanks. Markdown would treat them as
 * emphasis and swallow the next sub-question, so they become fullwidth blanks. */
export function normalizeMathDelimiters(source: string): string {
  const normalized = source
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$${body}$`)
    .replace(/\$\$([^\n]+?)\$\$/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`);
  return protectFillInBlanks(normalized);
}

export function protectFillInBlanks(source: string): string {
  let out = "";
  let index = 0;
  while (index < source.length) {
    if (source.startsWith("$$", index) || source[index] === "$") {
      const marker = source.startsWith("$$", index) ? "$$" : "$";
      const end = source.indexOf(marker, index + marker.length);
      if (end === -1) {
        out += source.slice(index);
        break;
      }
      out += source.slice(index, end + marker.length);
      index = end + marker.length;
      continue;
    }
    if (source[index] === "_") {
      let end = index;
      while (end < source.length && source[end] === "_") end += 1;
      out += end - index >= 2 ? "＿".repeat(end - index) : "_";
      index = end;
      continue;
    }
    out += source[index];
    index += 1;
  }
  return out;
}

export interface MathPiece {
  tex: string;
  display: boolean;
}

export function mathPieces(source: string): MathPiece[] {
  const text = normalizeMathDelimiters(source);
  const pieces: MathPiece[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|(?<!\\)\$(?!\$)([^$\n]+?)\$/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match[1] !== undefined) pieces.push({ tex: match[1].trim(), display: true });
    else pieces.push({ tex: match[2].trim(), display: false });
  }
  return pieces;
}

/** Returns a short error, or null when every delimited formula renders. */
export function katexFailure(source: string): string | null {
  for (const piece of mathPieces(source)) {
    if (!piece.tex) return "空的公式";
    try {
      katex.renderToString(piece.tex, {
        throwOnError: true,
        displayMode: piece.display,
        strict: "ignore",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.split("\n")[0] : "无法解析";
      return `${piece.display ? "独立公式" : "行内公式"}：${message}`;
    }
  }
  return null;
}
