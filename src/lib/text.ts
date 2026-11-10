function texToPlain(tex: string): string {
  let text = tex;
  text = text.replace(/\\frac\s*\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2");
  text = text.replace(/\\(?:cdots|ldots|dots)/g, "…");
  text = text.replace(/\\times/g, "×");
  text = text.replace(/\\div/g, "÷");
  text = text.replace(/\\cdot/g, "·");
  text = text.replace(/\\pm/g, "±");
  text = text.replace(/\\le(?:q)?/g, "≤");
  text = text.replace(/\\ge(?:q)?/g, "≥");
  text = text.replace(/\\ne(?:q)?/g, "≠");
  text = text.replace(/\\text\{([^{}]*)\}/g, "$1");
  text = text.replace(/\\_/g, "_");
  text = text.replace(/\\[a-zA-Z]+/g, "");
  text = text.replace(/[{}]/g, "");
  text = text.replace(/\s+/g, " ");
  return text.trim();
}

/** 列表、搜索、打印预览用的纯文本，方便换行。详情页仍用 KaTeX。 */
export function stemPlain(input: string): string {
  const withoutDisplay = input.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex: string) => texToPlain(tex));
  const withoutInline = withoutDisplay.replace(/\$([^$]+)\$/g, (_, tex: string) => texToPlain(tex));
  return withoutInline
    .replace(/\\_/g, "_")
    .replace(/\\([\\`*_{}[\]()#+.!|-])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function previewText(input: string, max = 48): string {
  const plain = stemPlain(input);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max)}…`;
}

export function figureUrl(figure: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${figure}`;
}

export function todayStamp(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
