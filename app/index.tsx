import "@/styles/global.css";

import { useComms } from "@/hooks/useComms";
import {
  CARRIER_BASE_FREQUENCY,
  PLAY_INTERVAL,
  TOP_BASE_FREQUENCY,
} from "@/utils/config";
import { decode } from "@/utils/numberConversion";
import React, { useEffect, useRef, useState } from "react";
import { Button, LogBox, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import LoadingIcon from "./LoadingIcon";
import TicTacToe, { TicTacToeHandle } from "./games/TicTacToe";

LogBox.ignoreLogs(["Open debugger to view warnings."]);

const DEBUG = false;

export default function Index() {
  const [dataBuffer, setDataBuffer] = useState<number[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [side, setSide] = useState<"x" | "o">("x");

  const ticTacToeRef = useRef<TicTacToeHandle>(null);

  const gameRefs: React.RefObject<any | null>[] = [ticTacToeRef];

  function onMessage(message: string) {
    console.log(`H: message received: '${message}'`);
    // ToastAndroid.show(message, ToastAndroid.SHORT);

    gameRefs.forEach((gr) => {
      gr.current?.onMessage(message);
    });
  }

  function onGiveUp() {
    gameRefs.forEach((gr) => {
      gr.current?.onGiveUp();
    });
  }

  const {
    sendMessage,
    changeChannel,
    bitBuffer,
    isMidSequence,
    isTransmitting,
    isSyncing,
    freq,
    channelFactor,
  } = useComms({
    onDataBufferChange: setDataBuffer,
    onMessage: onMessage,
    onGiveUp: onGiveUp,
  });

  useEffect(() => {
    changeChannel(selectedChannel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  const left = useSharedValue(0);

  useEffect(() => {
    const newLeftValue =
      ((TOP_BASE_FREQUENCY + channelFactor - (isSyncing ? (freq ?? 0) : 0)) /
        (TOP_BASE_FREQUENCY - CARRIER_BASE_FREQUENCY)) *
      100;

    if (!isSyncing || !freq) left.value = 200;
    else if (left.value === 200) left.value = newLeftValue;
    else left.value = withTiming(newLeftValue, { duration: PLAY_INTERVAL });
  }, [channelFactor, freq, isSyncing, left]);

  const animatedStyle = useAnimatedStyle(() => ({
    left: `${left.value}%`,
  }));

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
        <LoadingIcon isLoading={isSyncing} text="S" color="#2563eb" />
      </View>
      <Text>&nbsp;</Text>
      {DEBUG && (
        <>
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
        </>
      )}
      <Text>
        {"\n"}
        {isTransmitting
          ? "Sending..."
          : isMidSequence
            ? "Receiving..."
            : isSyncing
              ? "Awaiting Signal..."
              : "In Sync"}
      </Text>
      <TicTacToe side={side} sendMessage={sendMessage} ref={ticTacToeRef} />
      <View style={{ marginTop: 20, width: "90%" }}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
          Frequency Visualization
        </Text>
        <View
          style={{ height: 50, backgroundColor: "#f0f0f0", borderRadius: 8 }}
        >
          <View
            style={{
              position: "relative",
              height: "100%",
              backgroundColor: "#ccc",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 16,
                  borderRadius: 6,
                  borderColor: "black",
                  borderWidth: 1,
                  backgroundColor: isTransmitting
                    ? "#2563ebaa"
                    : isMidSequence
                      ? "#d44a"
                      : "#777a",
                },
                animatedStyle,
              ]}
            />
            <Text style={{ padding: 10, color: "#999", fontSize: 12 }}>
              {(isSyncing ? (freq ?? 0) : 0) / 1000} kHz{"\n"}
            </Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 5,
            }}
          >
            <LoadingIcon isLoading={isTransmitting} text="T" color="#16a34a" />
            <LoadingIcon isLoading={isMidSequence} text="R" color="#aa4" />
          </View>
        </View>
      </View>
    </View>
  );
}
