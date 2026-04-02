"use client";

import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";

/** Must match `transition: transform 1.5s linear` on `.reveal-hold-overlay` in globals.css. */
const HOLD_DURATION_MS = 1500;

const inter = Inter({ subsets: ["latin"], display: "swap" });

const outlineSubtle = "[outline:1px_solid_rgba(233,233,233,0.16)]";

function BackChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

type PlayerScreenProps = {
  playerIndex: number;
  playerCount: number;
  isImposter: boolean;
  word: string;
  hint: string;
  onExitToSetup: () => void;
  /** Player 2+ only: from unrevealed state, go to previous player’s unrevealed screen. */
  onGoToPreviousPlayer: () => void;
  onNextPlayer: () => void;
};

export function PlayerScreen({
  playerIndex,
  playerCount,
  isImposter,
  word,
  hint,
  onExitToSetup,
  onGoToPreviousPlayer,
  onNextPlayer,
}: PlayerScreenProps) {
  const [revealed, setRevealed] = useState(false);
  const [pressingReveal, setPressingReveal] = useState(false);
  /** After reveal, ignore Next until the hold pointer is released (+ buffer) so the same press doesn’t activate Next. */
  const [nextButtonArmed, setNextButtonArmed] = useState(true);
  const holdActiveRef = useRef(false);
  const revealFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearRevealFallback = useCallback(() => {
    if (revealFallbackTimerRef.current !== null) {
      clearTimeout(revealFallbackTimerRef.current);
      revealFallbackTimerRef.current = null;
    }
  }, []);

  const endHold = useCallback(() => {
    holdActiveRef.current = false;
    setPressingReveal(false);
    clearRevealFallback();
  }, [clearRevealFallback]);

  const startHold = useCallback(() => {
    if (revealed) return;
    holdActiveRef.current = true;
    setPressingReveal(true);
    clearRevealFallback();
    /* Fallback if transform transitionend never fires (some mobile browsers). */
    revealFallbackTimerRef.current = setTimeout(() => {
      revealFallbackTimerRef.current = null;
      if (!holdActiveRef.current) return;
      setRevealed(true);
      endHold();
    }, HOLD_DURATION_MS + 250);
  }, [clearRevealFallback, endHold, revealed]);

  const onHoldOverlayTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (!holdActiveRef.current) return;
      setRevealed(true);
      endHold();
    },
    [endHold],
  );

  useEffect(() => {
    if (!revealed) {
      setNextButtonArmed(true);
      return;
    }
    setNextButtonArmed(false);
    let finished = false;
    let postUpTimeout = 0;
    const arm = () => {
      if (finished) return;
      finished = true;
      setNextButtonArmed(true);
    };
    const afterPointerUp = () => {
      window.removeEventListener("pointerup", afterPointerUp, true);
      window.removeEventListener("pointercancel", afterPointerUp, true);
      postUpTimeout = window.setTimeout(arm, 120);
    };
    window.addEventListener("pointerup", afterPointerUp, true);
    window.addEventListener("pointercancel", afterPointerUp, true);
    const fallback = window.setTimeout(arm, 700);
    return () => {
      finished = true;
      window.removeEventListener("pointerup", afterPointerUp, true);
      window.removeEventListener("pointercancel", afterPointerUp, true);
      window.clearTimeout(fallback);
      if (postUpTimeout) window.clearTimeout(postUpTimeout);
    };
  }, [revealed]);

  const displayPlayer = playerIndex + 1;
  const showBackButton = playerIndex > 0;

  return (
    <div
      className={`relative flex min-h-dvh w-full flex-col overflow-hidden bg-black px-[15px] pb-[120px] pt-[30px] antialiased ${inter.className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col items-stretch justify-center gap-6">
        <div className="relative grid w-full justify-items-center">
          <motion.div
            className={`col-start-1 row-start-1 flex w-full max-w-full flex-col gap-2 text-center ${revealed ? "pointer-events-none z-0" : "z-10"
              }`}
            initial={false}
            animate={{ opacity: revealed ? 0 : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            aria-hidden={revealed}
          >
            <h1 className="text-[24px] font-semibold leading-10 tracking-[-0.03em] text-white">
              Player {displayPlayer}
            </h1>
          </motion.div>
          <motion.div
            className={`col-start-1 row-start-1 flex w-full max-w-full flex-col gap-2 text-center ${revealed && isImposter ? "z-10" : "pointer-events-none z-0"
              }`}
            initial={false}
            animate={{
              opacity: revealed && isImposter ? 1 : 0,
              scale: revealed && isImposter ? 1 : 0.5,
            }}
            transition={
              revealed && isImposter
                ? { type: "spring", stiffness: 420, damping: 28, mass: 0.85 }
                : { duration: 0.12, ease: "easeIn" }
            }
            style={{ transformOrigin: "center" }}
            aria-hidden={!revealed || !isImposter}
          >

            <h1 className="text-[24px] font-semibold leading-10 tracking-[-0.03em] text-white">
              😈 You are the imposter
            </h1>
            <p className="leading-5 text-[#6F6F6F]">hint: {hint}</p>
          </motion.div>
          <motion.div
            className={`col-start-1 row-start-1 flex w-full max-w-full flex-col gap-2 text-center ${revealed && !isImposter ? "z-10" : "pointer-events-none z-0"
              }`}
            initial={false}
            animate={{
              opacity: revealed && !isImposter ? 1 : 0,
              scale: revealed && !isImposter ? 1 : 0.5,
            }}
            transition={
              revealed && !isImposter
                ? { type: "spring", stiffness: 420, damping: 28, mass: 0.85 }
                : { duration: 0.12, ease: "easeIn" }
            }
            style={{ transformOrigin: "center" }}
            aria-hidden={!revealed || isImposter}
          >
            <h1 className="capitalize text-[24px] font-semibold leading-10 tracking-[-0.03em] text-white">
              {word}
            </h1>
            <p className="leading-5 text-[#6F6F6F]">hint: {hint}</p>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex justify-center bg-[rgba(0,0,0,0.71)] backdrop-blur-[4px]">
        <div
          className={`pointer-events-auto flex w-full max-w-[390px] items-center px-[15px] py-[15px] ${showBackButton ? "justify-between" : "justify-end"
            }`}
        >
          {showBackButton ? (
            <button
              type="button"
              onClick={() =>
                revealed ? setRevealed(false) : onGoToPreviousPlayer()
              }
              className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-[#181818] ${outlineSubtle}`}
              aria-label={
                revealed ? "Hide role" : "Previous player"
              }
            >
              <BackChevronIcon />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onExitToSetup}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-[#181818] ${outlineSubtle}`}
            aria-label="Restart game — return to home"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center bg-[rgba(0,0,0,0.71)] backdrop-blur-[4px]">
        <div className="pointer-events-auto w-full max-w-[390px] px-[15px] py-[15px]">
          {!revealed ? (
            <button
              type="button"
              className={`reveal-hold-btn flex h-16 w-full items-center justify-center rounded-xl bg-[#181818] text-lg font-bold leading-[22px] text-white ${outlineSubtle} ${pressingReveal ? "reveal-hold-btn--pressing" : ""}`}
              aria-label="Hold to reveal your role"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startHold();
              }}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onLostPointerCapture={endHold}
              onKeyDown={(e) => {
                if (e.key !== " " && e.key !== "Enter") return;
                if (e.repeat) return;
                e.preventDefault();
                startHold();
              }}
              onKeyUp={(e) => {
                if (e.key !== " " && e.key !== "Enter") return;
                endHold();
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div
                className="reveal-hold-overlay"
                aria-hidden
                onTransitionEnd={onHoldOverlayTransitionEnd}
              />
              <span className="reveal-hold-label">Hold to reveal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!nextButtonArmed) return;
                setRevealed(false);
                onNextPlayer();
              }}
              className={`flex h-16 w-full items-center justify-center rounded-xl bg-white text-lg font-bold leading-[22px] text-black ${nextButtonArmed ? "" : "pointer-events-none"}`}
              aria-disabled={!nextButtonArmed}
              aria-label={
                nextButtonArmed
                  ? undefined
                  : "Release, then tap to continue"
              }
            >
              {displayPlayer >= playerCount ? "Done" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
