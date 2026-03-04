import { GameOutcome, GameType } from "@/utils/gamesHistory";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  GestureResponderEvent,
  Pressable,
  Text,
  ToastAndroid,
  View,
} from "react-native";

function Block({
  value,
  onSelect,
  isMyTurn,
}: {
  value: "" | "x" | "o";
  onSelect: (event: GestureResponderEvent) => void;
  isMyTurn: boolean;
}) {
  return (
    <Pressable
      className={`w-1/3 h-20 border aspect-square flex justify-center items-center bg-slate-300  ${isMyTurn ? "active:bg-green-300" : "active:bg-red-300"}`}
      onPress={onSelect}
      // disabled={!isMyTurn}
    >
      <Text className="text-3xl text-black">{value.toUpperCase()}</Text>
    </Pressable>
  );
}

export type TicTacToeHandle = {
  onMessage: (message: string) => void;
  onGiveUp: () => void;
};

const GAME_TYPE: GameType = "TicTacToe";

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

  useEffect(() => {
    setBoard(Array(9).fill(""));
  }, [side]);

  useEffect(() => {
    const checkWin = (board: ("" | "x" | "o")[]) => {
      const lines: number[][] = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];

      for (let line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }
      return null;
    };

    const winner = checkWin(board);
    if (!winner) {
      if (board.filter((b) => b === "").length === 0) {
        // if board is full
        ToastAndroid.show("it's a draw!", ToastAndroid.SHORT);
        onGameFinish(GAME_TYPE, "draw");
      }
      return;
    }

    if (winner === side) {
      ToastAndroid.show("you won!", ToastAndroid.SHORT);
      onGameFinish(GAME_TYPE, "win");
    } else {
      ToastAndroid.show("you lost!", ToastAndroid.SHORT);
      onGameFinish(GAME_TYPE, "lose");
    }
  }, [board, side, onGameFinish]);

  function onBoxSelect(box: number) {
    const turn = board.filter((b) => b !== "").length % 2 === 0 ? "x" : "o";
    if (turn !== side) return;

    setBoard((b) => {
      if (b[box] !== "") return b;
      const nb = [...b];
      nb[box] = side;
      return nb;
    });

    const move = `${side === "x" ? "a" : "b"}${box}`;
    sendMessage(move);
    setLastMove(box);
  }

  useImperativeHandle(ref, () => ({
    onMessage(message: string) {
      const side = message[0];
      const box = Number.parseInt(message[1]);

      if (side !== "a" && side !== "b") return;
      setBoard((b) => {
        if (b[box] !== "") return b;
        const nb = [...b];
        nb[box] = side === "a" ? "x" : "o";
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

  return (
    <View className="w-60 h-60 m-4 flex flex-row flex-wrap">
      {board.map((b, idx) => (
        <Block
          key={idx}
          value={b}
          onSelect={() => onBoxSelect(idx)}
          isMyTurn={
            (board.filter((b) => b !== "").length % 2 === 0 ? "x" : "o") ===
            side
          }
        />
      ))}
    </View>
  );
});

export default TicTacToe;
