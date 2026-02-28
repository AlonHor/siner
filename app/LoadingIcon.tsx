import { PLAY_INTERVAL } from "@/utils/config";
import React, { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export default function LoadingIcon({
  isLoading,
  text,
  color,
}: {
  isLoading: boolean;
  text: string;
  color: string;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      translateY.value = withRepeat(
        withTiming(-8, { duration: PLAY_INTERVAL }),
        -1,
        true,
      );
    } else {
      translateY.value = 0;
    }
  }, [isLoading, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          top: 25 * 0.75,
          width: 25,
          height: 25,
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isLoading ? color : "#9ca3af",
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 18, color: isLoading ? "white" : "black" }}>
        {text}
      </Text>
    </Animated.View>
  );
}
