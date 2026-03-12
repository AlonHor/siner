import React from "react";
import { Text } from "react-native";

export default function GameTypeLabel({ gameType }: { gameType: string }) {
  const labels: Record<string, string> = {
    tictactoe: "Tic Tac Toe",
  };
  return (
    <Text className="text-white text-sm font-medium">
      {labels[gameType] ?? gameType}
    </Text>
  );
}
