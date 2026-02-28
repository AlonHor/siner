import "@/styles/global.css";

import { useComms } from "@/hooks/useComms";
import { useUltrasonicFrequency } from "@/hooks/useUltrasonicFrequency";
import { decode } from "@/utils/numberConversion";
import React, { useEffect, useRef, useState } from "react";
import { Button, LogBox, Text, View } from "react-native";
import LoadingIcon from "./LoadingIcon";
import TicTacToe, { TicTacToeHandle } from "./games/TicTacToe";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

export default function Index() {
  const [dataBuffer, setDataBuffer] = useState<number[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [side, setSide] = useState<"x" | "o">("x");

  const boardRef = useRef<TicTacToeHandle>(null);

  function onMessage(message: string) {
    console.log(`H: message received: '${message}'`);
    // ToastAndroid.show(message, ToastAndroid.SHORT);

    boardRef.current?.onMessage(message);
  }

  const {
    sendMessage,
    changeChannel,
    bitBuffer,
    isMidSequence,
    isTransmitting,
  } = useComms({
    onDataBufferChange: setDataBuffer,
    onMessage: onMessage,
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
            backgroundColor: selectedChannel === 0 ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="0" onPress={() => setSelectedChannel(0)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 1 ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="1" onPress={() => setSelectedChannel(1)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 2 ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="2" onPress={() => setSelectedChannel(2)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 3 ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="3" onPress={() => setSelectedChannel(3)} />
        </View>
        <View
          style={{
            backgroundColor: selectedChannel === 4 ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="4" onPress={() => setSelectedChannel(4)} />
        </View>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 5,
        }}
      >
        <View
          style={{
            backgroundColor: side === "x" ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="X" onPress={() => setSide("x")} />
        </View>
        <View
          style={{
            backgroundColor: side === "o" ? "black" : "transparent",
            padding: 5,
          }}
        >
          <Button title="O" onPress={() => setSide("o")} />
        </View>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 5,
        }}
      >
        <LoadingIcon isLoading={isTransmitting} text="T" />
        <LoadingIcon isLoading={isMidSequence} text="R" />
      </View>
      <Text>&nbsp;</Text>
      <Text>
        {"\n"}Ch: {selectedChannel}, Freq: {freq}
      </Text>
      <Text>{"\n"}Text:</Text>
      <Text>
        {'"' +
          dataBuffer
            .slice(0, -1)
            .map((n) => String.fromCharCode(decode(n)))
            .join("") +
          '"\n'}
      </Text>
      <Text>Data:</Text>
      <Text style={{ marginHorizontal: 30 }}>
        {"[" + dataBuffer.join(", ") + "]\n"}
      </Text>
      <Text>Buffer:</Text>
      <Text>
        {"{ " + bitBuffer.map((b) => (b % 1000) / 50).join(".") + " }\n"}
      </Text>
      <TicTacToe side={side} sendMessage={sendMessage} ref={boardRef} />
    </View>
  );
}
