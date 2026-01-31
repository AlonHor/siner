import { useCallback } from "react";

export function useHamming1511() {
  const encode = useCallback((n: number): number => {
    if (!Number.isInteger(n) || n < 1 || n > 2047) {
      throw new Error("Input must be an integer between 1 and 2047");
    }

    const bits = Array(16).fill(0);

    let dataBit = 0;
    for (let i = 15; i >= 1; i--) {
      if ((i & (i - 1)) !== 0) {
        bits[i] = (n >> dataBit) & 1;
        dataBit++;
      }
    }

    for (let p = 1; p <= 8; p <<= 1) {
      let parity = 0;
      for (let i = 1; i <= 15; i++) {
        if (i & p) parity ^= bits[i];
      }
      bits[p] = parity;
    }

    let encoded = 0;
    for (let i = 1; i <= 15; i++) {
      encoded = (encoded << 1) | bits[i];
    }

    return encoded;
  }, []);

  const decode = useCallback((code: number): number | null => {
    if (!Number.isInteger(code) || code < 0 || code > 0x7fff) {
      return null;
    }

    const bits = Array(16).fill(0);
    for (let i = 15; i >= 1; i--) {
      bits[i] = code & 1;
      code >>= 1;
    }

    let syndrome = 0;
    for (let p = 1; p <= 8; p <<= 1) {
      let parity = 0;
      for (let i = 1; i <= 15; i++) {
        if (i & p) parity ^= bits[i];
      }
      if (parity !== 0) syndrome |= p;
    }

    if (syndrome !== 0) {
      if (syndrome < 1 || syndrome > 15) return null;
      bits[syndrome] ^= 1;
    }

    let value = 0;
    let shift = 0;
    for (let i = 15; i >= 1; i--) {
      if ((i & (i - 1)) !== 0) {
        value |= bits[i] << shift;
        shift++;
      }
    }

    return value;
  }, []);

  return { encode, decode };
}
