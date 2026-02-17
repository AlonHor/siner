import React from "react";
import { View } from "react-native";

export default function LoadingIcon({ isLoading }: { isLoading: boolean }) {
  return (
    <>
      {isLoading ? (
        <View
          key={"mid"}
          style={{
            top: 25 * 0.75,
            width: 25,
            height: 25,
          }}
          className="animate-spin bg-green-600"
        />
      ) : (
        <View
          key={"nomid"}
          style={{
            top: 25 * 0.75,
            width: 25,
            height: 25,
            borderRadius: 10,
          }}
          className="animate-none bg-gray-400"
        />
      )}
    </>
  );
}
