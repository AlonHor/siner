import { useComms } from "@/hooks/useComms";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import React, { useState } from "react";
import { Button, LogBox, Text, TextInput, View } from "react-native";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

export default function Index() {
  const freq = useUltrasonicFrequency();

  const [textInput, setTextInput] = useState("");
  const [data, setData] = useState<number[]>([]);
  const [buffer, setBuffer] = useState<number[]>([]);

  const { sendMessage } = useComms({
    onBufferChange: setBuffer,
    onDataChange: setData,
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
      <Text>{data.map((n) => String.fromCharCode(n)) + "\n"}</Text>
      <Text>Data:</Text>
      <Text style={{ marginHorizontal: 30 }}>
        {"[" + data.toString() + "]\n"}
      </Text>
      <Text>Buffer:</Text>
      <Text>{"[" + buffer.toString() + "]\n"}</Text>
    </View>
  );
}
