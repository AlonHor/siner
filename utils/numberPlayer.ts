import { RefObject } from "react";
import {
  END_OF_NUMBER_BASE_FREQUENCY,
  END_OF_SEQUENCE_BASE_FREQUENCY,
  FREQUENCY_GAP,
  NUMBERS_BOTTOM_BASE_FREQUENCY,
  NUMBERS_TOP_BASE_FREQUENCY,
  PLAY_INTERVAL,
  START_OF_SEQUENCE_BASE_FREQUENCY,
  TOTAL_BITS,
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

export async function playNumbers(
  playTone: Function,
  encode: Function,
  isSendError: RefObject<boolean>,
  channelFactor: RefObject<number>,
  numbers: number[],
) {
  const baseSequence = [[START_OF_SEQUENCE_BASE_FREQUENCY]];
  for (let number of numbers) {
    console.log(`T: encoded ${number} to ${encode(number)}`);
    baseSequence.push([
      ...numberToFreqs(encode(number)),
      END_OF_NUMBER_BASE_FREQUENCY,
    ]);
  }
  baseSequence.push([END_OF_SEQUENCE_BASE_FREQUENCY]);

  for (const data of baseSequence) {
    isSendError.current = true;
    while (isSendError.current) {
      console.log(
        `T: will (re?)send [${data.map((t) => t + channelFactor.current).toString()}]`,
      );
      for (const tone of data) {
        playTone(tone + channelFactor.current, PLAY_INTERVAL / 1000);
        await new Promise((r) => setTimeout(r, PLAY_INTERVAL));
      }
      isSendError.current = false;
      await new Promise((r) => setTimeout(r, PLAY_INTERVAL * 2.6));
    }
    console.log("T: didn't hear any errors! going to next number!");
  }
}
