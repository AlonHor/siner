import { useCallback } from "react";

const pearsonTable = Array.from({ length: 256 }, (_, i) => i);

function encodeNumber(n: number): number {
  let hash = 0;
  hash = pearsonTable[(hash ^ n) & 0xff];
  
  const combined = (n << 8) | hash;
  return combined;
}

function decodeNumber(encoded: number): number | null {
  const original = encoded >> 8;
  const hash = encoded & 0xff;

  if (encodeNumber(original) === encoded) {
    return original;
  }
  
  return null;
}

export function usePearsonHash() {
  const encode = useCallback((n: number): number => {
    return encodeNumber(n);
  }, []);

  const decode = useCallback((code: number): number | null => {
    return decodeNumber(code);
  }, []);

  return { encode, decode };
}
