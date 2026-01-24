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
import { Button, LogBox, Text, TextInput, View } from "react-native";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

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
  const [textInput, setTextInput] = useState("");

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
      } else if (isMidSequence.current) setBuffer((b) => [...b, lastFrequency]);
    }
    setLastFrequencyChange(Date.now());
    setLastFrequency(freq ?? -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq]);

  function sendMessage() {
    playNumbers(
      playTone,
      textInput.split("").map((c) => c.charCodeAt(0)),
    );
  }

  // function playSomeNumbers() {
  //   playNumbers(playTone, [260, 260, 508, 508, 248, 903, 903]);
  // }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TextInput
        value={textInput}
        style={{
          width: 240,
          margin: 10,
          padding: 10,
          borderWidth: 1,
          backgroundColor: "black",
          color: "white",
        }}
        placeholder="Message"
        onChangeText={(text) => setTextInput(text)}
      />
      <Button onPress={sendMessage} title="Send" />
      <Text>
        {"\n"}Live Frequency: {freq}
      </Text>
      <Text>{"\n"}Text:</Text>
      <Text>{numbers.map((n) => String.fromCharCode(n)).join("") + "\n"}</Text>
      <Text>Numbers:</Text>
      <Text style={{ marginHorizontal: 30 }}>
        {"[" + numbers.toString() + "]\n"}
      </Text>
      <Text>Buffer:</Text>
      <Text>{"[" + buffer.toString() + "]\n"}</Text>
      {/* <Button onPress={playSomeNumbers} title="Start Playing" /> */}
    </View>
  );
}
