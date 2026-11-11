export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) {
    throw new Error("缺少开头的 ---");
  }
  const end = text.indexOf("\n---", 3);
  if (end < 0) throw new Error("frontmatter 没有用 --- 结束");
  const block = text.slice(text.indexOf("\n") + 1, end);
  const body = text.slice(end + 4).replace(/^\r?\n/, "");
  const data: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) throw new Error(`无法解析这一行：${line}`);
    data[match[1]] = match[2].trim();
  }
  return { data, body };
}

export function parseIdList(value: string | undefined, field: string): string[] {
  if (!value) return [];
  const match = value.match(/^\[(.*)\]$/);
  if (!match) throw new Error(`${field} 应写成 [id, id]，实际是：${value}`);
  if (!match[1].trim()) return [];
  return match[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseRelated(value: string | undefined): string[] {
  return parseIdList(value, "related");
}
