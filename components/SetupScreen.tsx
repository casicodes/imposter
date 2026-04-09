"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import type { CategoryId, Difficulty } from "@/lib/categories";

type SetupScreenProps = {
  onStart: (config: {
    playerCount: number;
    imposterCount: number;
    category: CategoryId;
    difficulty: Difficulty;
  }) => void | Promise<void>;
  startError?: string | null;
  onDismissError?: () => void;
};

const outlineMuted = "[outline:1px_solid_rgba(233,233,233,0.16)]";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_IMPOSTERS = 1;

const sectionLabelClass =
  "shrink-0 text-center text-[14px] font-normal leading-[20px] text-[#8A8A8A]";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full">
      <p className={sectionLabelClass}>{children}</p>
    </div>
  );
}

function MinusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Player count, hint difficulty — match category row type rhythm. */
const controlTextStyle = { fontSize: 16, lineHeight: "20px" } as const;

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
            rotate: [0, -10, 5, 0],
            scale: [1, 1.3, 0.9, 1],
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
    { id: "everyday", label: "Everyday objects" },
    { id: "food", label: "Food & drink" },
  ],
  [
    { id: "movies", label: "Movies & TV" },
    { id: "animals", label: "Animals" },
  ],
  [
    { id: "places", label: "Places" },
    { id: "sports", label: "Sports" },
  ],
  [
    { id: "science", label: "Science" },
    { id: "mix", label: "Mix of all" },
  ],
];

export function SetupScreen({
  onStart,
  startError,
  onDismissError,
}: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(4);
  const [imposterCount, setImposterCount] = useState(1);
  const [category, setCategory] = useState<CategoryId>("everyday");
  const [categoryWiggle, setCategoryWiggle] = useState<
    Partial<Record<CategoryId, number>>
  >({});
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [starting, setStarting] = useState(false);
  const [startDots, setStartDots] = useState("");

  const maxImposters = playerCount - 1;

  useEffect(() => {
    setImposterCount((c) => Math.min(c, maxImposters));
  }, [maxImposters]);

  useEffect(() => {
    if (!starting) {
      setStartDots("");
      return;
    }
    let n = 0;
    const tick = () => {
      n = (n + 1) % 4;
      setStartDots(".".repeat(n));
    };
    tick();
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [starting]);

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-transparent px-[15px] pb-[120px] pt-[30px] antialiased">
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
              className={`text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] text-white ${outlineMuted} bg-[#2d2d30] disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Fewer players"
            >
              <MinusIcon />
            </button>
            <span
              className="text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white text-center text-black"
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
              className={`text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] text-white ${outlineMuted} bg-[#2d2d30] disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="More players"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel>Number of imposters</SectionLabel>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() =>
                setImposterCount((n) => Math.max(MIN_IMPOSTERS, n - 1))
              }
              disabled={imposterCount <= MIN_IMPOSTERS}
              className={`text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] text-white ${outlineMuted} bg-[#2d2d30] disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="Fewer imposters"
            >
              <MinusIcon />
            </button>
            <span
              className="text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white text-center text-black"
              style={controlTextStyle}
            >
              {imposterCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setImposterCount((n) => Math.min(maxImposters, n + 1))
              }
              disabled={imposterCount >= maxImposters}
              className={`text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] text-white ${outlineMuted} bg-[#2d2d30] disabled:cursor-not-allowed disabled:opacity-40`}
              aria-label="More imposters"
            >
              <PlusIcon />
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
                      className={`flex h-[50px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl p-1 ${on
                        ? "bg-white"
                        : `bg-[#2d2d30] ${outlineMuted}`
                        }`}
                    >
                      <CategoryIcon
                        id={id}
                        selected={on}
                        wiggleKey={categoryWiggle[id] ?? 0}
                      />
                      <span
                        className={`inline-block max-w-full shrink-0 text-center text-[16px] leading-5 ${on ? "text-black" : "text-white"
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
                  className={`flex h-[50px] flex-1 items-center justify-center rounded-xl ${on
                    ? "bg-white text-black"
                    : `bg-[#2d2d30] text-white ${outlineMuted}`
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
          {/*
           * From Paper — https://app.paper.design/file/01KMGQQST17JDVAEMYXD22D0MV?node=IL-0
           * Apr 3, 2026
           */}
          <button
            type="button"
            disabled={starting}
            aria-busy={starting}
            onClick={async () => {
              setStarting(true);
              try {
                await onStart({
                  playerCount,
                  imposterCount,
                  category,
                  difficulty,
                });
              } finally {
                setStarting(false);
              }
            }}
            className="relative box-border flex h-[64px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[20px] [-webkit-tap-highlight-color:transparent] disabled:cursor-wait"
            style={{
              backgroundImage:
                "linear-gradient(in oklab 180deg, #1F8E36, #1F8E36)",
              boxShadow: "#000000 0px 0px 1px 2px",
              outline: "1px solid #3AA54B",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 box-border h-[32px] w-full rounded-[10px]"
              style={{
                backgroundImage:
                  "linear-gradient(in oklab 180deg, oklab(63.3% -0.132 0.088) 0%, oklab(60% -0.129 0.086) 100%)",
                filter: "blur(1px)",
              }}
            />
            <span
              className="relative z-[1] flex shrink-0 items-center justify-center"
              style={{
                color: "#FFFFFF",
                display: "inline-flex",
                fontFamily: '"Dangrek", system-ui, sans-serif',
                fontSize: "24px",
                fontSynthesis: "none",
                lineHeight: "22px",
                textShadow: "#0000004F 0px 1px 0px",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
            >
              {starting ? (
                <>
                  Starting
                  <span className="inline-block min-w-[3ch] text-left">
                    {startDots}
                  </span>
                </>
              ) : (
                "Start"
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
