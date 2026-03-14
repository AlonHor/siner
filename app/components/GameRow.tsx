import GameTypeLabel from "@/app/components/GameTypeLabel";
import OutcomeBadge from "@/app/components/OutcomeBadge";
import { RemoteGame } from "@/app/components/Profile";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function GameRow({
  game,
  index,
  unsynced,
}: {
  game: RemoteGame;
  index: number;
  unsynced?: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-16);

  useEffect(() => {
    opacity.value = withDelay(index * 55, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(
      index * 55,
      withSpring(0, { damping: 18, stiffness: 140 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const date = new Date(game.playedAt);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      style={rowStyle}
      className="flex-row items-center justify-between bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-3"
    >
      <View className="gap-0.5">
        <GameTypeLabel gameType={game.gameType} />
        <Text className="text-zinc-500 text-xs">
          {dateStr} · {timeStr}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {unsynced && (
          <View className="px-1.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/40">
            <Text className="text-amber-500 text-[10px] font-semibold">
              Unsynced
            </Text>
          </View>
        )}
        <OutcomeBadge outcome={game.outcome} />
      </View>
    </Animated.View>
  );
}
