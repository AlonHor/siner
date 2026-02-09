import { useComms } from "@/hooks/useComms";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import React, { useEffect, useState } from "react";
import { Button, LogBox, Text, TextInput, View } from "react-native";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

export default function Index() {
  const [textInput, setTextInput] = useState("");
  const [data, setData] = useState<number[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);

  const { sendMessage, changeChannel, buffer, isMidSequence } = useComms({
    onDataChange: setData,
  });

  useEffect(() => {
    changeChannel(selectedChannel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  const { freq } = useUltrasonicFrequency();

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
        <View
          style={{
            backgroundColor: selectedChannel === 0 ? "black" : "grey",
            padding: 5,
          }}
        >
          <Button title="0" onPress={() => setSelectedChannel(0)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 1 ? "black" : "grey",
            padding: 5,
          }}
        >
          <Button title="1" onPress={() => setSelectedChannel(1)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 2 ? "black" : "grey",
            padding: 5,
          }}
        >
          <Button title="2" onPress={() => setSelectedChannel(2)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 3 ? "black" : "grey",
            padding: 5,
          }}
        >
          <Button title="3" onPress={() => setSelectedChannel(3)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 4 ? "black" : "grey",
            padding: 5,
          }}
        >
          <Button title="4" onPress={() => setSelectedChannel(4)} />
        </View>
      </View>

      <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
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
        <View
          style={{
            top: 25 * 0.75,
            width: 25,
            height: 25,
            borderRadius: 25,
            backgroundColor: isMidSequence ? "green" : "grey",
          }}
        />
      </View>
      <Button onPress={() => sendMessage(textInput)} title="Send" />

      <Text>
        {"\n"}Ch: {selectedChannel}, Freq: {freq}
      </Text>

      <Text>{"\n"}Text:</Text>
      <Text>
        {'"' + data.map((n) => String.fromCharCode(n)).join("") + '"\n'}
      </Text>

      <Text>Data:</Text>
      <Text style={{ marginHorizontal: 30 }}>
        {"[" + data.join(", ") + "]\n"}
      </Text>

      <Text>Buffer:</Text>
      <Text>
        {"{ " +
          buffer
            .map((b) => ((b % 1000) / 50) % 10)
            .reverse()
            .join("") +
          " }\n"}
      </Text>
    </View>
  );
}
