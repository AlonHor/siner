import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import {
  CARRIER_FREQUENCY,
  END_OF_NUMBER_FREQUENCY,
  END_OF_SEQUENCE_FREQUENCY,
  PLAY_INTERVAL,
  SAMPLE_RATE,
  START_OF_SEQUENCE_FREQUENCY,
} from "@/utils/config";
import { freqsToNumber, playNumbers } from "@/utils/numberPlayer";
import React, { useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";

export default function Index() {
  const { playTone } = useSineWavePlayer({
    carrierFreq: CARRIER_FREQUENCY,
    sampleRate: SAMPLE_RATE,
  });

  const freq = useUltrasonicFrequency({
    carrierFreq: CARRIER_FREQUENCY,
    sampleRate: SAMPLE_RATE,
  });

  const [lastFrequencyChange, setLastFrequencyChange] = useState(Date.now());
  const [lastFrequency, setLastFrequency] = useState(-1);

  const [buffer, setBuffer] = useState<number[]>([]);
  const [numbers, setNumbers] = useState<number[]>([]);

  let isMidSequence = useRef(false);

  useEffect(() => {
    if (Date.now() - PLAY_INTERVAL * 0.6 > lastFrequencyChange) {
      if (lastFrequency === END_OF_SEQUENCE_FREQUENCY)
        isMidSequence.current = false;
      else if (lastFrequency === START_OF_SEQUENCE_FREQUENCY) {
        setNumbers([]);
        isMidSequence.current = true;
      } else if (lastFrequency === END_OF_NUMBER_FREQUENCY) {
        setNumbers((n) => [...n, freqsToNumber(buffer)]);
        setBuffer([]);
      }
      if (isMidSequence.current) setBuffer((b) => [...b, lastFrequency]);
    }
    setLastFrequencyChange(Date.now());
    setLastFrequency(freq ?? -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq]);

  function playSomeNumbers() {
    playNumbers(playTone, [260, 260, 508, 508, 248, 903, 903]);
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Live Frequency: {freq}</Text>
      <Text>{"\n"}Numbers:</Text>
      <Text>{"[" + numbers.toString() + "]\n"}</Text>
      <Text>Buffer:</Text>
      <Text>{"[" + buffer.toString() + "]\n"}</Text>
      <Button onPress={playSomeNumbers} title="Start Playing" />
    </View>
  );
}
