"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  COLS,
  ROWS,
  TILE_PX,
  TILE_SRC,
  TOP_H,
  MAIN_H,
  ENTRANCE_W,
} from "./game/constants";
import { Pos, Flags, Item } from "./game/types";
import { buildItemOcc, firstActiveItem } from "./game/utils";
import { buildWalkable, buildWalls } from "./game/masks";
import { ITEMS } from "./game/items";
import { preloadSprites } from "./game/sprites";
import { runDevChecks } from "./game/devChecks";
import GridFloor from "../components/my-room/GridFloor";
import Overlays from "../components/my-room/Overlays";
// import Lights from "../components/my-room/Lights";
import PlayerSprite, { Dir } from "../components/my-room/PlayerSprite";
import { preloadPlayerSprites } from "./game/sprites";
import DialogueBox, { DialogueData } from "../components/my-room/DialogueBox";
import { ITEM_SPRITES } from "./game/sprites";
import { placeholderDataUri } from "./game/utils";
import ProximityAudio from "../components/my-room/ProximityAudio";
import { HOST_SPRITES } from "./game/sprites";
import StartScreen from "../components/my-room/StartScreen";
import HelpOverlay from "../components/my-room/HelpOverlay";
import HelpButton from "../components/my-room/HelpButton";
import BackButton from "../components/my-room/BackButton";
import MobileControls from "../components/my-room/MobileControls";

// helper: tile center in pixels, we anchor sprite bottom-center there

