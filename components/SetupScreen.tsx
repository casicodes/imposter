"use client";

import { Inter } from "next/font/google";
import { useState } from "react";
import type { CategoryId, Difficulty } from "@/lib/categories";

const inter = Inter({ subsets: ["latin"], display: "swap" });

type PlayerChoice = "3" | "4" | "5" | "custom";

type SetupScreenProps = {
  onStart: (config: {
    playerCount: number;
    category: CategoryId;
    difficulty: Difficulty;
  }) => void | Promise<void>;
  startError?: string | null;
  onDismissError?: () => void;
};

const outlineMuted = "[outline:1px_solid_rgba(233,233,233,0.16)]";

function CategoryIcon({
  id,
  selected,
}: {
  id: CategoryId;
  selected: boolean;
}) {
  const stroke = selected ? "#000000" : "#FFFFFF";
  switch (id) {
    case "food":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 4c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v4H6V4z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "movies":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M4 7h16v10H4z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 7v10M16 7v10M4 12h16"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "animals":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <ellipse
            cx="8.5"
            cy="7.5"
            rx="1.8"
            ry="2.2"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <ellipse
            cx="15.5"
            cy="7.5"
            rx="1.8"
            ry="2.2"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M12 11c-3 0-5.5 2-6.5 4.5-.5 1.2.3 2.5 1.6 2.5h9.8c1.3 0 2.1-1.3 1.6-2.5C17.5 13 15 11 12 11z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "places":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M12 21s7-4.6 7-10a7 7 0 10-14 0c0 5.4 7 10 7 10z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="11"
            r="2.2"
            stroke={stroke}
            strokeWidth="1.6"
          />
        </svg>
      );
    case "sports":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="7"
            stroke={stroke}
            strokeWidth="1.6"
          />
          <path
            d="M5.5 12h13M12 5.5c1.8 2.2 1.8 10.8 0 13M12 5.5c-1.8 2.2-1.8 10.8 0 13"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "science":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "everyday":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M21 16V8l-9-5-9 5v8l9 5 9-5z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.3 7.7L12 12l8.7-4.3M12 22V12"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mix":
      return (
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

const CATEGORY_ROWS: { id: CategoryId; label: string }[][] = [
  [
    { id: "food", label: "Food & drink" },
    { id: "movies", label: "Movies & TV" },
  ],
  [
    { id: "animals", label: "Animals" },
    { id: "places", label: "Places" },
  ],
  [
    { id: "sports", label: "Sports" },
    { id: "science", label: "Science" },
  ],
  [
    { id: "everyday", label: "Everyday objects" },
    { id: "mix", label: "Mix of all" },
  ],
];

export function SetupScreen({
  onStart,
  startError,
  onDismissError,
}: SetupScreenProps) {
  const [players, setPlayers] = useState<PlayerChoice>("4");
  const [customCount, setCustomCount] = useState(6);
  const [category, setCategory] = useState<CategoryId>("food");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [starting, setStarting] = useState(false);

  const resolvedPlayerCount =
    players === "custom" ? customCount : Number.parseInt(players, 10);

  const labelMuted = "text-[#6F6F6F] text-sm leading-[18px]";

  return (
    <div
      className={`relative flex min-h-dvh w-full flex-col bg-black px-[15px] pb-[120px] pt-[30px] antialiased ${inter.className}`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold leading-[30px] text-white">
            Find the imposter
          </h1>
        </div>

        <div className="flex flex-col gap-2">
          <p className={`self-stretch ${labelMuted}`}>Select number of players</p>
          <div className="flex gap-2">
            {(["3", "4", "5"] as const).map((n) => {
              const on = players === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPlayers(n)}
                  className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-[10px] text-sm font-medium leading-[18px] ${
                    on
                      ? "bg-white text-black"
                      : `bg-[#1A1A1A] text-white ${outlineMuted}`
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPlayers("custom")}
              className={`flex h-10 flex-1 items-center justify-center rounded-[10px] text-sm font-medium leading-[18px] ${
                players === "custom"
                  ? "bg-white text-black"
                  : `bg-[#1A1A1A] text-white ${outlineMuted}`
              }`}
            >
              Custom
            </button>
          </div>
          {players === "custom" ? (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCustomCount((n) => Math.max(3, n - 1))
                }
                className={`flex h-10 w-12 items-center justify-center rounded-[10px] text-lg font-medium text-white ${outlineMuted} bg-[#1A1A1A]`}
                aria-label="Fewer players"
              >
                −
              </button>
              <span className="min-w-[3ch] text-center text-sm font-medium text-white">
                {customCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCustomCount((n) => Math.min(12, n + 1))
                }
                className={`flex h-10 w-12 items-center justify-center rounded-[10px] text-lg font-medium text-white ${outlineMuted} bg-[#1A1A1A]`}
                aria-label="More players"
              >
                +
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className={`self-stretch ${labelMuted}`}>Categories</p>
          <div className="flex flex-col gap-2">
            {CATEGORY_ROWS.map((row) => (
              <div key={row.map((c) => c.id).join("-")} className="flex gap-2">
                {row.map(({ id, label }) => {
                  const on = category === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCategory(id)}
                      className={`flex min-h-[76px] flex-1 flex-col items-center justify-center gap-[5px] rounded-xl px-1.5 pb-2.5 pt-[9px] ${
                        on
                          ? "bg-white"
                          : `bg-[#1A1A1A] ${outlineMuted}`
                      }`}
                    >
                      <CategoryIcon id={id} selected={on} />
                      <span
                        className={`text-center text-xs font-medium leading-[15px] ${
                          on ? "text-black" : "text-white"
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {startError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
          >
            <div className="flex items-start justify-between gap-2">
              <span>{startError}</span>
              {onDismissError ? (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="shrink-0 text-red-300 underline"
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className={`self-stretch ${labelMuted}`}>Hint difficulty</p>
          <div className="flex gap-1.5">
            {(
              [
                { id: "easy" as const, label: "Easy" },
                { id: "medium" as const, label: "Medium" },
                { id: "hard" as const, label: "Hard" },
              ] as const
            ).map(({ id, label }) => {
              const on = difficulty === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDifficulty(id)}
                  className={`flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-medium leading-[18px] ${
                    on
                      ? "bg-white text-black"
                      : `bg-[#1A1A1A]/[0.93] text-white ${outlineMuted}`
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center bg-[rgba(0,0,0,0.71)] backdrop-blur-[4px]">
        <div className="pointer-events-auto w-full max-w-[390px] px-[15px] py-[15px]">
          <button
            type="button"
            disabled={starting}
            onClick={async () => {
              setStarting(true);
              try {
                await onStart({
                  playerCount: resolvedPlayerCount,
                  category,
                  difficulty,
                });
              } finally {
                setStarting(false);
              }
            }}
            className="flex h-16 w-full items-center justify-center rounded-xl bg-[#1F8E35] text-lg font-bold leading-[22px] text-white [outline:1px_solid_#4BBB5B] disabled:opacity-50"
          >
            {starting ? "Starting…" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}
