"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
  }, [isOpen, data]);

  useEffect(() => {
    console.log("[DialogueBox] isOpen:", isOpen);
    if (!isOpen) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  }, [isOpen]);

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
  const portraitSize = isMobile
    ? Math.round(tilePx * 1.8)
    : Math.round(tilePx * 3);
  const visible = text.slice(0, shown); // no useMemo needed
  const indicator = isMobile
    ? shown < total
      ? "Tap to skip"
      : page < data.lines.length - 1
      ? "Tap to continue"
      : "Tap to finish"
    : shown < total
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
      onAdvance();
    }
  };

  return (
    // Backdrop / Click Capture Area
    <div
      className={
        isMobile
          ? "fixed inset-0 z-[90] outline-none cursor-pointer"
          : "absolute inset-0 z-[90] outline-none cursor-pointer"
      }
      onClick={onClickBox}
    >
      {/* Visual Box */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto ${
          isMobile ? "top-20" : "bottom-0"
        }`}
        style={{
          width: widthPx,
          maxWidth: "95vw",
        }}
      >
        <div className="mx-auto mb-2 rounded-xl border border-sky-300/40 bg-neutral-900/80 shadow-xl backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-1.5 bg-sky-700/40 text-sky-100 text-sm font-semibold tracking-wide">
            {data.title}
          </div>
          <div className="flex gap-3 p-3 pb-2 items-start">
            <Image
              src={data.portraitSrc}
              alt="portrait"
              width={portraitSize}
              height={portraitSize}
              className="shrink-0 rounded-md bg-black/20 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
            <div
              className="relative grow text-neutral-100 leading-6"
              style={{ minHeight: portraitSize - 8 }}
            >
              <p
                className={`whitespace-pre-wrap ${
                  isMobile ? "text-sm" : "text-lg"
                } pr-14`}
              >
                {visible}
                {shown < total && <span className="opacity-60">▌</span>}
              </p>
              <div className="absolute right-1 bottom-1 text-xs text-neutral-300/80">
                {indicator} {!isMobile && allowClick && "(or click)"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
