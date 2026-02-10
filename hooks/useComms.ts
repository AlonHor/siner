import { usePearsonHash } from "@/hooks/usePearsonHash";
import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import { freqsToNumber, numberToFreqs } from "@/utils/bit";
import {
  CHANNEL_BANDWIDTH,
  END_OF_NUMBER_BASE_FREQUENCY,
  END_OF_SEQUENCE_BASE_FREQUENCY,
  ERROR_DETECTED_BASE_FREQUENCY,
  MAX_VALID_DATA_FREQ,
  MIN_VALID_DATA_FREQ,
  PLAY_INTERVAL,
  START_OF_SEQUENCE_BASE_FREQUENCY,
} from "@/utils/config";
import { useEffect, useRef, useState } from "react";

export function useComms({
  onDataChange,
}: {
  onDataChange: (data: number[]) => any;
}) {
  const heldFreq = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  const emitCount = useRef<number>(0);
  const freqRef = useRef<number | null>(null);

  const INITIAL_DELAY = 0.7 * PLAY_INTERVAL;

  const [isMidSequence, setIsMidSequence] = useState(false);
  const isMidSequenceRef = useRef(false);
  const isSendError = useRef(true);

  const [buffer, setBuffer] = useState<number[]>([]);
  const bufferRef = useRef<number[]>([]);
  const data = useRef<number[]>([]);

  const { playTone } = useSineWavePlayer();
  const { freq, setChannelFactor, channelFactor } = useUltrasonicFrequency();
  const { encode, decode } = usePearsonHash();

  const channelFactorRef = useRef<number>(0);

  function changeChannel(ch: number) {
    setChannelFactor(ch * CHANNEL_BANDWIDTH);
  }

  useEffect(() => {
    freqRef.current = freq;
  }, [freq]);

  useEffect(() => {
    bufferRef.current = buffer;
  }, [buffer]);

  useEffect(() => {
    isMidSequenceRef.current = isMidSequence;
  }, [isMidSequence]);

  useEffect(() => {
    channelFactorRef.current = channelFactor;
  }, [channelFactor]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();

      if (freqRef.current !== heldFreq.current) {
        heldFreq.current = freqRef.current;
        holdStart.current = now;
        emitCount.current = 0;
        return;
      }

      const heldDuration = now - holdStart.current;
      if (heldDuration < INITIAL_DELAY) return;

      const effectiveTime = heldDuration - INITIAL_DELAY;
      const shouldHaveEmitted = 1 + Math.floor(effectiveTime / PLAY_INTERVAL);

      while (emitCount.current < shouldHaveEmitted) {
        onFreqHeld(freqRef.current ?? -1);
        emitCount.current++;
      }
    }, 5);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFreqHeld(f: number) {
    if (f <= MAX_VALID_DATA_FREQ && f >= MIN_VALID_DATA_FREQ) {
      switch (f) {
        case END_OF_SEQUENCE_BASE_FREQUENCY + channelFactorRef.current:
          console.log("H: end seq!");
          isSendError.current = false;
          setIsMidSequence(false);
          break;

        case START_OF_SEQUENCE_BASE_FREQUENCY + channelFactorRef.current:
          console.log("H: start seq!");
          isSendError.current = false;
          data.current = [];
          setBuffer([]);
          onDataChange(data.current);
          setIsMidSequence(true);
          break;

        case END_OF_NUMBER_BASE_FREQUENCY + channelFactorRef.current:
          console.log(`H: parsing buffer [${bufferRef.current.toString()}]`);
          const number = decode(
            freqsToNumber(
              bufferRef.current.map((t) => t - channelFactorRef.current),
            ),
          );
          console.log(
            `H: decoded to ${number} (${String.fromCharCode(number != null ? number : 32)})`,
          );
          setBuffer([]);
          if (number === null) {
            console.log("H: error detected, playing ERROR_DETECTED!");
            playTone(
              [ERROR_DETECTED_BASE_FREQUENCY],
              channelFactorRef.current,
              PLAY_INTERVAL / 1000,
            );
          } else if (number !== 0) {
            data.current.push(number);
            onDataChange(data.current);
          }
          break;

        case ERROR_DETECTED_BASE_FREQUENCY + channelFactorRef.current:
          console.log("T: heard ERROR_DETECTED, resending...");
          isSendError.current = true;
          break;

        default:
          if (isMidSequenceRef.current) setBuffer((b) => [...b, f]);
          break;
      }
    }
  }

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
          `T: will (re?)send [${data.map((t) => t + channelFactor).toString()}] {+${channelFactor}}`,
        );
        playTone(data, channelFactor, PLAY_INTERVAL / 1000);
        await new Promise((r) => setTimeout(r, PLAY_INTERVAL * data.length));
        isSendError.current = false;
        await new Promise((r) => setTimeout(r, PLAY_INTERVAL * 3));
      }
      console.log("T: didn't hear any errors! going to next number!");
    }
  }

  function sendMessage(text: string) {
    transmitData(text.split("").map((c) => c.charCodeAt(0)));
  }

  return {
    sendMessage,
    data,
    buffer,
    isMidSequence,
    changeChannel,
  };
}
