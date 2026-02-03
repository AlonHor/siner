import { useHamming1511 } from "@/hooks/useHamming1511";
import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
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
import { freqsToNumber, playNumbers } from "@/utils/numberPlayer";
import { useEffect, useRef } from "react";

export function useComms({
  onDataChange,
  onBufferChange,
}: {
  onDataChange: (data: number[]) => any;
  onBufferChange: (buffer: number[]) => any;
}) {
  const { playTone } = useSineWavePlayer();
  const freq = useUltrasonicFrequency();
  const { encode, decode } = useHamming1511();

  let lastFrequencyChange = useRef<number>(Date.now());
  let lastFrequency = useRef<number>(-1);

  let isMidSequence = useRef(false);
  let isSendError = useRef(true);
  let data = useRef<number[]>([]);
  let buffer = useRef<number[]>([]);

  let channel = useRef<number>(0);
  let channelFactor = useRef<number>(0);

  useEffect(() => {
    channel.current = 2;
  }, []);

  useEffect(() => {
    channelFactor.current = channel.current * CHANNEL_BANDWIDTH;
  }, [channel]);

  useEffect(() => {
    if (Date.now() - PLAY_INTERVAL * 0.6 > lastFrequencyChange.current) {
      if (
        lastFrequency.current <= MAX_VALID_FREQ ||
        lastFrequency.current >= MIN_VALID_FREQ
      ) {
        switch (lastFrequency.current) {
          case END_OF_SEQUENCE_BASE_FREQUENCY + channelFactor.current:
            isSendError.current = false;
            isMidSequence.current = false;
            break;

          case START_OF_SEQUENCE_BASE_FREQUENCY + channelFactor.current:
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
                ERROR_DETECTED_BASE_FREQUENCY + channelFactor.current,
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
  }, [freq, channelFactor]);

  function sendMessage(text: string) {
    playNumbers(
      playTone,
      encode,
      isSendError,
      channelFactor,
      text.split("").map((c) => c.charCodeAt(0)),
    );
  }

  return { sendMessage, data, buffer };
}
