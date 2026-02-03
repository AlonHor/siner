import { useHamming1511 } from "@/hooks/useHamming1511";
import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import { freqsToNumber, numberToFreqs } from "@/utils/bit";
import {
  CHANNEL_BANDWIDTH,
  END_OF_NUMBER_BASE_FREQUENCY,
  END_OF_SEQUENCE_BASE_FREQUENCY,
  ERROR_DETECTED_BASE_FREQUENCY,
  MAX_VALID_FREQ,
  MIN_VALID_FREQ,
  PLAY_INTERVAL,
  START_OF_SEQUENCE_BASE_FREQUENCY,
} from "@/utils/config";
import { useEffect, useRef } from "react";

export function useComms({
  onDataChange,
  onBufferChange,
}: {
  onDataChange: (data: number[]) => any;
  onBufferChange: (buffer: number[]) => any;
}) {
  let lastFrequencyChange = useRef<number>(Date.now());
  let lastFrequency = useRef<number>(-1);

  let isMidSequence = useRef(false);
  let isSendError = useRef(true);
  let data = useRef<number[]>([]);
  let buffer = useRef<number[]>([]);

  let channel = useRef<number>(0);
  let channelFactor = useRef<number>(0);

  const { playTone } = useSineWavePlayer();
  const freq = useUltrasonicFrequency({ channelFactor });
  const { encode, decode } = useHamming1511();

  useEffect(() => {
    channel.current = 1;
  }, []);

  function changeChannel(ch: number) {
    channel.current = ch;
    console.log(`channel is now ${channel.current}`);
  }

  useEffect(() => {
    channelFactor.current = channel.current * CHANNEL_BANDWIDTH;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.current]);

  useEffect(() => {
    if (Date.now() - PLAY_INTERVAL * 0.6 > lastFrequencyChange.current) {
      if (
        lastFrequency.current <= MAX_VALID_FREQ ||
        lastFrequency.current >= MIN_VALID_FREQ
      ) {
        console.log(`H: caught ${lastFrequency.current}`);
        switch (lastFrequency.current) {
          case END_OF_SEQUENCE_BASE_FREQUENCY + channelFactor.current:
            isSendError.current = false;
            isMidSequence.current = false;
            break;

          case START_OF_SEQUENCE_BASE_FREQUENCY + channelFactor.current:
            console.log("H: start sequence!");
            isSendError.current = false;
            data.current = [];
            buffer.current = [];
            onDataChange(data.current);
            isMidSequence.current = true;
            break;

          case END_OF_NUMBER_BASE_FREQUENCY + channelFactor.current:
            const number = freqsToNumber(
              decode,
              buffer.current.map((t) => t - channelFactor.current),
            );
            buffer.current = [];
            onBufferChange(buffer.current);
            if (number === null) {
              console.log("R: error detected, playing ERROR_DETECTED!");
              playTone(
                ERROR_DETECTED_BASE_FREQUENCY,
                channelFactor,
                PLAY_INTERVAL / 1000,
              );
            } else {
              data.current.push(number);
              onDataChange(data.current);
            }
            break;

          case ERROR_DETECTED_BASE_FREQUENCY + channelFactor.current:
            console.log("T: heard ERROR_DETECTED, resending...");
            isSendError.current = true;
            break;

          default:
            if (isMidSequence.current) {
              buffer.current.push(lastFrequency.current);
              onBufferChange(buffer.current);
            }
            break;
        }
      }
    }
    lastFrequencyChange.current = Date.now();
    lastFrequency.current = freq ?? -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq, channelFactor.current]);

  async function transmitData(data: number[]) {
    const baseSequence = [[START_OF_SEQUENCE_BASE_FREQUENCY]];
    for (let number of data) {
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
          playTone(tone, channelFactor, PLAY_INTERVAL / 1000);
          await new Promise((r) => setTimeout(r, PLAY_INTERVAL));
        }
        isSendError.current = false;
        await new Promise((r) => setTimeout(r, PLAY_INTERVAL * 2.6));
      }
      console.log("T: didn't hear any errors! going to next number!");
    }
  }

  function sendMessage(text: string) {
    transmitData(text.split("").map((c) => c.charCodeAt(0)));
  }

  return { sendMessage, data, buffer, channelFactor, changeChannel };
}
