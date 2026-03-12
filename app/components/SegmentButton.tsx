import React from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export default function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.88, { duration: 70 }),
      withSpring(1, { damping: 8 }),
    );
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        className={`w-10 h-10 rounded-xl items-center justify-center ${
          active ? "bg-indigo-600" : "bg-zinc-900 border border-zinc-800"
        }`}
        style={
          active
            ? {
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.45,
                shadowRadius: 8,
                elevation: 6,
              }
            : {}
        }
      >
        <Text
          className={`text-sm font-bold ${active ? "text-white" : "text-zinc-500"}`}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
