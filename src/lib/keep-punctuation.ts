/**
 * A short punctuation mark after a formula or a fill-in blank is its own
 * text node, so a narrow line can leave "；" or "。" alone on the next row.
 * Move that mark into the nowrap blank, or into the last KaTeX fragment.
 */

interface HastNode {
  type: string;
  value?: string;
  properties?: { className?: string | string[] };
  children?: HastNode[];
}

const PUNCT = /^[\s；;，,、。．.：:]+$/u;

function classes(node: HastNode): string[] {
  const value = node.properties?.className;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/);
  return [];
}

function lastBase(node: HastNode): HastNode | null {
  let found: HastNode | null = null;
  const walk = (current: HastNode) => {
    if (current.type === "element" && classes(current).includes("base")) found = current;
    for (const child of current.children ?? []) walk(child);
  };
  walk(node);
  return found;
}

export function rehypeKeepPunctuation() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      const kids = node.children;
      if (!kids) return;
      for (const child of kids) {
        if (child.type === "element") walk(child);
      }
      for (let index = 0; index < kids.length; index += 1) {
        const child = kids[index];
        if (child.type !== "text" || !child.value || !PUNCT.test(child.value)) continue;
        const punct = child.value.trim();
        if (!punct) continue;
        const prev = kids[index - 1];
        if (!prev || prev.type !== "element") continue;
        const names = classes(prev);
        const host = names.includes("fill-blank") ? prev : names.includes("katex") ? lastBase(prev) : null;
        if (!host) continue;
        host.children = host.children ?? [];
        host.children.push({ type: "text", value: punct });
        kids.splice(index, 1);
        index -= 1;
      }
    };
    walk(tree);
  };
}
