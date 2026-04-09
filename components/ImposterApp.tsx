"use client";

import { useCallback, useState } from "react";
import type { CategoryId, Difficulty } from "@/lib/categories";
import { fetchGameRound } from "@/lib/fetch-round";
import type { GameRound } from "@/lib/game";
import { rememberSeenWord } from "@/lib/seen-words";
import { PlayerScreen } from "@/components/PlayerScreen";
import { SetupScreen } from "@/components/SetupScreen";

export function ImposterApp() {
  const [round, setRound] = useState<GameRound | null>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = useCallback(
    async (config: {
      playerCount: number;
      imposterCount: number;
      category: CategoryId;
      difficulty: Difficulty;
    }) => {
      setStartError(null);
      try {
        const next = await fetchGameRound(config);
        rememberSeenWord(next.word);
        setRound(next);
        setPlayerIndex(0);
      } catch (e) {
        setStartError(e instanceof Error ? e.message : "Could not start game");
      }
    },
    [],
  );

  const handleExitToSetup = useCallback(() => {
    setRound(null);
    setPlayerIndex(0);
  }, []);

  const handleNextPlayer = useCallback(() => {
    if (!round) return;
    if (playerIndex + 1 >= round.playerCount) {
      setRound(null);
      setPlayerIndex(0);
      return;
    }
    setPlayerIndex((i) => i + 1);
  }, [round, playerIndex]);

  const handleGoToPreviousPlayer = useCallback(() => {
    setPlayerIndex((i) => Math.max(0, i - 1));
  }, []);

  if (round) {
    return (
      <PlayerScreen
        key={playerIndex}
        playerIndex={playerIndex}
        playerCount={round.playerCount}
        isImposter={round.imposterIndices.includes(playerIndex)}
        word={round.word}
        hint={round.hint}
        onExitToSetup={handleExitToSetup}
        onGoToPreviousPlayer={handleGoToPreviousPlayer}
        onNextPlayer={handleNextPlayer}
      />
    );
  }

  return (
    <SetupScreen
      onStart={handleStart}
      startError={startError}
      onDismissError={() => setStartError(null)}
    />
  );
}
