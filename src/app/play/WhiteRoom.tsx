"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { createGame, type Game, type GameState } from "./game";
import { NAV, ROOM, type ThingId } from "./room";
import { SHEETS } from "./content";
import "./play.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const short = (id: ThingId) => ROOM.find((t) => t.id === id)?.short ?? id;

export default function WhiteRoom() {
  const appRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [state, setState] = useState<GameState>("title");
  const [focus, setFocus] = useState<ThingId | null>(null);
  const [panel, setPanel] = useState<ThingId | null>(null);
  const [noGL, setNoGL] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const app = appRef.current, canvas = canvasRef.current, labels = labelsRef.current;
    const coords = coordsRef.current, stick = stickRef.current;
    if (!app || !canvas || !labels || !coords || !stick) return;
    const game = createGame({ app, canvas, labels, coords, stick, onState: setState, onFocus: setFocus, onOpen: setPanel, onLock: setLocked });
    if (!game) {
      // no WebGL: skip the room, the nav still opens every section
      setNoGL(true);
      setState("play");
      return;
    }
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.setPaused(panel !== null);
    if (panel) closeRef.current?.focus();
  }, [panel]);

  useEffect(() => {
    gameRef.current?.setMuted(muted);
  }, [muted]);

  const close = useCallback(() => {
    setPanel(null);
    canvasRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const go = (id: ThingId) => {
    const game = gameRef.current;
    if (noGL || !game) {
      setPanel(id);
      return;
    }
    setPanel(null);
    game.walkTo(id);
  };

  const sheet = panel ? SHEETS[panel] : null;
  const index = panel ? ROOM.findIndex((t) => t.id === panel) : -1;
  const next = index >= 0 ? ROOM[(index + 1) % ROOM.length] : null;

  return (
    <div
      ref={appRef}
      className={`wr ${geist.variable} ${geistMono.variable}${panel ? " wr-has-sheet" : ""}`}
      data-state={state}
    >
      <canvas
        ref={canvasRef}
        className="wr-cv"
        tabIndex={0}
        aria-label="A white room with a desk, whiteboard, bookshelf, passport, door, monstera, ukulele, wall clock, crushed can and bed"
      />

      <div ref={labelsRef} className="wr-labels" />
      <div className="wr-top">
        <span className="wr-id">
          <Link href="/" className="wr-mono wr-home">
            ← Home
          </Link>
          <b className="wr-hud">Thai An (An) Le</b>
        </span>
        <nav className="wr-nav wr-hud" aria-label="Walk to">
          {NAV.map((n) => (
            <button key={n.id} type="button" onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <span className="wr-readout">
          <span ref={coordsRef} className="wr-mono wr-coords wr-hud">
            X 00.0 · Z 08.0
          </span>
          {!noGL && (
            <button className="wr-tbtn wr-sound" type="button" aria-pressed={!muted} onClick={() => setMuted((m) => !m)}>
              Sound {muted ? "off" : "on"}
            </button>
          )}
        </span>
      </div>

      {/* the line that comes out of the figure, and what it says */}
      <section className="wr-title">
        <div className="wr-says">
          <h1>{"hi, i'm an."}</h1>
          <p className="wr-lede">{"i currently live in San Francisco, working for play anything as a product engineer."}</p>
        </div>
        <button className="wr-start" type="button" onClick={() => gameRef.current?.start()} disabled={state !== "title"}>
          Start <span aria-hidden="true">→</span>
        </button>
      </section>

      <div className="wr-bottom wr-hud">
        {coarse && focus ? (
          <button className="wr-open" type="button" onClick={() => setPanel(focus)}>
            Open <b>{short(focus)}</b>
          </button>
        ) : (
          <p className="wr-mono wr-hint">
            {coarse
              ? "Left thumb moves · Right thumb looks · Tap a name"
              : locked
                ? "Mouse looks · Hold click or W A S D to walk · Click an item · Esc frees the cursor"
                : "Click the room to look around with your mouse"}
          </p>
        )}
      </div>

      <i className="wr-cross" aria-hidden="true" />
      {/* the Open prompt rides on the cursor */}
      {!coarse && focus && !panel && state === "play" && (
        <span className="wr-prompt" aria-live="polite">
          Open <b>{short(focus)}</b> <kbd>click</kbd>
        </span>
      )}

      <div ref={stickRef} className="wr-stick" hidden aria-hidden="true">
        <i />
      </div>

      {sheet && panel && (
        <aside key={panel} className="wr-sheet" role="dialog" aria-labelledby="wr-sheet-title">
          <header>
            <span className="wr-mono">{sheet.kicker}</span>
            <button ref={closeRef} className="wr-tbtn" type="button" onClick={close}>
              Close <kbd>Esc</kbd>
            </button>
          </header>
          <h2 id="wr-sheet-title">{sheet.title}</h2>
          <div className="wr-body">{sheet.body}</div>
          <footer>
            <span className="wr-mono">
              {index + 1} / {ROOM.length}
            </span>
            {next && (
              <button className="wr-tbtn" type="button" onClick={() => go(next.id)}>
                {noGL ? "Next: " : "Walk to "}
                {next.short.toLowerCase()} →
              </button>
            )}
          </footer>
        </aside>
      )}

      {noGL && (
        <p className="wr-nogl">
          {"This browser can't draw the 3D room. The links at the bottom still open every section."}
        </p>
      )}
    </div>
  );
}
