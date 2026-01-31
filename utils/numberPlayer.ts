import { RefObject } from "react";
import {
  END_OF_NUMBER_FREQUENCY,
  END_OF_SEQUENCE_FREQUENCY,
  FREQUENCY_GAP,
  NUMBERS_BOTTOM_FREQUENCY,
  NUMBERS_TOP_FREQUENCY,
  PLAY_INTERVAL,
  START_OF_SEQUENCE_FREQUENCY,
  TOTAL_BITS,
} from "./config";

export function numberToFreqs(n: number) {
  const freqs: number[] = [];
  for (let bit = 1; bit <= Math.pow(2, TOTAL_BITS); bit *= 2) {
    if ((n & bit) !== 0) {
      freqs.push(NUMBERS_TOP_FREQUENCY - Math.log2(bit) * FREQUENCY_GAP);
    }
  }

  return freqs;
}

export function freqsToNumber(decode: Function, buffer: number[]): number {
  let number = 0;
  for (const frequency of buffer) {
    if (
      frequency > NUMBERS_TOP_FREQUENCY ||
      frequency < NUMBERS_BOTTOM_FREQUENCY
    )
      continue;
    const bit = Math.pow(
      2,
      (NUMBERS_TOP_FREQUENCY - frequency) / FREQUENCY_GAP,
    );
    number += bit;
  }
  console.log(`decoded ${number} is ${decode(number)}`);

  return decode(number);
}

export async function playNumbers(
  playTone: Function,
  encode: Function,
  isError: RefObject<boolean>,
  numbers: number[],
) {
  const sequence = [[START_OF_SEQUENCE_FREQUENCY]];
  for (let number of numbers) {
    console.log(`encoded ${number} is ${encode(number)}`);
    sequence.push([...numberToFreqs(encode(number)), END_OF_NUMBER_FREQUENCY]);
  }
  sequence.push([END_OF_SEQUENCE_FREQUENCY]);

  for (const data of sequence) {
    isError.current = true;
    while (isError.current) {
      console.log(`error is true, gonna play [${data.toString()}]`);
      for (const tone of data) {
        playTone(tone, PLAY_INTERVAL / 1000);
        await new Promise((r) => setTimeout(r, PLAY_INTERVAL));
      }
      await new Promise((r) => setTimeout(r, PLAY_INTERVAL * 3));
    }
    console.log("error is FALSE! going to next number!!");
  }
}
