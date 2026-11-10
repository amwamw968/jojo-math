/* Inclusive integer ranges follow rnd() in kenowong/pep-math-coach js/olympiad.js.
   The generator there uses Math.random(); this one is seeded so the same seed
   always reprints the same drill. That repository has no license. */

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
}

export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
  };
}
