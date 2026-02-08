import {
  BIT_ONE_BASE_FREQUENCY,
  BIT_ZERO_BASE_FREQUENCY,
  TOTAL_BITS,
} from "./config";

export function numberToFreqs(n: number) {
  const freqs: number[] = [];
  for (let bit = 1; bit <= Math.pow(2, TOTAL_BITS); bit *= 2) {
    if (bit > n) break;
    freqs.push(
      (n & bit) === 0 ? BIT_ZERO_BASE_FREQUENCY : BIT_ONE_BASE_FREQUENCY,
    );
  }

  return freqs;
}

export function freqsToNumber(buffer: number[]): number {
  let number = 0;
  for (let bitPos = 0; bitPos < buffer.length; bitPos++) {
    const frequency = buffer[bitPos];
    if (
      frequency !== BIT_ONE_BASE_FREQUENCY &&
      frequency !== BIT_ZERO_BASE_FREQUENCY
    )
      continue;
    const bitValue =
      frequency === BIT_ZERO_BASE_FREQUENCY ? 0 : Math.pow(2, bitPos);
    number += bitValue;
  }

  return number;
}
