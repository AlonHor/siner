type Range = {
  inMin: number;
  inMax: number;
  outMin: number;
};

const ENCODE_RANGES: Range[] = [
  // a-z -> 1-26
  { inMin: 97, inMax: 122, outMin: 1 },

  // 0-9 -> 27-36
  { inMin: 48, inMax: 57, outMin: 27 },
];

const ENCODE_SINGLE = new Map<number, number>([
  [32, 37], // space
  [46, 38], // dot
]);

export function encode(n: number): number {
  for (const { inMin, inMax, outMin } of ENCODE_RANGES) {
    if (n >= inMin && n <= inMax) {
      return outMin + (n - inMin);
    }
  }

  return ENCODE_SINGLE.get(n) ?? 0;
}

export function decode(n: number): number {
  for (const { inMin, inMax, outMin } of ENCODE_RANGES) {
    const outMax = outMin + (inMax - inMin);
    if (n >= outMin && n <= outMax) {
      return inMin + (n - outMin);
    }
  }

  for (const [decoded, encoded] of ENCODE_SINGLE) {
    if (n === encoded) return decoded;
  }

  return 0;
}
