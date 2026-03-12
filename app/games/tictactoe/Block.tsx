import React, { useEffect, useRef } from "react";
import { GestureResponderEvent, Pressable, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function Block({
  value,
  index,
  onSelect,
  isMyTurn,
  isWinning,
}: {
  value: "" | "x" | "o";
  index: number;
  onSelect: (event: GestureResponderEvent) => void;
  isMyTurn: boolean;
  isWinning: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const contentScale = useSharedValue(0.3);
  const winGlow = useSharedValue(0);
  const prevValue = useRef(value);

  // Entrance pop when a value is placed
  useEffect(() => {
    if (value !== "" && prevValue.current === "") {
      opacity.value = withTiming(1, { duration: 120 });
      contentScale.value = withSpring(1, { damping: 6, stiffness: 260 });
    } else if (value === "" && prevValue.current !== "") {
      // reset (give up / board clear)
      opacity.value = withTiming(0, { duration: 150 });
      contentScale.value = withTiming(0.3, { duration: 150 });
    }
    prevValue.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Win highlight pulse
  useEffect(() => {
    if (isWinning) {
      winGlow.value = withDelay(
        index * 60,
        withSequence(
          withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }),
          withTiming(0.6, { duration: 300, easing: Easing.inOut(Easing.sin) }),
        ),
      );
    } else {
      winGlow.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWinning]);

  const cellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(${
      isWinning ? "99,102,241" : "24,24,27"
    },${interpolate(winGlow.value, [0, 1], [1, isWinning ? 0.35 : 1])})`,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const handlePressIn = () => {
    if (!value) scale.value = withTiming(0.88, { duration: 80 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8 });
  };

  const isX = value === "x";

  return (
    <Animated.View
      style={cellStyle}
      className="rounded-xl items-center justify-center"
      // border is handled via the grid gap + container bg
    >
      <Pressable
        className="w-full h-full items-center justify-center"
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {value !== "" && (
          <Animated.Text
            style={[
              contentStyle,
              {
                fontSize: 28,
                fontWeight: "800",
                color: isX ? "#818cf8" : "#e879f9",
                textShadowColor: isX ? "#6366f1" : "#d946ef",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              },
            ]}
          >
            {value.toUpperCase()}
          </Animated.Text>
        )}
        {value === "" && isMyTurn && (
          <View className="w-6 h-6 rounded-full border border-zinc-700/60" />
        )}
      </Pressable>
    </Animated.View>
  );
}
