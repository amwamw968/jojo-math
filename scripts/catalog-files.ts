import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export interface StoredQuestion {
  id: string;
  jojo: { status?: string } | null;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function questionFiles(): string[] {
  return walk("data/questions").filter((file) => file.endsWith(".json")).sort();
}

export function readQuestions(): StoredQuestion[] {
  const questions: StoredQuestion[] = [];
  for (const file of questionFiles()) {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${file} 不是题目数组`);
    for (const item of parsed) questions.push(item as StoredQuestion);
  }
  return questions;
}

export function contentHash(): { files: number; hash: string } {
  const files = [...walk("data"), ...walk("public/figures")].sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update(readFileSync(file));
  }
  return { files: files.length, hash: hash.digest("hex") };
}
