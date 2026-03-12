import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

export default function GameSkeletonRow({ index }: { index: number }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withDelay(
      index * 80,
      withTiming(1, { duration: 700 }, () => {
        shimmer.value = withTiming(0, { duration: 700 }, () => {
          shimmer.value = withDelay(
            index * 80,
            withTiming(1, { duration: 700 }),
          );
        });
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={shimmerStyle}
      className="flex-row items-center justify-between bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-3"
    >
      <View className="gap-1.5">
        <View className="w-24 h-3 rounded-md bg-zinc-700" />
        <View className="w-32 h-2.5 rounded-md bg-zinc-800" />
      </View>
      <View className="w-10 h-5 rounded-md bg-zinc-700" />
    </Animated.View>
  );
}
