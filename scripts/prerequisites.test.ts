import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { parseFrontmatter, parseIdList, parseRelated } from "../src/lib/frontmatter";
import { prerequisiteCycle } from "../src/lib/prerequisites";

function knowledgeEdges(): Map<string, { related: string[]; prerequisites: string[] }> {
  const dir = "data/knowledge";
  const edges = new Map<string, { related: string[]; prerequisites: string[] }>();
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const id = path.basename(name, ".md");
    const parsed = parseFrontmatter(readFileSync(path.join(dir, name), "utf8"));
    edges.set(id, {
      related: parseRelated(parsed.data.related),
      prerequisites: parseIdList(parsed.data.prerequisites, "prerequisites"),
    });
  }
  return edges;
}

describe("先修和相关是两种关系", () => {
  it("有向环会被找出来", () => {
    const cycle = prerequisiteCycle(new Map([
      ["a", ["b"]],
      ["b", ["a"]],
    ]));
    assert.deepEqual(cycle, ["a", "b", "a"]);
    assert.equal(prerequisiteCycle(new Map([
      ["a", ["b"]],
      ["b", ["c"]],
      ["c", []],
    ])), null);
  });

  it("这一讲的先修没有环，相关也不会被当成先修", () => {
    const edges = knowledgeEdges();
    const directed = new Map([...edges].map(([id, item]) => [id, item.prerequisites]));
    assert.equal(prerequisiteCycle(directed), null);

    const permutation = edges.get("count-permutation");
    const circular = edges.get("count-circular-perm");
    const grouping = edges.get("count-group-dedup");
    const select = edges.get("count-select-then-arrange");
    assert.deepEqual(permutation?.prerequisites, ["count-perm-vs-comb"]);
    assert.equal(permutation?.related.includes("count-circular-perm"), true);
    assert.deepEqual(circular?.prerequisites, ["count-permutation"]);
    assert.equal(circular?.prerequisites.includes("count-select-then-arrange"), false);
    assert.equal(circular?.related.includes("count-select-then-arrange"), true);
    assert.deepEqual(grouping?.prerequisites, ["count-combination"]);
    assert.equal(select?.prerequisites.includes("count-circular-perm"), false);
    assert.equal(select?.prerequisites.includes("count-group-dedup"), false);

    const index = JSON.parse(readFileSync("data/knowledge/index.json", "utf8")) as { id: string }[];
    const ids = new Set(index.map((item) => item.id));
    assert.equal(ids.has("搭配的智慧"), false);
    assert.equal(ids.has("城市生态绿化"), false);
  });
});
