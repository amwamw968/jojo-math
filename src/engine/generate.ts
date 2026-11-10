/* generateVariants follows makeItems / genOne in kenowong/pep-math-coach
   js/olympiad.js: pick an engine from the lecture map, generate one original
   drill, and skip a repeated stem. That repository has no license. */

import type { EngineId, Variant } from "./engines";
import { ENG, isEngineId, KP_ENGINES } from "./engines";
import { makeRng } from "./rng";
import { lectureById } from "../lib/syllabus-data";

export function enginesFor(id: string): EngineId[] {
  const lecture = lectureById(id);
  if (lecture) return lecture.engines.filter(isEngineId);
  return KP_ENGINES[id] ?? [];
}

export function generateVariants(id: string, n: number, seed: number): Variant[] {
  const engines = enginesFor(id);
  if (n <= 0 || engines.length === 0) return [];
  const rng = makeRng(seed >>> 0);
  const out: Variant[] = [];
  const seen = new Set<string>();
  let guard = 0;
  let cursor = 0;
  while (out.length < n && guard < n * 30) {
    const engine = engines[cursor % engines.length];
    cursor += 1;
    guard += 1;
    const item = ENG[engine].gen(rng);
    const fingerprint = `${item.engine}\n${item.stem}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    out.push(item);
  }
  return out;
}
