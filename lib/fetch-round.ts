import type { GameConfig, GameRound } from "./game";

export async function fetchGameRound(config: GameConfig): Promise<GameRound> {
  const res = await fetch("/api/round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    let message = "Failed to start round";
    try {
      const err = (await res.json()) as { error?: string };
      if (typeof err.error === "string") message = err.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as GameRound;
}
