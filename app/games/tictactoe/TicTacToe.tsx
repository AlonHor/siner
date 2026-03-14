import Block from "@/app/games/tictactoe/Block";
import { GameOutcome, GameType } from "@/utils/gamesHistory";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";

export type TicTacToeHandle = {
  onMessage: (message: string) => void;
  onGiveUp: () => void;
};

const GAME_TYPE: GameType = "TicTacToe";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWin(board: ("" | "x" | "o")[]) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

const TicTacToe = forwardRef<
  TicTacToeHandle,
  {
    side: "x" | "o";
    sendMessage: (text: string) => void;
    onGameFinish: (gameType: GameType, outcome: GameOutcome) => void;
  }
>(function TicTacToe({ side, sendMessage, onGameFinish }, ref) {
  const [board, setBoard] = useState<("" | "x" | "o")[]>(Array(9).fill(""));
  const [lastMove, setLastMove] = useState<number>(0);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    setBoard(Array(9).fill(""));
    setWinningLine(null);
    setStatusMsg("");
  }, [side]);

  useEffect(() => {
    const result = checkWin(board);
    if (result) {
      setWinningLine(result.line);
      if (result.winner === side) {
        setStatusMsg("You won! 🎉");
        onGameFinish(GAME_TYPE, "win");
      } else {
        setStatusMsg("You lost.");
        onGameFinish(GAME_TYPE, "lose");
      }
      return;
    }
    if (board.filter((b) => b === "").length === 0) {
      setStatusMsg("It's a draw.");
      onGameFinish(GAME_TYPE, "draw");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, side]);

  const isMyTurn =
    (board.filter((b) => b !== "").length % 2 === 0 ? "x" : "o") === side;

  function onBoxSelect(box: number) {
    if (!isMyTurn || board[box] !== "" || winningLine) return;
    setBoard((b) => {
      if (b[box] !== "") return b;
      const nb = [...b];
      nb[box] = side;
      return nb;
    });
    sendMessage(`${side === "x" ? "a" : "b"}${box}`);
    setLastMove(box);
  }

  useImperativeHandle(ref, () => ({
    onMessage(message: string) {
      const s = message[0];
      const box = Number.parseInt(message[1]);
      if (s !== "a" && s !== "b") return;
      setBoard((b) => {
        if (b[box] !== "") return b;
        const nb = [...b];
        nb[box] = s === "a" ? "x" : "o";
        return nb;
      });
    },
    onGiveUp() {
      setBoard((b) => {
        if (b[lastMove] === "") return b;
        const nb = [...b];
        nb[lastMove] = "";
        return nb;
      });
    },
  }));

  const turnText = winningLine
    ? null
    : isMyTurn
      ? "Your turn"
      : "Opponent's turn";

  const turnColor = isMyTurn ? "#818cf8" : "#71717a";

  return (
    <View className="items-center gap-4">
      {/* Turn / status + reset icon row */}
      <View className="flex-row items-center justify-between w-full px-1">
        <View className="w-7 h-7" />
        <View className="flex-row items-center gap-2 h-6">
          {statusMsg ? (
            <Text className="text-white text-sm font-semibold">
              {statusMsg}
            </Text>
          ) : (
            <>
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: turnColor }}
              />
              <Text className="text-sm" style={{ color: turnColor }}>
                {turnText}
              </Text>
            </>
          )}
        </View>
        {statusMsg ? (
          <Pressable
            onPress={() => {
              setBoard(Array(9).fill(""));
              setWinningLine(null);
              setStatusMsg("");
            }}
            className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 items-center justify-center"
          >
            <Text style={{ fontSize: 14 }}>↺</Text>
          </Pressable>
        ) : (
          <View className="w-7 h-7" />
        )}
      </View>

      {/* Board - 3x3 absolute grid: cell=74px, gap=6px, padding=6px -> total=240 */}
      <View
        style={{
          width: 240,
          height: 240,
          backgroundColor: "#0f0f18",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {board.map((cell, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          const CELL = 74;
          const GAP = 6;
          const PAD = 3;
          return (
            <View
              key={idx}
              style={{
                position: "absolute",
                left: PAD + col * (CELL + GAP),
                top: PAD + row * (CELL + GAP),
                width: CELL,
                height: CELL,
              }}
            >
              <Block
                index={idx}
                value={cell}
                onSelect={() => onBoxSelect(idx)}
                isMyTurn={isMyTurn}
                isWinning={winningLine?.includes(idx) ?? false}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
});

export default TicTacToe;
