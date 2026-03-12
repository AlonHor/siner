import { Game } from "@/utils/gamesHistory";
import { sendSocket } from "@/utils/socket";
import { getStorage, removeStorage } from "@/utils/storage";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import GameRow from "./GameRow";
import GameSkeletonRow from "./GameSkeletonRow";

export type RemoteGame = {
  gameType: string;
  outcome: string;
  playedAt: string;
  [key: string]: any;
};

export default function Profile({
  visible,
  onClose,
  setLoggedInState,
  gameHistoryRef,
}: {
  visible: boolean;
  onClose: () => void;
  setLoggedInState: React.Dispatch<React.SetStateAction<"load" | "yes" | "no">>;
  gameHistoryRef: React.RefObject<Game[]>;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [games, setGames] = useState<RemoteGame[] | null>(null);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);

  // Slide-up panel animation
  const translateY = useSharedValue(800);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 280 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 160 });
      getStorage("email").then(setEmail);
      setGames(null);
      setGamesError(null);
      setLoadingGames(true);
      sendSocket("games", "GET", undefined)
        .then(async (res) => {
          if (!res) {
            setGamesError("No response from server.");
            return;
          }
          if (res.status === 403) {
            setGamesError("Session expired. Please log in again.");
            setTimeout(() => {
              setLoggedInState("no");
            }, 1200);
            return;
          }
          if (!res.ok) {
            const txt = await res.text().catch(() => null);
            setGamesError(txt?.trim() || "Failed to load games.");
            return;
          }
          const remoteGames: RemoteGame[] = await res.json();

          // Find local games not present in remote (unsynced) and tag them
          const local = gameHistoryRef.current ?? [];
          const remoteKeys = new Set(
            remoteGames.map(
              (g) => `${g.gameType}|${new Date(g.playedAt).getTime()}`,
            ),
          );
          const unsynced: RemoteGame[] = local
            .filter(
              (g) =>
                !remoteKeys.has(
                  `${g.gameType}|${new Date(g.playedAt).getTime()}`,
                ),
            )
            .map((g) => ({
              ...g,
              playedAt: g.playedAt.toISOString(),
              unsynced: true,
            }));

          // Merge and sort newest first
          const merged = [...remoteGames, ...unsynced].sort(
            (a, b) =>
              new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
          );
          setGames(merged);
        })
        .catch(() => setGamesError("Connection failed."))
        .finally(() => setLoadingGames(false));
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(800, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? "auto" : "none",
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleLogout = () => {
    removeStorage("token");
    onClose();
    setTimeout(() => setLoggedInState("no"), 320);
  };

  return (
    <View
      className="absolute inset-0"
      style={{ zIndex: 50 }}
      pointerEvents="box-none"
    >
      {/* Backdrop */}
      <Animated.View
        style={backdropStyle}
        className="absolute inset-0 bg-black/70"
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={panelStyle}
        className="absolute bottom-0 left-0 right-0 bg-[#0d0d18] border-t border-zinc-800/80 rounded-t-3xl"
        // min height via paddingBottom
      >
        {/* Handle */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-zinc-700" />
        </View>

        <ScrollView
          className="px-5"
          contentContainerClassName="pb-12 pt-3 gap-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Header row */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-xl font-bold tracking-tight">
                Profile
              </Text>
              {email && (
                <Text className="text-zinc-500 text-sm mt-0.5">{email}</Text>
              )}
            </View>
            <Pressable
              onPress={handleLogout}
              className="bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-2"
            >
              <Text className="text-red-400 text-sm font-semibold">
                Log out
              </Text>
            </Pressable>
          </View>

          {/* Games section */}
          <View>
            <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-[0.12em] mb-3">
              Game History
            </Text>

            {loadingGames && (
              <View className="gap-2">
                {[0, 1, 2].map((i) => (
                  <GameSkeletonRow key={i} index={i} />
                ))}
              </View>
            )}

            {gamesError && (
              <View className="bg-red-950/80 border border-red-800/50 rounded-xl px-4 py-3">
                <Text className="text-red-400 text-sm">{gamesError}</Text>
              </View>
            )}

            {games && games.length === 0 && (
              <View className="items-center py-8">
                <Text className="text-zinc-600 text-sm">
                  No games played yet.
                </Text>
              </View>
            )}

            {games && games.length > 0 && (
              <View className="gap-2">
                {games.map((g, i) => (
                  <GameRow key={i} game={g} index={i} unsynced={!!g.unsynced} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
