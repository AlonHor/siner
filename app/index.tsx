import { useComms } from "@/hooks/useComms";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import React, { useEffect, useState } from "react";
import { Button, LogBox, Text, TextInput, View } from "react-native";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

export default function Index() {
  const [textInput, setTextInput] = useState("");
  const [data, setData] = useState<number[]>([]);
  const [buffer, setBuffer] = useState<number[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number>(1);

  const { sendMessage, channelFactor, changeChannel } = useComms({
    onBufferChange: setBuffer,
    onDataChange: setData,
  });

  useEffect(() => {
    changeChannel(selectedChannel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  const freq = useUltrasonicFrequency({ channelFactor });

  return (
    <View
      style={{
        flex: 1,
        marginTop: 20,
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, marginVertical: 10 }}>
        <Button title="Channel 0" onPress={() => setSelectedChannel(0)} />
        <Button title="Channel 1" onPress={() => setSelectedChannel(1)} />
      </View>

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
        {"\n"}Ch: {selectedChannel}, Freq: {freq}
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
