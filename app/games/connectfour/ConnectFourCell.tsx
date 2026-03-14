import React, { useEffect } from "react";
import { Pressable } from "react-native";
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

export default function ConnectFourCell({
  value,
  col,
  row,
  isWinning,
  onPress,
}: {
  value: 0 | 1 | 2; // 0 = empty, 1 = player1, 2 = player2
  col: number;
  row: number;
  isWinning: boolean;
  onPress: () => void;
}) {
  const dropProgress = useSharedValue(0);
  const winGlow = useSharedValue(0);
  const prevValue = React.useRef(value);

  useEffect(() => {
    if (value !== 0 && prevValue.current === 0) {
      // Drop animation: start from top of board
      const distanceRows = row + 1;
      dropProgress.value = 0;
      dropProgress.value = withSpring(1, {
        damping: 10 + distanceRows * 1.5,
        stiffness: 200,
        mass: 0.8,
      });
    } else if (value === 0 && prevValue.current !== 0) {
      dropProgress.value = withTiming(0, { duration: 120 });
    }
    prevValue.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (isWinning) {
      winGlow.value = withDelay(
        (col + row) * 40,
        withSequence(
          withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
          withTiming(0.55, { duration: 350, easing: Easing.inOut(Easing.sin) }),
        ),
      );
    } else {
      winGlow.value = withTiming(0, { duration: 180 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWinning]);

  const diskStyle = useAnimatedStyle(() => {
    const scale = interpolate(dropProgress.value, [0, 1], [0.5, 1]);
    const opacity = dropProgress.value;
    const glowOpacity = interpolate(winGlow.value, [0, 1], [0, 1]);

    const baseColor =
      value === 1
        ? isWinning
          ? `rgba(99,102,241,${interpolate(winGlow.value, [0, 1], [0.85, 1])})`
          : "rgba(99,102,241,0.9)"
        : isWinning
          ? `rgba(232,121,249,${interpolate(winGlow.value, [0, 1], [0.85, 1])})`
          : "rgba(232,121,249,0.9)";

    return {
      opacity,
      transform: [{ scale }],
      backgroundColor: value !== 0 ? baseColor : "transparent",
      shadowOpacity: isWinning ? glowOpacity * 0.9 : value !== 0 ? 0.4 : 0,
    };
  });

  const shadowColor = value === 1 ? "#6366f1" : "#e879f9";

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center"
      style={{ width: "100%", height: "100%" }}
    >
      <Animated.View
        style={[
          diskStyle,
          {
            width: "78%",
            height: "78%",
            borderRadius: 999,
            shadowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      />
    </Pressable>
  );
}
