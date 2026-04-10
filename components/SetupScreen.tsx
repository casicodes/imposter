"use client";

import { Menu, type Anchor, type Direction } from "bloom-menu";
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

/** Panel around each setup section (players, imposters, categories, difficulty). */
const sectionPanelClass = "rounded-[12px] bg-[#292929] px-4 py-2";

/** − / + counter controls: square footprint, fully rounded (pill/circle). */
const counterStepBtnClass = `text-[16px] flex size-[50px] shrink-0 items-center justify-center rounded-full text-white ${outlineMuted} bg-[#292929] disabled:cursor-not-allowed disabled:opacity-40`;

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_IMPOSTERS = 1;

const sectionLabelClass =
  "shrink-0 text-center text-[14px] font-normal leading-[20px] text-[#8A8A8A]";

const sectionRowLabelClass =
  "min-w-0 flex-1 text-left text-[14px] font-normal leading-[20px] text-[#8A8A8A]";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full">
      <p className={sectionLabelClass}>{children}</p>
    </div>
  );
}

function ChevronsUpDownIcon() {
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
      className="lucide lucide-chevrons-up-down shrink-0 text-neutral-500"
      aria-hidden
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

/** Label and bloom trigger on one row; options render inside the expanded menu. */
function SectionLabelWithBloomOptions({
  label,
  valueLabel,
  menuWidth,
  closedSize,
  direction = "bottom",
  anchor = "end",
  children,
}: {
  label: ReactNode;
  /** Shown on the closed trigger (current value). */
  valueLabel: string;
  menuWidth: number;
  closedSize: { width: number; height: number };
  /** Hint menu opens upward; others default to downward. */
  direction?: Direction;
  anchor?: Anchor;
  children: ReactNode;
}) {
  const aria = `${typeof label === "string" ? label : "Setting"}: ${valueLabel}. Change`;
  return (
    <div className={sectionPanelClass}>
      <div className="flex w-full items-center justify-between gap-2">
        <p className={sectionRowLabelClass}>{label}</p>
        <Menu.Root direction={direction} anchor={anchor}>
          <Menu.Portal>
            <Menu.Overlay className="z-40 bg-transparent" />
          </Menu.Portal>
          <Menu.Container
            buttonSize={closedSize}
            menuWidth={menuWidth}
            menuRadius={14}
            buttonRadius={10}
            className={`shrink-0 bg-[#292929] ${outlineMuted}`}
          >
            <Menu.Trigger
              className="gap-1 px-2 text-[15px] font-medium tabular-nums text-white [-webkit-tap-highlight-color:transparent] hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3AA54B]"
              aria-label={aria}
            >
              <span>{valueLabel}</span>
              <ChevronsUpDownIcon />
            </Menu.Trigger>
            <Menu.Content className="p-2.5">{children}</Menu.Content>
          </Menu.Container>
        </Menu.Root>
      </div>
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

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

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
    <div className="relative flex min-h-dvh w-full flex-col bg-transparent px-[12px] pb-[120px] pt-[30px] antialiased">
      <div className="flex flex-col gap-3">
        <SectionLabelWithBloomOptions
          label="Players"
          valueLabel={String(playerCount)}
          menuWidth={200}
          closedSize={{ width: 80, height: 44 }}
        >
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() =>
                setPlayerCount((n) => Math.max(MIN_PLAYERS, n - 1))
              }
              disabled={playerCount <= MIN_PLAYERS}
              className={counterStepBtnClass}
              aria-label="Fewer players"
            >
              <MinusIcon />
            </button>
            <span
              className="text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white text-center text-[#202020]"
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
              className={counterStepBtnClass}
              aria-label="More players"
            >
              <PlusIcon />
            </button>
          </div>
        </SectionLabelWithBloomOptions>

        <SectionLabelWithBloomOptions
          label="Imposters"
          valueLabel={String(imposterCount)}
          menuWidth={200}
          closedSize={{ width: 80, height: 44 }}
        >
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() =>
                setImposterCount((n) => Math.max(MIN_IMPOSTERS, n - 1))
              }
              disabled={imposterCount <= MIN_IMPOSTERS}
              className={counterStepBtnClass}
              aria-label="Fewer imposters"
            >
              <MinusIcon />
            </button>
            <span
              className="text-[16px] flex h-[50px] w-full min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white text-center text-[#202020]"
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
              className={counterStepBtnClass}
              aria-label="More imposters"
            >
              <PlusIcon />
            </button>
          </div>
        </SectionLabelWithBloomOptions>

        <div className={`flex flex-col gap-3 ${sectionPanelClass}`}>
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
                        : `bg-[#292929] ${outlineMuted}`
                        }`}
                    >
                      <CategoryIcon
                        id={id}
                        selected={on}
                        wiggleKey={categoryWiggle[id] ?? 0}
                      />
                      <span
                        className={`inline-block max-w-full shrink-0 text-center text-[15px] leading-5 ${on ? "text-[#202020]" : "text-white"
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

        <SectionLabelWithBloomOptions
          label="Hint difficulty"
          valueLabel={DIFFICULTY_LABEL[difficulty]}
          menuWidth={200}
          closedSize={{ width: 118, height: 44 }}
          direction="top"
          anchor="end"
        >
          <div className="flex w-full flex-col gap-2">
            {(
              [
                { id: "easy" as const, label: "Easy" },
                { id: "medium" as const, label: "Medium" },
                { id: "hard" as const, label: "Hard" },
              ] as const
            ).map(({ id, label }) => {
              const on = difficulty === id;
              return (
                <Menu.Item
                  key={id}
                  onSelect={() => setDifficulty(id)}
                  className={`flex h-[50px] w-full items-center justify-center rounded-xl ${on
                    ? "bg-white text-[#202020]"
                    : `bg-[#292929] text-white ${outlineMuted}`
                    }`}
                  style={controlTextStyle}
                >
                  {label}
                </Menu.Item>
              );
            })}
          </div>
        </SectionLabelWithBloomOptions>
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
            className="relative box-border flex h-[64px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[20px] [-webkit-tap-highlight-color:transparent] transition-transform active:scale-[0.95] disabled:cursor-wait"
            style={{
              backgroundImage:
                "linear-gradient(in oklab 180deg, #1F8E36, #1F8E36)",
              boxShadow: "#202020 0px 0px 1px 2px",
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
                textShadow: "#2020204F 0px 1px 0px",
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
