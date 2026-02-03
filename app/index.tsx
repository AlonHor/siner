import { useComms } from "@/hooks/useComms";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import React, { useState } from "react";
import { Button, LogBox, Text, TextInput, View } from "react-native";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

export default function Index() {
  const freq = useUltrasonicFrequency();

  function onBufferChange(buffer: number[]) {
    setBuffer(buffer);
  }

  const [textInput, setTextInput] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [buffer, setBuffer] = useState<number[]>([]);

  const { sendMessage } = useComms({
    onBufferChange,
    onDataChange: setNumbers,
  });

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
      <Button onPress={() => sendMessage(textInput)} title="Send" />
      <Text>
        {"\n"}Live Frequency: {freq}
      </Text>
      <Text>{"\n"}Text:</Text>
      {/* <Text>{numbers.map((n) => String.fromCharCode(n)).join("") + "\n"}</Text> */}
      <Text>{numbers.map((n) => String.fromCharCode(n)) + "\n"}</Text>
      <Text>Numbers:</Text>
      <Text style={{ marginHorizontal: 30 }}>
        {"[" + numbers.toString() + "]\n"}
      </Text>
      <Text>Buffer:</Text>
      <Text>{"[" + buffer.toString() + "]\n"}</Text>
    </View>
  );
}
