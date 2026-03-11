import React from "react";
import { sendSocket } from "./socket";
import { getStorage, setStorage } from "./storage";

export type GameOutcome = "win" | "draw" | "lose";

export type GameType = "TicTacToe";

export type Game = {
  gameType: GameType;
  outcome: GameOutcome;
  playedAt: Date;
};

export async function loadGameHistory(ref: React.RefObject<Game[]>) {
  let gamesStorage = await getStorage("games");
  if (gamesStorage === null) gamesStorage = "[]";

  await setStorage("games", gamesStorage);
  try {
    ref.current = JSON.parse(gamesStorage);
  } catch {
    ref.current = [];
  }
}

export async function syncLocalGameHistory(ref: React.RefObject<Game[]>) {
  await setStorage("games", JSON.stringify(ref.current));
}

export async function syncNetworkGameHistory(ref: React.RefObject<Game[]>) {
  console.log(
    `sync response: ${await sendSocket("games", JSON.stringify(ref.current))}`,
  );
}

export async function addGameHistory(ref: React.RefObject<Game[]>, game: Game) {
  ref.current.push(game);
  await syncLocalGameHistory(ref);
  await syncNetworkGameHistory(ref);
}
