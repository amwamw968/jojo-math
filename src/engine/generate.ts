import type { EngineId, Variant } from "./engines";
import { ENG, isEngineId, KP_ENGINES } from "./engines";
import { makeRng } from "./rng";
import { lectureById } from "../lib/syllabus-data";

export function enginesFor(id: string): EngineId[] {
  const lecture = lectureById(id);
  if (lecture) return lecture.engines.filter(isEngineId);
  return KP_ENGINES[id] ?? [];
}

/** Separate stream per slot, so variant 3 does not depend on how variant 2 used its draws. */
function slotSeed(seed: number, slot: number): number {
  let mixed = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(slot + 1, 0xc2b2ae35);
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x7feb352d);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x846ca68b);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

export function generateVariants(id: string, count: number, seed: number): Variant[] {
  const engines = enginesFor(id);
  if (count < 1 || engines.length === 0) return [];
  const made: Variant[] = [];
  const seen = new Set<string>();
  for (let slot = 0; made.length < count && slot < count * 8; slot += 1) {
    const engineId = engines[slot % engines.length];
    const item = ENG[engineId].gen(makeRng(slotSeed(seed, slot)));
    const key = `${item.engine}:${item.stem}`;
    if (seen.has(key)) continue;
    seen.add(key);
    made.push(item);
  }
  return made;
}
