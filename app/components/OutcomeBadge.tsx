import React from "react";
import { Text, View } from "react-native";

export default function OutcomeBadge({ outcome }: { outcome: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    win: { bg: "bg-emerald-950/80", text: "text-emerald-400", label: "Win" },
    lose: { bg: "bg-red-950/80", text: "text-red-400", label: "Loss" },
    draw: { bg: "bg-zinc-800", text: "text-zinc-400", label: "Draw" },
  };
  const c = colors[outcome] ?? colors.draw;
  return (
    <View className={`px-2 py-0.5 rounded-md ${c.bg}`}>
      <Text className={`text-[11px] font-semibold ${c.text}`}>{c.label}</Text>
    </View>
  );
}
