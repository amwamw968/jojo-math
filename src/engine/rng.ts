/** Seeded 0–1 draws so the same seed reprints the same drill. */

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
}

export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  if (state === 0) state = 0xa341316c;
  return {
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    },
    int(min: number, max: number) {
      const span = max - min + 1;
      return min + Math.floor(this.next() * span);
    },
  };
}
