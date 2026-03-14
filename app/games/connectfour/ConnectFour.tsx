import ConnectFourCell from "@/app/games/connectfour/ConnectFourCell";
import { GameOutcome, GameType } from "@/utils/gamesHistory";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Text, View } from "react-native";

export type ConnectFourHandle = {
  onMessage: (message: string) => void;
  onGiveUp: () => void;
};

const GAME_TYPE: GameType = "ConnectFour";
const ROWS = 6;
const COLS = 7;

type Board = (0 | 1 | 2)[][];

function emptyBoard(): Board {
  return Array.from(
    { length: ROWS },
    () => Array(COLS).fill(0) as (0 | 1 | 2)[],
  );
}

function checkWin(
  board: Board,
): { winner: 1 | 2; cells: [number, number][] } | null {
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal bottom right
    [1, -1], // diagonal bottom left
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const val = board[r][c];
      if (val === 0) continue;
      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (board[nr][nc] !== val) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return { winner: val as 1 | 2, cells };
      }
    }
  }
  return null;
}

function dropInCol(board: Board, col: number, player: 1 | 2): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      const nb = board.map((row) => [...row]) as Board;
      nb[r][col] = player;
      return nb;
    }
  }
  return null; // column full
}

const ConnectFour = forwardRef<
  ConnectFourHandle,
  {
    side: 1 | 2;
    sendMessage: (text: string) => void;
    onGameFinish: (gameType: GameType, outcome: GameOutcome) => void;
  }
>(function ConnectFour({ side, sendMessage, onGameFinish }, ref) {
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [winResult, setWinResult] = useState<{
    winner: 1 | 2;
    cells: [number, number][];
  } | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [lastCol, setLastCol] = useState<number>(0);

  useEffect(() => {
    setBoard(emptyBoard());
    setCurrentTurn(1);
    setWinResult(null);
    setIsDraw(false);
    setStatusMsg("");
  }, [side]);

  useEffect(() => {
    const result = checkWin(board);
    if (result) {
      setWinResult(result);
      if (result.winner === side) {
        setStatusMsg("You won! 🎉");
        onGameFinish(GAME_TYPE, "win");
      } else {
        setStatusMsg("You lost.");
        onGameFinish(GAME_TYPE, "lose");
      }
      return;
    }
    if (board.every((row) => row.every((c) => c !== 0))) {
      setIsDraw(true);
      setStatusMsg("It's a draw.");
      onGameFinish(GAME_TYPE, "draw");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, side]);

  const isMyTurn = currentTurn === side;

  function handleColPress(col: number) {
    if (!isMyTurn || winResult || isDraw) return;
    const newBoard = dropInCol(board, col, side);
    if (!newBoard) return;
    setBoard(newBoard);
    setCurrentTurn(side === 1 ? 2 : 1);
    setLastCol(col);
    sendMessage(`${side}${col}`);
  }

  useImperativeHandle(ref, () => ({
    onMessage(message: string) {
      const player = Number(message[0]) as 1 | 2;
      const col = Number(message[1]);
      if (isNaN(col) || col < 0 || col >= COLS) return;
      setBoard((b) => {
        const nb = dropInCol(b, col, player);
        return nb ?? b;
      });
      setCurrentTurn(player === 1 ? 2 : 1);
    },
    onGiveUp() {
      // Remove last placed piece
      setBoard((b) => {
        for (let r = 0; r < ROWS; r++) {
          if (b[r][lastCol] !== 0) {
            const nb = b.map((row) => [...row]) as Board;
            nb[r][lastCol] = 0;
            return nb;
          }
        }
        return b;
      });
      setCurrentTurn(side);
    },
  }));

  const isWinningCell = (r: number, c: number) =>
    winResult?.cells.some(([wr, wc]) => wr === r && wc === c) ?? false;

  const turnColor = isMyTurn ? "#818cf8" : "#71717a";
  const CELL_SIZE = 44;

  return (
    <View className="items-center gap-3">
      {/* Status */}
      <View className="flex-row items-center gap-2 h-6">
        {statusMsg ? (
          <Text className="text-white text-sm font-semibold">{statusMsg}</Text>
        ) : (
          <>
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: turnColor }}
            />
            <Text className="text-sm" style={{ color: turnColor }}>
              {isMyTurn ? "Your turn" : "Opponent's turn"}
            </Text>
          </>
        )}
      </View>

      {/* Board */}
      <View
        style={{
          backgroundColor: "#0f0f18",
          borderRadius: 14,
          padding: 5,
          gap: 4,
        }}
      >
        {Array.from({ length: ROWS }, (_, r) => (
          <View key={r} style={{ flexDirection: "row", gap: 4 }}>
            {Array.from({ length: COLS }, (_, c) => (
              <View
                key={c}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: "#222225",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <ConnectFourCell
                  value={board[r][c]}
                  col={c}
                  row={r}
                  isWinning={isWinningCell(r, c)}
                  onPress={() => handleColPress(c)}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Player legend */}
      <View className="flex-row gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3 h-3 rounded-full bg-indigo-500" />
          <Text className="text-zinc-500 text-xs">
            {side === 1 ? "You" : "Opponent"}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: "#e879f9" }}
          />
          <Text className="text-zinc-500 text-xs">
            {side === 2 ? "You" : "Opponent"}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default ConnectFour;
