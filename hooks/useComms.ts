import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import { freqsToNumber, numberToFreqs } from "@/utils/bit";
import { calculateChecksum } from "@/utils/checksum";
import {
  CHANNEL_BANDWIDTH,
  END_OF_NUMBER_BASE_FREQUENCY,
  END_OF_SEQUENCE_BASE_FREQUENCY,
  MAX_VALID_DATA_FREQ,
  MIN_VALID_DATA_FREQ,
  PLAY_INTERVAL,
  SIGERR_BASE_FREQUENCY,
  SIGOKY_BASE_FREQUENCY,
  START_OF_SEQUENCE_BASE_FREQUENCY,
} from "@/utils/config";
import { decode, encode } from "@/utils/numberConversion";
import { useEffect, useRef, useState } from "react";

export function useComms({
  onDataBufferChange: onDataBufferChange,
  onMessage: onMessage,
}: {
  onDataBufferChange: (data: number[]) => any;
  onMessage: (message: string) => any;
}) {
  const heldFreq = useRef<number | null>(null);
  const holdStart = useRef<number>(0);
  const emitCount = useRef<number>(0);
  const freqRef = useRef<number | null>(null);

  const INITIAL_DELAY = 0.5 * PLAY_INTERVAL;

  const [isTransmitting, setIsTransmitting] = useState(false);
  const isTransmittingRef = useRef(false);

  const [isMidSequence, setIsMidSequence] = useState(false);
  const isMidSequenceRef = useRef(false);

  const isSendError = useRef(true);
  const isRecieveError = useRef(false);

  const [bitBuffer, setBitBuffer] = useState<number[]>([]);
  const bitBufferRef = useRef<number[]>([]);
  const dataBuffer = useRef<number[]>([]);

  const { playTone } = useSineWavePlayer();
  const { freq, setChannelFactor, channelFactor } = useUltrasonicFrequency();

  const channelFactorRef = useRef<number>(0);

  function changeChannel(ch: number) {
    setChannelFactor(ch * CHANNEL_BANDWIDTH);
  }

  useEffect(() => {
    freqRef.current = freq;
  }, [freq]);

  useEffect(() => {
    bitBufferRef.current = bitBuffer;
  }, [bitBuffer]);

  useEffect(() => {
    isTransmittingRef.current = isTransmitting
  }, [isTransmitting]);

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
    if (isTransmittingRef.current) return;
    if (f <= MAX_VALID_DATA_FREQ && f >= MIN_VALID_DATA_FREQ) {
      switch (f) {
        case END_OF_SEQUENCE_BASE_FREQUENCY + channelFactorRef.current:
          console.log("H: end seq!");
          setIsMidSequence(false);

          const checkSum = dataBuffer.current.at(-1);
          const calculatedSum = calculateChecksum(
            dataBuffer.current.slice(0, -1),
          );

          // TODO: play SIGOKY/SIGERR only if recipient
          if (calculatedSum === checkSum) {
            // sum matches
            console.log("H: playing SIGOKY!");
            playTone(
              [SIGOKY_BASE_FREQUENCY],
              channelFactorRef.current,
              PLAY_INTERVAL / 1000,
            );

            onMessage(
              dataBuffer.current
                .slice(0, -1)
                .map((c) => String.fromCharCode(decode(c)))
                .join(""),
            );
          } else {
            console.log(`H: playing SIGERR! (${calculatedSum} != ${checkSum})`);
            playTone(
              [SIGERR_BASE_FREQUENCY],
              channelFactorRef.current,
              PLAY_INTERVAL / 1000,
            );
          }

          break;

        case START_OF_SEQUENCE_BASE_FREQUENCY + channelFactorRef.current:
          console.log("H: start seq!");
          dataBuffer.current = [];
          setBitBuffer([]);
          onDataBufferChange(dataBuffer.current);
          setIsMidSequence(true);
          isRecieveError.current = false;
          break;

        case END_OF_NUMBER_BASE_FREQUENCY + channelFactorRef.current:
          console.log(`H: parsing [${bitBufferRef.current.toString()}]`);
          const number = freqsToNumber(
            bitBufferRef.current.map((t) => t - channelFactorRef.current),
          );
          console.log(
            `H: got ${number} (${String.fromCharCode(number != null ? decode(number) : 32)})`,
          );
          setBitBuffer([]);
          if (number !== 0) {
            dataBuffer.current.push(number);
            onDataBufferChange(dataBuffer.current);
          }
          break;

        case SIGERR_BASE_FREQUENCY + channelFactorRef.current:
          console.log("T: detected SIGERR, forwarding...");
          isSendError.current = true;
          break;

        case SIGOKY_BASE_FREQUENCY + channelFactorRef.current:
          console.log("T: detected SIGOKY, forwarding...");
          isSendError.current = false;
          break;

        default:
          if (isMidSequenceRef.current) setBitBuffer((b) => [...b, f]);
          break;
      }
    }
  }

  async function transmitData(data: number[]) {
    setIsTransmitting(true);

    const baseSequence = [[START_OF_SEQUENCE_BASE_FREQUENCY]];
    const checksum = calculateChecksum(data);
    for (let number of data) {
      console.log(`T: will send ${number}`);
      baseSequence.push([
        ...numberToFreqs(number),
        END_OF_NUMBER_BASE_FREQUENCY,
      ]);
    }
    baseSequence.push([
      ...numberToFreqs(checksum),
      END_OF_NUMBER_BASE_FREQUENCY,
    ]);
    baseSequence.push([END_OF_SEQUENCE_BASE_FREQUENCY]);

    isSendError.current = true;
    while (isSendError.current) {
      isSendError.current = true;
      for (const data of baseSequence) {
        console.log(
          `T: sending [${data.map((t) => t + channelFactor).toString()}] {+${channelFactor}}`,
        );
        playTone(data, channelFactor, PLAY_INTERVAL / 1000);
        await new Promise((r) => setTimeout(r, PLAY_INTERVAL * data.length));
      }
      console.log("T: finished sending all data, listening for errors...");

      // main loop catches SIGOKY and modifies isSendError.current to false
      await new Promise((r) => setTimeout(r, PLAY_INTERVAL * 5));

      if (isSendError.current)
        console.log("T: resending due to SIGERR / no reply...");
    }
    console.log("T: got SIGOKY, all good!");

    setIsTransmitting(true);
  }

  function sendMessage(text: string) {
    transmitData(
      text
        .toLowerCase()
        .split("")
        .map((c) => encode(c.charCodeAt(0))),
    );
  }

  return {
    sendMessage,
    dataBuffer,
    bitBuffer,
    isMidSequence,
    isTransmitting,
    changeChannel,
  };
}