export default function GameRoot() {
  // Precompute masks/layers
  const walkable = useMemo(() => buildWalkable(), []);
  const { walls, occ: wallOcc } = useMemo(() => buildWalls(), []);
  const items = useMemo<Item[]>(() => ITEMS, []);
  const itemOcc = useMemo(() => buildItemOcc(items), [items]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const stepTimeoutRef = useRef<number | null>(null);
  const keydownTimeoutRef = useRef<number | null>(null);
  const shoesTimeoutRef = useRef<number | null>(null);

  //   const [time, setTime] = useState("");
  const [flags, setFlags] = useState<Flags>({
    shoesOff: false,
    shoesChoiceMade: false,
    seenMonstera: false,
    playedUke: false,
    usedBoard: false,
    readPassport: false,
    facedCan: false,
    checkedClock: false,
    shoeWarnLevel: 0,
  });
  const BOARD_W = COLS * TILE_PX;

  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(() => {
    // show every time; or persist once:
    // return localStorage.getItem("room_welcome_dismissed") !== "1";
    return true;
  });
  const [helpOpen, setHelpOpen] = useState(false);

  // (optional) persist once they start
  useEffect(() => {
    if (!welcomeOpen) {
      try {
        localStorage.setItem("room_welcome_dismissed", "1");
      } catch {}
    }
  }, [welcomeOpen]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<DialogueData | null>(null);

  const SCRIPT_BY_ID: Partial<Record<Item["id"], string[]>> = {
    poster: ["my dearest posessions"],
    bookshelf: [
      "I'm currently reading *The Third Door* by Alex Banayan.",
      "He said-life, like a nightclub, has three ways in: the front door, the VIP entrance, and the third door you fight to find yourself.",
      "This encourages me to take more risks",
      "It's funny, it's exciting, and very relatable, I highly recommend",
    ],
    lamp: ["lamp lol"],
    sock: [
      "in a drawer of 20 socks, there are 10 black socks and 10 white socks, whats the maximum number of socks that I need to pick out to get a pair?",
      "the answer is 3! let's say the first 2 socks i picked up are black and white, no matter what the 3rd sock is, black or white, I ended up with a pair",
      "Pigeonhole Principle is my favorite theorem lol",
      "Also, I only buy white socks now, so I don't have to always look for a pair. Why do socks always went missing? Wish there's a theorem for that... ",
    ],
    whiteboard: [
      "When people ask me what I've been working on I show them my whiteboard",
      "It's where I write down everything I need to remember, and it reminds me to focus on things one at a time",
      "When there's a hard problem, I also use the whiteboard to ideate. So If you take a look at my white board, you'd see what's occupying my mind.",
      "Right now? I'm working on this exciting app called Photato, check out my github :-)",
    ],
    ukulele: [
      "I don't want to set the world on fyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "Ok get outtax here",
    ],
    monstera: [
      "When I first got this beautiful monstera back from Costco, I was falling in love with it.",
      "I wanted it to grow so quickly, so I decided my monstera could “use a bit more sun”",
      "By afternoon, the leaves were wearing crisp brown patches, like someone had ironed toast onto them.",
      "I began to see how often I confuse urgency with love. A crisping leaf, a late reply, a wobble in a relationship, my body reads these as alarms. Fix it now, fix it loudly, prove you care with scale.",
      "I’m gentler with feedback now, my own and other people’s. When a leaf yellows or a stem leans, I try to read it like a weather report, not a verdict. Plants aren’t judging us, they’re reporting conditions. That small shift ,listening for information instead of accusation, has saved me from a hundred spirals.",
      "The marks never disappeared. Friends still ask, “What happened there?” and I tell them, and we laugh, and I don’t hide the leaf anymore. There’s freedom in leaving the evidence visible. It reminds me that progress is not the same thing as erasure.",
    ],
    passport: [
      "On Dec 21, 2021, I landed in the US. I got into UC Davis for mathematics.",
      "Starting my own AP Computer Science tutoring course for high school students, I realised that I loved not just learning, but sharing that excitement too.",
      "I switched to Computer Science in my 3rd year, as I loved my coding classes",
      "Hackathon after hackathon, I discovered I didn’t just love theory, I loved to build. My passport carried me here, but building carried me forward.",
    ],
    celsius: [
      "Oh... this demonic drink.",
      "I left it there after my last hackathon; I pulled an all-nighter to finish, then another to take my midterm the next morning.",
      "I barely remember how I stayed awake—adrenaline, bad snacks, maybe just stubbornness.",
      "I can’t run on fumes forever. Hustle feels good in the moment, but my liver is probably cooked.",
      "That’s why I only do it when necessary and lean on consistent effort instead... I’m much happier this way.",
    ],
    clock: [
      "TIME IS RUNNING OUT, DO THAT THING YOU ALWAYS WANTED TO DO AND DIDN'T HAVE THE CHANCE TO!",
    ],
    bed: [
      "Apparently I snore like a *dog* according to my roommate ",
      "I said-Sorry, being legendary is exhausting.",
      "Also that's actual audio of me snoring",
    ],
    mat: ["temu 8 ball mat", "strangely comfortable, great to nap on"],
    desk: [
      "my first CS project was a pixel art game for the AP Computer Science Principles Create Task back in 2019",
      "It was the funnest AP exam I've ever taken, and ultimately, I realized I love building",
      "Everytime I get discoraged, I look back to where this all started and undoubtfully I know I made the right decision in my career choice.",
    ],
  };

  const ENT_ROW = TOP_H + MAIN_H;
  const ENT_LEFT = Math.floor((COLS - ENTRANCE_W) / 2);
  const ENT_RIGHT = ENT_LEFT + ENTRANCE_W - 1;

  const isEntrance = (r: number, c: number) =>
    r === ENT_ROW && c >= ENT_LEFT && c <= ENT_RIGHT;

  const blocksShoesRule = (from: Pos, to: Pos) =>
    !flags.shoesOff && isEntrance(from.r, from.c) && !isEntrance(to.r, to.c);

  // Spawn at the entrance (top-left tile of the 2×1 entrance)
  const start: Pos = useMemo(() => {
    // Same logic you had
    const ENTRANCE_W = 2;
    const TOP_H = 3;
    const MAIN_H = 8;
    const entLeft = Math.floor((COLS - ENTRANCE_W) / 2);
    return { r: TOP_H + MAIN_H, c: entLeft };
  }, []);

  const [pos, setPos] = useState<Pos>(start);

  const focusRef = useRef<HTMLDivElement>(null);
  // tile center -> pixel coords
  const tileCenterPx = (r: number, c: number) => ({
    x: (c + 0.5) * TILE_PX,
    y: (r + 1) * TILE_PX,
  });

  type Anim = {
    from: { r: number; c: number };
    to: { r: number; c: number };
    start: number;
    dur: number;
  };
  const uke = useMemo(() => items.find((i) => i.id === "ukulele")!, [items]);
  const bed = useMemo(() => items.find((i) => i.id === "bed")!, [items]);

  const [dir, setDir] = useState<Dir>("down");
  const [anim, setAnim] = useState<Anim | null>(null);
  const [renderXY, setRenderXY] = useState(() =>
    tileCenterPx(start.r, start.c)
  );
  const [frameIndex, setFrameIndex] = useState<0 | 1>(0); // 0 = *1.png*, 1 = *2.png*
  const queuedDirRef = useRef<Dir | null>(null);
  // pool a few audio elements to prevent play-lag overlaps
  const footPoolRef = useRef<HTMLAudioElement[]>([]);
  const footIdxRef = useRef(0);

  useEffect(() => {
    const make = () => {
      const a = new Audio("/audio/walk.mp3");
      a.preload = "auto";
      a.volume = 0.5; // base volume
      return a;
    };
    footPoolRef.current = [make(), make(), make(), make()];
    return () => {
      footPoolRef.current.forEach((a) => {
        a.pause();
        a.src = "";
      });
      footPoolRef.current = [];
    };
  }, []);

  function playFoot(vol = 0.5) {
    if (!audioUnlocked) return; // reuse your existing unlock flag
    const pool = footPoolRef.current;
    if (!pool.length) return;
    const a = pool[footIdxRef.current++ % pool.length];
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = vol;
      a.play().catch(() => {});
    } catch {}
  }

  useEffect(() => {
    preloadPlayerSprites();
  }, []);

  useEffect(() => {
    let raf: number | null = null;
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const tick = (t: number) => {
      if (!anim) {
        // idle -> show frame 1 (index 0) as requested
        setFrameIndex(0);
        setRenderXY(tileCenterPx(pos.r, pos.c));
        raf = requestAnimationFrame(tick);
        return;
      }

      const { from, to, start, dur } = anim;
      const p = Math.min(1, (t - start) / dur);
      const k = easeOutQuad(p);
      const A = tileCenterPx(from.r, from.c);
      const B = tileCenterPx(to.r, to.c);
      setRenderXY({ x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k });

      // 1 -> 2 -> 1 per step:
      // first half of step = frame 0 (*1.png*), second half = frame 1 (*2.png*)
      setFrameIndex(p < 0.5 ? 0 : 1);

      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // finish: snap to tile center & return to frame 1 (*1.png*)
        setPos(to);
        setFrameIndex(0);
        setAnim(null);

        // chain next step if queued
        const q = queuedDirRef.current;
        queuedDirRef.current = null;
        if (q) startStep(q);
        else raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [anim, pos.r, pos.c]);

  const dirToDelta = (d: Dir) =>
    d === "up"
      ? [-1, 0]
      : d === "down"
      ? [1, 0]
      : d === "left"
      ? [0, -1]
      : [0, 1];

  const canEnter = (r: number, c: number) =>
    r >= 0 &&
    r < ROWS &&
    c >= 0 &&
    c < COLS &&
    walkable[r][c] &&
    !blockedByItem(r, c) &&
    !blockedByWall(r, c);

  const [inputLocked, setInputLocked] = useState(false);
  const overlayOpen = dialogOpen || welcomeOpen || helpOpen;

  // Add safety delay after closing overlays to prevent accidental movement/loops
  useEffect(() => {
    if (!overlayOpen) {
      setInputLocked(true);
      const t = setTimeout(() => setInputLocked(false), 1000);
      return () => clearTimeout(t);
    }
  }, [overlayOpen]);

  function yellShoes() {
    console.log("[GameRoot] yellShoes triggered");
    setFlags((f) => {
      const lvl = Math.min(2, f.shoeWarnLevel ?? 0);
      const lines = [
        "Please take your shoes off. This is an asian household.",
        "TAKE YOUR SHOES OFF. This is an asian household.",
        "TAKE YOUR F***KING (FRICKING) SHOES OFF. THIS IS AN ASIAN HOUSEHOLD.",
      ];
      const portrait = lvl === 0 ? HOST_SPRITES.normal : HOST_SPRITES.furious;

      setDialogData({
        title: "Hi I'm Thai An",
        portraitSrc: portrait,
        lines: [lines[lvl]],
      });
      setDialogOpen(true);

      // Auto-resolve if user persists too much (prevent infinite stuck loop)
      const isMax = lvl >= 2;

      return {
        ...f,
        shoeWarnLevel: Math.min(2, lvl + 1),
        shoesOff: isMax ? true : f.shoesOff,
        shoesChoiceMade: isMax ? true : f.shoesChoiceMade,
      };
    });
  }

  function startStep(d: Dir) {
    if (inputLocked) {
      console.log("[GameRoot] startStep ignored (inputLocked)");
      return;
    }
    setDir(d);
    if (anim) {
      queuedDirRef.current = d;
      return;
    }
    const [dr, dc] = dirToDelta(d);
    const from = pos;
    const to = { r: pos.r + dr, c: pos.c + dc };

    console.log("[GameRoot] startStep", d, "from", from, "to", to);

    const r2 = pos.r + dr,
      c2 = pos.c + dc;

    if (blocksShoesRule(from, to)) {
      console.log("[GameRoot] Blocked by Shoes Rule");
      yellShoes();
      return;
    }

    if (!canEnter(r2, c2)) return;
    // start with frame 1 (*1.png*)
    setFrameIndex(0);
    setAnim({
      from: { ...pos },
      to: { r: r2, c: c2 },
      start: performance.now(),
      dur: 140,
    }); // tweak speed here
    playFoot(0.2);
    if (stepTimeoutRef.current !== null) {
      window.clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    preloadPlayerSprites();
  }, []);

  useEffect(() => {
    focusRef.current?.focus();
  }, []);

  // Preload tile & sprites
  useEffect(() => {
    preloadSprites([TILE_SRC]);
  }, []);

  // Dev checks (safe to disable if you like)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      runDevChecks(walkable, items);
    }
  }, [walkable, items]);

  // flip frames while moving
  useEffect(() => {
    if (!anim) return;
    const id = setInterval(() => setFrameIndex((f) => (f === 0 ? 1 : 0)), 100);
    return () => clearInterval(id);
  }, [anim]);

  // RAF tick (keep your version; example shown)
  useEffect(() => {
    let raf: number | null = null;
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const tick = (t: number) => {
      if (!anim) {
        setRenderXY(tileCenterPx(pos.r, pos.c));
        raf = requestAnimationFrame(tick);
        return;
      }
      const { from, to, start, dur } = anim;
      const p = Math.min(1, (t - start) / dur);
      const k = easeOutQuad(p);
      const A = tileCenterPx(from.r, from.c);
      const B = tileCenterPx(to.r, to.c);
      setRenderXY({ x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k });

      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setPos(to);
        setAnim(null);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [anim, pos.r, pos.c]);
  // Movement (blocks walls AND items)
  const blockedByItem = (r: number, c: number) => !!itemOcc[r]?.[c];
  const blockedByWall = (r: number, c: number) => !!wallOcc[r]?.[c];

  const activeItem = useMemo(() => firstActiveItem(pos, items), [pos, items]);

  // map your scripts here ONCE; keys must exactly match Item["id"]

  function interactWith(target: Item | Item["id"]) {
    // Accept either an Item or an id
    const it: Item | undefined =
      typeof target === "string" ? items.find((x) => x.id === target) : target;

    if (!it) {
      // Developer hint: wrong id/typo
      console.warn("[interactWith] item not found:", target);
      return;
    }

    // Robust sprite: use PNG/GIF if present, else placeholder
    const sprite =
      ITEM_SPRITES[it.id] ?? placeholderDataUri(it.placeholderLabel, TILE_PX);

    // Robust lines: fall back to readable placeholder if missing
    const lines = SCRIPT_BY_ID[it.id] ?? [`${it.name}. (placeholder)`];

    // Open dialogue
    setDialogData({
      title: it.name,
      portraitSrc: sprite,
      lines,
    });
    setDialogOpen(true);
  }

  function handleInteract() {
    if (activeItem) interactWith(activeItem.id);
  }

  function handleShoes() {
    setFlags((f) => {
      if (f.shoesOff) return f;
      setDialogOpen(false); // stop yelling if open
      return { ...f, shoesOff: true, shoesChoiceMade: true };
    });
    if (shoesTimeoutRef.current !== null) {
      window.clearTimeout(shoesTimeoutRef.current);
      shoesTimeoutRef.current = null;
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!audioUnlocked) setAudioUnlocked(true);

    const key = e.key.toLowerCase();
    if (welcomeOpen) {
      // only allow Enter (StartScreen listens globally too)
      if (key === "enter") e.preventDefault();
      return;
    }
    if (helpOpen) {
      // HelpOverlay intercepts Enter/Esc; ignore movement
      if (key === "enter" || key === "escape") e.preventDefault();
      return;
    }

    let handled = true;
    if (key === "arrowup" || key === "w") startStep("up");
    else if (key === "arrowdown" || key === "s") startStep("down");
    else if (key === "arrowleft" || key === "a") startStep("left");
    else if (key === "arrowright" || key === "d") startStep("right");
    else if (key === "r") {
      setPos(start);
      if (keydownTimeoutRef.current !== null) {
        window.clearTimeout(keydownTimeoutRef.current);
        keydownTimeoutRef.current = null;
      }
    } else if (key === "x") {
      handleInteract();
    } else if (key === "j") {
      handleShoes();
    } else handled = false;

    if (handled) e.preventDefault();
  };

  const [winSize, setWinSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const handleResize = () =>
      setWinSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = winSize.w < 768 && winSize.w > 0;
  // Mobile zoom scale (0.85 = slightly zoomed out from 1.0 but zoomed in relative to fitting the whole board)
  const mobileScale = 0.85;

  // Camera logic: calculate translate X/Y to center player on mobile
  const cameraStyle = useMemo(() => {
    if (!isMobile) return {}; // Desktop: use default layout

    // Center player on screen
    // Board coord of player center = renderXY.x, renderXY.y
    // Screen center = winSize.w / 2, winSize.h / 2
    // We want: (renderXY.x * scale) + translateX = winSize.w / 2
    // => translateX = winSize.w / 2 - renderXY.x * scale

    const tx = winSize.w / 2 - renderXY.x * mobileScale;
    const ty = winSize.h / 2 - renderXY.y * mobileScale;

    // Optional: Clamp so we don't see black void past edges?
    // Board dimensions in scaled px
    const boardW = COLS * TILE_PX * mobileScale;
    const boardH = ROWS * TILE_PX * mobileScale;

    // Clamp X
    // Max tx is 0 (left edge aligned)
    // Min tx is winSize.w - boardW (right edge aligned)
    // If board is smaller than screen, center it? (winSize.w - boardW)/2
    let finalTx = tx;
    if (boardW > winSize.w) {
      finalTx = Math.min(0, Math.max(winSize.w - boardW, tx));
    } else {
      finalTx = (winSize.w - boardW) / 2;
    }

    // Clamp Y
    let finalTy = ty;
    if (boardH > winSize.h) {
      finalTy = Math.min(0, Math.max(winSize.h - boardH, ty));
    } else {
      finalTy = (winSize.h - boardH) / 2;
    }

    return {
      transform: `translate3d(${finalTx}px, ${finalTy}px, 0) scale(${mobileScale})`,
      transformOrigin: "0 0",
    };
  }, [isMobile, winSize, renderXY]);

  return (
    <div
      className={`min-h-dvh w-full bg-black flex ${
        isMobile ? "block" : "items-center justify-center"
      } overflow-hidden`}
    >
      <div
        ref={focusRef}
        tabIndex={0}
        role="application"
        aria-label="Grid movement play area"
        onKeyDown={onKeyDown}
        className="outline-none select-none relative"
      >
        {/* One wrapper that sets board size; overlays anchor to this */}
        <div
          className="relative transition-transform duration-75 ease-linear will-change-transform"
          style={{
            width: COLS * TILE_PX,
            height: ROWS * TILE_PX,
            ...cameraStyle,
          }}
        >
          <GridFloor
            rows={ROWS}
            cols={COLS}
            tilePx={TILE_PX}
            tileSrc={TILE_SRC}
            walkable={walkable}
            pos={pos}
            activeItem={activeItem}
          />

          <Overlays
            tilePx={TILE_PX}
            items={items}
            walls={walls}
            pos={pos}
            activeItem={activeItem}
          />

          <PlayerSprite
            x={renderXY.x}
            y={renderXY.y}
            tilePx={TILE_PX}
            dir={dir}
            frameIndex={frameIndex}
          />

          {!isMobile && (
            <DialogueBox
              isOpen={dialogOpen}
              data={dialogData}
              onAdvance={() => setDialogOpen(false)}
              onClose={() => setDialogOpen(false)}
              widthPx={COLS * TILE_PX}
              tilePx={TILE_PX}
            />
          )}

          <div className="fixed inset-0 pointer-events-none z-[60]">
            {/* HUD Layer wrapper to keep fixed elements outside of scaled/translated context if needed, 
                but currently we have MobileControls outside. 
                This just ensures we have a reference context if we need it. 
            */}
          </div>
          {!welcomeOpen && <HelpButton onClick={() => setHelpOpen(true)} />}

          {/* Welcome (centered) */}
          <StartScreen
            isOpen={welcomeOpen}
            widthPx={BOARD_W}
            onStart={() => setWelcomeOpen(false)}
            isMobile={isMobile}
          />

          {/* Help (bottom) */}
          <HelpOverlay
            isOpen={helpOpen}
            widthPx={BOARD_W}
            onClose={() => setHelpOpen(false)}
          />

          <ProximityAudio
            src="/audio/snore.mp3"
            tilePx={TILE_PX}
            item={bed}
            playerXY={renderXY}
            unlocked={audioUnlocked}
            fullRadiusTiles={1}
            maxRadiusTiles={4}
            maxVolume={0.4}
            smooth={0.18}
          />
          <BackButton />
        </div>

        {/* HUD Layer (Screen-relative) */}
        {!dialogOpen && !welcomeOpen && !helpOpen && (
          <MobileControls onMove={startStep} />
        )}

        {isMobile && !dialogOpen && !welcomeOpen && !helpOpen && activeItem && (
          <button
            onClick={handleInteract}
            className="fixed bottom-24 left-6 z-[80] bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold shadow-lg border border-white/30 active:scale-95 transition-all animate-bounce"
          >
            Interact
          </button>
        )}

        {isMobile &&
          !welcomeOpen &&
          !helpOpen &&
          (flags.shoeWarnLevel ?? 0) > 0 &&
          !flags.shoesOff && (
            <button
              onClick={handleShoes}
              className="fixed bottom-40 left-6 z-[100] bg-red-500/30 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold shadow-lg border border-red-200/40 active:scale-95 transition-all animate-pulse"
            >
              Take Shoes Off
            </button>
          )}

        {isMobile && (
          <DialogueBox
            isOpen={dialogOpen}
            data={dialogData}
            onAdvance={() => setDialogOpen(false)}
            onClose={() => setDialogOpen(false)}
            widthPx={COLS * TILE_PX}
            tilePx={TILE_PX}
          />
        )}

        {/* Shoes Warning Pill (REMOVED) */}
      </div>
    </div>
  );
}
