"use client";

import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useState, type ReactNode } from "react";
import type { CategoryId, Difficulty } from "@/lib/categories";

const inter = Inter({ subsets: ["latin"], display: "swap" });

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

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

const sectionLabelClass =
  "shrink-0 text-center text-[13px] font-medium leading-[18px] text-[#8A8A8A]";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full">
      <p className={sectionLabelClass}>{children}</p>
    </div>
  );
}

/** Pin control text size (Tailwind `text-sm` / rem can read small on some devices). */
const controlTextStyle = { fontSize: 15, lineHeight: "20px" } as const;

const CATEGORY_IMAGE = {
  food: "/category-food.png",
  animals: "/category-animals.png",
  movies: "/category-movies.png",
  places: "/category-places.png",
  science: "/category-science.png",
  mix: "/category-mix.png",
  everyday: "/category-everyday.png",
  sports: "/category-sports.png",
} as const satisfies Record<CategoryId, string>;

const categoryIconWiggleTransition = { duration: 0.38 } as const;

function CategoryIcon({
  id,
  selected,
  wiggleKey,
}: {
  id: CategoryId;
  selected: boolean;
  wiggleKey: number;
}) {
  const dim = 20;
  const fade = { opacity: selected ? 1 : 0.88 } as const;

  return (
    <motion.img
      key={`${id}-${wiggleKey}`}
      src={CATEGORY_IMAGE[id]}
      alt=""
      width={dim}
      height={dim}
      className="shrink-0 object-contain"
      style={fade}
      aria-hidden
      initial={{ rotate: 0, scale: 1 }}
      animate={
        wiggleKey > 0
          ? {
            rotate: [0, -10, 8, -5, 3, 0],
            scale: [1, 2, 1.8, 1.9, 1.5, 1],
          }
          : { rotate: 0, scale: 1 }
      }
      transition={
        wiggleKey > 0 ? categoryIconWiggleTransition : { duration: 0 }
      }
    />
  );
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
  const [playerCount, setPlayerCount] = useState(4);
  const [category, setCategory] = useState<CategoryId>("food");
  const [categoryWiggle, setCategoryWiggle] = useState<
    Partial<Record<CategoryId, number>>
  >({});
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [starting, setStarting] = useState(false);

  return (
    <div
      className={`relative flex min-h-dvh w-full flex-col bg-transparent px-[15px] pb-[120px] pt-[30px] antialiased ${inter.className}`}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <SectionLabel>Number of players</SectionLabel>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() =>
                setPlayerCount((n) => Math.max(MIN_PLAYERS, n - 1))
              }
              disabled={playerCount <= MIN_PLAYERS}
              className={`flex h-10 w-full min-w-0 flex-1 items-center justify-center rounded-[10px] text-lg font-medium text-white ${outlineMuted} bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Fewer players"
            >
              −
            </button>
            <span
              className="flex h-10 w-full min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white text-center font-medium text-black"
              style={controlTextStyle}
            >
              {playerCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setPlayerCount((n) => Math.min(MAX_PLAYERS, n + 1))
              }
              disabled={playerCount >= MAX_PLAYERS}
              className={`flex h-10 w-full min-w-0 flex-1 items-center justify-center rounded-[10px] text-lg font-medium text-white ${outlineMuted} bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="More players"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Categories</SectionLabel>
          <div className="flex flex-col gap-3">
            {CATEGORY_ROWS.map((row) => (
              <div key={row.map((c) => c.id).join("-")} className="flex gap-3">
                {row.map(({ id, label }) => {
                  const on = category === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setCategory(id);
                        setCategoryWiggle((w) => ({
                          ...w,
                          [id]: (w[id] ?? 0) + 1,
                        }));
                      }}
                      className={`flex min-h-[76px] flex-1 flex-col items-center justify-center gap-[5px] rounded-xl px-1.5 pb-2.5 pt-[9px] ${on
                        ? "bg-white"
                        : `bg-[#1A1A1A] ${outlineMuted}`
                        }`}
                      /* Preflight uses `font: inherit` on buttons; pin size here so labels are truly 14px */
                      style={{ fontSize: 15, lineHeight: "20px" }}
                    >
                      <CategoryIcon
                        id={id}
                        selected={on}
                        wiggleKey={categoryWiggle[id] ?? 0}
                      />
                      <span
                        className={`block max-w-full text-center font-medium ${on ? "text-black" : "text-white"
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
            <div className="flex items-start justify-between gap-3">
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

        <div className="flex flex-col gap-3">
          <SectionLabel>Hint difficulty</SectionLabel>
          <div className="flex gap-3">
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
                  style={controlTextStyle}
                  className={`flex h-10 flex-1 items-center justify-center rounded-xl font-medium ${on
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

      <div className="app-chrome-frost pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center">
        <div className="pointer-events-auto w-full max-w-[390px] px-[15px] py-[15px]">
          <button
            type="button"
            disabled={starting}
            aria-busy={starting}
            onClick={async () => {
              setStarting(true);
              try {
                await onStart({
                  playerCount,
                  category,
                  difficulty,
                });
              } finally {
                setStarting(false);
              }
            }}
            className="flex h-16 w-full items-center justify-center rounded-xl bg-[#1F8E35] text-lg font-bold leading-[22px] text-white [outline:1px_solid_#4BBB5B] disabled:cursor-wait"
          >
            {starting ? "Starting…" : "Start"}
          </button>
        </div>
      </div>
    </div>
  );
}
