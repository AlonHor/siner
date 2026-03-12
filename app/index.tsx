import "@/styles/global.css";

import Login from "@/app/components/Login";
import SegmentButton from "@/app/components/SegmentButton";
import StatusDot from "@/app/components/StatusDot";
import TicTacToe, { TicTacToeHandle } from "@/app/games/tictactoe/TicTacToe";
import { useComms } from "@/hooks/useComms";
import {
  CARRIER_BASE_FREQUENCY,
  PLAY_INTERVAL,
  TOP_BASE_FREQUENCY,
} from "@/utils/config";
import {
  addGameHistory,
  Game,
  GameOutcome,
  GameType,
  loadGameHistory,
} from "@/utils/gamesHistory";
import { decode } from "@/utils/numberConversion";
import { getStorage } from "@/utils/storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { LogBox, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Profile from "./components/Profile";

LogBox.ignoreLogs(["Open debugger to view warnings.", "has been deprecated"]);

const DEBUG = false;

export default function Index() {
  const [dataBuffer, setDataBuffer] = useState<number[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [side, setSide] = useState<"x" | "o">("x");
  const [loggedInState, setLoggedInState] = useState<"load" | "yes" | "no">(
    "load",
  );
  const [showProfile, setShowProfile] = useState(false);

  const ticTacToeRef = useRef<TicTacToeHandle>(null);
  const gameRefs: React.RefObject<any | null>[] = [ticTacToeRef];
  const gameHistoryRef = useRef<Game[]>([]);

  // Mount animation
  const mountOpacity = useSharedValue(0);
  const mountY = useSharedValue(24);

  function onMessage(message: string) {
    console.log(`H: message received: '${message}'`);
    gameRefs.forEach((gr) => gr.current?.onMessage(message));
  }

  const onGameFinish = useCallback(
    async (gameType: GameType, outcome: GameOutcome) => {
      await addGameHistory(gameHistoryRef, {
        gameType,
        outcome,
        playedAt: new Date(Date.now()),
      });
    },
    [],
  );

  function onGiveUp() {
    gameRefs.forEach((gr) => gr.current?.onGiveUp());
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
    onMessage,
    onGiveUp,
  });

  useEffect(() => {
    (async () => {
      await loadGameHistory(gameHistoryRef);
    })();
    (async () => {
      const token = await getStorage("token");
      setLoggedInState(token === null ? "no" : "yes");
    })();
  }, []);

  useEffect(() => {
    if (loggedInState === "yes") {
      mountOpacity.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      mountY.value = withSpring(0, { damping: 18, stiffness: 120 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInState]);

  useEffect(() => {
    changeChannel(selectedChannel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel]);

  // Frequency bar
  const freqLeft = useSharedValue(200);

  useEffect(() => {
    const newLeft =
      ((TOP_BASE_FREQUENCY + channelFactor - (isSyncing ? (freq ?? 0) : 0)) /
        (TOP_BASE_FREQUENCY - CARRIER_BASE_FREQUENCY)) *
      100;

    if (!isSyncing || !freq) freqLeft.value = 200;
    else if (freqLeft.value === 200) freqLeft.value = newLeft;
    else freqLeft.value = withTiming(newLeft, { duration: PLAY_INTERVAL });
  }, [channelFactor, freq, isSyncing, freqLeft]);

  const freqBarStyle = useAnimatedStyle(() => ({
    left: `${freqLeft.value}%`,
  }));

  const mountStyle = useAnimatedStyle(() => ({
    opacity: mountOpacity.value,
    transform: [{ translateY: mountY.value }],
  }));

  const statusLabel = isTransmitting
    ? "Sending"
    : isMidSequence
      ? "Receiving"
      : isSyncing
        ? "Awaiting Signal"
        : "In Sync";

  const statusColor = isTransmitting
    ? "#22c55e"
    : isMidSequence
      ? "#eab308"
      : isSyncing
        ? "#6366f1"
        : "#3f3f46";

  // Loading screen
  if (loggedInState === "load") {
    return (
      <View className="flex-1 bg-[#08080f] items-center justify-center">
        <View
          className="w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center mb-4"
          style={{
            shadowColor: "#6366f1",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View className="w-5 h-5 rounded-md bg-white/90" />
        </View>
        <Text className="text-zinc-500 text-sm tracking-widest uppercase">
          Loading
        </Text>
      </View>
    );
  }

  // Login screen
  if (loggedInState === "no") {
    return <Login setLoggedInState={setLoggedInState} />;
  }

  // Main screen
  return (
    <View className="flex-1 bg-[#08080f]">
      <Animated.View style={mountStyle} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-14 pb-10 gap-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight">
                Siner
              </Text>
              <Text className="text-zinc-500 text-xs tracking-widest uppercase mt-0.5">
                Panel
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
                <StatusDot
                  active={isSyncing || isTransmitting || isMidSequence}
                  color={statusColor}
                />
                <Text className="text-zinc-400 text-xs font-medium">
                  {statusLabel}
                </Text>
              </View>
              {/* Profile button */}
              <Pressable
                onPress={() => setShowProfile(true)}
                className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center"
              >
                <Text className="text-zinc-400 text-base">👤</Text>
              </Pressable>
            </View>
          </View>

          {/* Channel selector */}
          <View className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em] mb-3">
              Channel
            </Text>
            <View className="flex-row gap-2">
              {[0, 1, 2, 3, 4].map((ch) => (
                <SegmentButton
                  key={ch}
                  label={String(ch)}
                  active={selectedChannel === ch}
                  onPress={() => setSelectedChannel(ch)}
                />
              ))}
            </View>
          </View>

          {/* Side selector */}
          <View className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em] mb-3">
              Play as
            </Text>
            <View className="flex-row gap-2">
              {(["x", "o"] as const).map((s) => (
                <SegmentButton
                  key={s}
                  label={s.toUpperCase()}
                  active={side === s}
                  onPress={() => setSide(s)}
                />
              ))}
            </View>
          </View>

          {/* Frequency visualizer */}
          <View className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em]">
                Frequency
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1.5">
                  <StatusDot active={isTransmitting} color="#22c55e" />
                  <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    TX
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <StatusDot active={isMidSequence} color="#eab308" />
                  <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    RX
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <StatusDot active={isSyncing} color="#6366f1" />
                  <Text className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    SYNC
                  </Text>
                </View>
              </View>
            </View>

            {/* Bar */}
            <View
              className="h-10 rounded-xl overflow-hidden bg-zinc-800/80"
              style={{ position: "relative" }}
            >
              <Animated.View
                style={[
                  freqBarStyle,
                  {
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    width: 14,
                    borderRadius: 5,
                    backgroundColor: isTransmitting
                      ? "#22c55ecc"
                      : isMidSequence
                        ? "#eab308cc"
                        : "#6366f1cc",
                    shadowColor: isTransmitting
                      ? "#22c55e"
                      : isMidSequence
                        ? "#eab308"
                        : "#6366f1",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 6,
                  },
                ]}
              />
              <Text
                className="absolute right-2.5 top-0 bottom-0 text-zinc-600 text-[10px]"
                style={{ lineHeight: 40 }}
              >
                {(isSyncing ? (freq ?? 0) : 0) / 1000} kHz
              </Text>
            </View>
          </View>

          {/* Debug panel */}
          {DEBUG && (
            <View className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 gap-1">
              <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em] mb-2">
                Debug
              </Text>
              <Text className="text-zinc-500 text-xs font-mono">
                Ch: {selectedChannel} Freq: {freq}
              </Text>
              <Text className="text-zinc-500 text-xs font-mono">
                {'Text: "'}
                {dataBuffer
                  .slice(0, -1)
                  .map((n) => String.fromCharCode(decode(n)))
                  .join("")}
                {'"'}
              </Text>
              <Text className="text-zinc-500 text-xs font-mono">
                Data: [{dataBuffer.join(", ")}]
              </Text>
              <Text className="text-zinc-500 text-xs font-mono">
                Buf:{" "}
                {"{ " + bitBuffer.map((b) => (b % 1000) / 50).join(".") + " }"}
              </Text>
            </View>
          )}

          {/* Game */}
          <View className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em] mb-4">
              Tic Tac Toe
            </Text>
            <TicTacToe
              side={side}
              sendMessage={sendMessage}
              onGameFinish={onGameFinish}
              ref={ticTacToeRef}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Profile overlay */}
      <Profile
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        setLoggedInState={setLoggedInState}
        gameHistoryRef={gameHistoryRef}
      />
    </View>
  );
}
