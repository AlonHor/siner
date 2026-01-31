import { useHamming1511 } from "@/hooks/useHamming1511";
import { useSineWavePlayer } from "@/hooks/useSineWavePlayer";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import {
  END_OF_NUMBER_FREQUENCY,
  END_OF_SEQUENCE_FREQUENCY,
  ERROR_DETECTED_FREQUENCY,
  NO_ERROR_FREQUENCY,
  PLAY_INTERVAL,
  START_OF_SEQUENCE_FREQUENCY,
} from "@/utils/config";
import { freqsToNumber, playNumbers } from "@/utils/numberPlayer";
import React, { useEffect, useRef, useState } from "react";
import { Button, LogBox, Text, TextInput, View } from "react-native";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

export default function Index() {
  const { playTone } = useSineWavePlayer();
  const freq = useUltrasonicFrequency();
  const { encode, decode } = useHamming1511();

  const [lastFrequencyChange, setLastFrequencyChange] = useState(Date.now());
  const [lastFrequency, setLastFrequency] = useState(-1);

  const [buffer, setBuffer] = useState<number[]>([]);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [textInput, setTextInput] = useState("");

  let isMidSequence = useRef(false);
  let isError = useRef(true);

  useEffect(() => {
    if (Date.now() - PLAY_INTERVAL * 0.6 > lastFrequencyChange) {
      switch (lastFrequency) {
        case END_OF_SEQUENCE_FREQUENCY:
          playTone(NO_ERROR_FREQUENCY, (PLAY_INTERVAL * 2) / 1000);
          isMidSequence.current = false;
          break;

        case START_OF_SEQUENCE_FREQUENCY:
          console.log("heard start seq, played no error");
          playTone(NO_ERROR_FREQUENCY, (PLAY_INTERVAL * 2) / 1000);
          setNumbers([]);
          isMidSequence.current = true;
          break;

        case END_OF_NUMBER_FREQUENCY:
          const number = freqsToNumber(decode, buffer);
          setBuffer([]);
          if (number === null) {
            console.log("error detected.");
            playTone(ERROR_DETECTED_FREQUENCY, (PLAY_INTERVAL * 2) / 1000);
          } else {
            console.log("all good.");
            playTone(NO_ERROR_FREQUENCY, (PLAY_INTERVAL * 2) / 1000);
            setNumbers((n) => [...n, number]);
          }
          break;

        case NO_ERROR_FREQUENCY:
          console.log("heard no error");
          isError.current = false;
          break;

        case ERROR_DETECTED_FREQUENCY:
          console.log("heard error");
          isError.current = true;
          break;

        default:
          if (isMidSequence.current) setBuffer((b) => [...b, lastFrequency]);
          break;
      }
    }
    setLastFrequencyChange(Date.now());
    setLastFrequency(freq ?? -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq]);

  function sendMessage() {
    playNumbers(
      playTone,
      encode,
      isError,
      textInput.split("").map((c) => c.charCodeAt(0)),
    );
  }

  return (
    <View
      style={{
        flex: 1,
        marginTop: 60,
        justifyContent: "flex-start",
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
          backgroundColor: "#222",
          color: "white",
          borderRadius: 10,
        }}
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
