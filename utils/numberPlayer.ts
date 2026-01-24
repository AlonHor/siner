import {
  END_OF_NUMBER_FREQUENCY,
  END_OF_SEQUENCE_FREQUENCY,
  NUMBERS_BOTTOM_FREQUENCY,
  NUMBERS_TOP_FREQUENCY,
  PLAY_INTERVAL,
  START_OF_SEQUENCE_FREQUENCY,
} from "./config";

export function numberToFreqs(n: number) {
  const freqs: number[] = [];
  for (let bit = 1; bit <= 1024; bit *= 2) {
    if ((n & bit) !== 0) {
      freqs.push(
        NUMBERS_TOP_FREQUENCY -
          Math.log2(bit) *
            ((NUMBERS_TOP_FREQUENCY - NUMBERS_BOTTOM_FREQUENCY) / 10),
      );
    }
  }

  return freqs;
}

export function freqsToNumber(buffer: number[]): number {
  let number = 0;
  for (const frequency of buffer) {
    if (
      frequency > NUMBERS_TOP_FREQUENCY ||
      frequency < NUMBERS_BOTTOM_FREQUENCY
    )
      continue;
    const bit = Math.pow(
      2,
      (NUMBERS_TOP_FREQUENCY - frequency) /
        ((NUMBERS_TOP_FREQUENCY - NUMBERS_BOTTOM_FREQUENCY) / 10),
    );
    number += bit;
  }

  return number;
}

/* bit representations
  19000 // 1024
  19200 // 512
  19400 // 256
  19600 // 128
  19800 // 64
  20000 // 32
  20200 // 16
  20400 // 8
  20600 // 4
  20800 // 2
  21000 // 1
*/

export async function playNumbers(playTone: Function, numbers: number[]) {
  const sequence = [START_OF_SEQUENCE_FREQUENCY];
  for (let number of numbers) {
    for (const freq of numberToFreqs(number)) {
      sequence.push(freq);
    }
    sequence.push(END_OF_NUMBER_FREQUENCY);
  }
  sequence.push(END_OF_SEQUENCE_FREQUENCY);

  for (const tone of sequence) {
    playTone(tone, PLAY_INTERVAL / 1000);
    await new Promise((r) => setTimeout(r, PLAY_INTERVAL));
  }
}
