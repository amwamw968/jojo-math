import katex from "katex";

/** Turn \( \) and \[ \] into the dollar delimiters remark-math understands.
 * remark-math only treats $$ as a display block when the dollars sit on their own lines.
 * One-line $$...$$ is the form used in this repo, so expand it before rendering. */
export function normalizeMathDelimiters(source: string): string {
  return source
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$${body}$`)
    .replace(/\$\$([^\n]+?)\$\$/g, (_, body: string) => `\n$$\n${body.trim()}\n$$\n`);
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
