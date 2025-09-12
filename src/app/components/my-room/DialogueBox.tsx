"use client";
import React, { useEffect, useRef, useState } from "react";

export type DialogueData = {
  title: string;
  portraitSrc: string;
  lines: string[];
};

type Props = {
  isOpen: boolean;
  data: DialogueData | null;
  onAdvance: () => void;
  onClose: () => void;
  widthPx: number;
  tilePx: number;
  cps?: number;
  allowClick?: boolean;
};

export default function DialogueBox({
  isOpen,
  data,
  onAdvance,
  onClose,
  widthPx,
  tilePx,
  cps = 28,
  allowClick = true,
}: Props) {
  // ----- Hooks (unconditional) -----
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  done;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio("/audio/talking.mp3");
      a.loop = true;
      a.preload = "auto";
      a.volume = 0.18;
      audioRef.current = a;
    }
  }, []);

  // derive current text (safe even if data is null)
  const text = data?.lines?.[page] ?? "";
  const total = text.length;

  // reset when opening/changing data
  useEffect(() => {
    if (!isOpen || !data) return;
    setPage(0);
    setShown(0);
    setDone(false);
  }, [isOpen, data]);

  // typewriter
  useEffect(() => {
    if (!isOpen || !data) return;
    if (shown >= total) {
      audioRef.current?.pause();
      return;
    }
    const ms = Math.max(12, 1000 / cps);
    audioRef.current?.play().catch(() => {});
    const id = window.setInterval(
      () => setShown((n) => Math.min(total, n + 1)),
      ms
    );
    return () => window.clearInterval(id);
  }, [isOpen, data, shown, total, cps]);

  // keyboard
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (shown < total) {
          setShown(total);
          audioRef.current?.pause();
        } else if (page < (data?.lines.length ?? 0) - 1) {
          setPage((p) => p + 1);
          setShown(0);
        } else {
          setDone(true);
          onAdvance();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        audioRef.current?.pause();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, data, shown, total, page, onAdvance, onClose]);

  // ----- Early return comes AFTER all hooks -----
  if (!isOpen || !data) return null;

  // ----- Render-only values -----
  const portraitSize = Math.round(tilePx * 3);
  const visible = text.slice(0, shown); // no useMemo needed
  const indicator =
    shown < total
      ? "Press Enter to skip"
      : page < data.lines.length - 1
      ? "Press Enter to continue"
      : "Press Enter to finish";

  const onClickBox = () => {
    if (!allowClick) return;
    if (shown < total) setShown(total);
    else if (page < data.lines.length - 1) {
      setPage((p) => p + 1);
      setShown(0);
    } else {
      setDone(true);
      onAdvance();
    }
  };

  return (
    <div
      className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-auto"
      style={{ width: widthPx, zIndex: 90 }}
      onClick={onClickBox}
    >
      <div className="mx-auto mb-2 rounded-xl border border-sky-300/40 bg-neutral-900/80 shadow-xl backdrop-blur-sm overflow-hidden">
        <div className="px-3 py-1.5 bg-sky-700/40 text-sky-100 text-sm font-semibold tracking-wide">
          {data.title}
        </div>
        <div className="flex gap-3 p-3 pb-2 items-start">
          <img
            src={data.portraitSrc}
            alt="portrait"
            style={{
              width: portraitSize,
              height: portraitSize,
              imageRendering: "pixelated",
            }}
            className="shrink-0 rounded-md bg-black/20 object-contain"
          />
          <div
            className="relative grow text-neutral-100 leading-6"
            style={{ minHeight: portraitSize - 8 }}
          >
            <p className="whitespace-pre-wrap text-[15px] pr-14">
              {visible}
              {shown < total && <span className="opacity-60">▌</span>}
            </p>
            <div className="absolute right-1 bottom-1 text-xs text-neutral-300/80">
              {indicator} {allowClick && "(or click)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
