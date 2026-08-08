/** Deterministic mulberry32 PRNG */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return {
    next(): number {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(this.next() * arr.length)]!;
    },
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
