import {
  FREQUENCY_GAP,
  NUMBERS_BOTTOM_BASE_FREQUENCY,
  NUMBERS_TOP_BASE_FREQUENCY,
  TOTAL_BITS
} from "./config";

export function numberToFreqs(n: number) {
  const freqs: number[] = [];
  for (let bit = 1; bit <= Math.pow(2, TOTAL_BITS); bit *= 2) {
    if ((n & bit) !== 0) {
      freqs.push(NUMBERS_TOP_BASE_FREQUENCY - Math.log2(bit) * FREQUENCY_GAP);
    }
  }

  return freqs;
}

export function freqsToNumber(decode: Function, buffer: number[]): number {
  let number = 0;
  for (const frequency of buffer) {
    if (
      frequency > NUMBERS_TOP_BASE_FREQUENCY ||
      frequency < NUMBERS_BOTTOM_BASE_FREQUENCY
    )
      continue;
    const bit = Math.pow(
      2,
      (NUMBERS_TOP_BASE_FREQUENCY - frequency) / FREQUENCY_GAP,
    );
    number += bit;
  }
  console.log(`R: decoded ${number} to ${decode(number)}`);

  return decode(number);
}
