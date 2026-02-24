import React from "react";
import { Text, View } from "react-native";

export default function LoadingIcon({
  isLoading,
  text,
}: {
  isLoading: boolean;
  text: string;
}) {
  return (
    <>
      {isLoading ? (
        <View
          style={{
            top: 25 * 0.75,
            width: 25,
            height: 25,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          className="animate-bounce bg-green-600"
        >
          <Text className="text-xl">{text}</Text>
        </View>
      ) : (
        <View
          style={{
            top: 25 * 0.75,
            width: 25,
            height: 25,
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          className="animate-none bg-gray-400"
        >
          <Text className="text-xl">{text}</Text>
        </View>
      )}
    </>
  );
}
