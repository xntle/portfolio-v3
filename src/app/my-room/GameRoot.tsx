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
import { clamp, buildItemOcc, firstActiveItem } from "./game/utils";
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

// helper: tile center in pixels, we anchor sprite bottom-center there

export default function GameRoot() {
  // Precompute masks/layers
  const walkable = useMemo(() => buildWalkable(), []);
  const { walls, occ: wallOcc } = useMemo(() => buildWalls(), []);
  const items = useMemo<Item[]>(() => ITEMS, []);
  const itemOcc = useMemo(() => buildItemOcc(items), [items]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
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
  const resetToastRef = useRef<number | null>(null); // for "R"
  const introToastRef = useRef<number | null>(null); // for "J"

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
  useEffect(() => {
    return () => {
      if (resetToastRef.current) clearTimeout(resetToastRef.current);
      if (introToastRef.current) clearTimeout(introToastRef.current);
    };
  }, []);

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
      "did you know?: my first CS project was a pixel art game for the AP Computer Science Principles Create Task back in 2019",
      "This started my love of building and inspired me to come to college for computer science!",
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
  //   const [toast, setToast] = useState<string | null>(
  //     "Welcome! Press J to take your shoes off. Move with WASD/Arrows."
  //   );

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

  function yellShoes() {
    setFlags((f) => {
      const lvl = Math.min(2, f.shoeWarnLevel ?? 0);
      const lines = [
        "Please take your shoes off. (PRESS J TO TAKE SHOES OFF)",
        "TAKE YOUR SHOES OFF. (PRESS J TO TAKE SHOES OFF)",
        "TAKE YOUR F***CKING SHOES OFF. (PRESS J TO TAKE SHOES OFF)",
      ];
      const portrait = lvl === 0 ? HOST_SPRITES.normal : HOST_SPRITES.furious;

      setDialogData({
        title: "Hi I'm Thai An",
        portraitSrc: portrait,
        lines: [lines[lvl]],
      });
      setDialogOpen(true);

      return { ...f, shoeWarnLevel: Math.min(2, lvl + 1) };
    });
  }

  function startStep(d: Dir) {
    setDir(d);
    if (anim) {
      queuedDirRef.current = d;
      return;
    }
    const [dr, dc] = dirToDelta(d);
    const from = pos;
    const to = { r: pos.r + dr, c: pos.c + dc };

    const r2 = pos.r + dr,
      c2 = pos.c + dc;

    if (blocksShoesRule(from, to)) {
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
    window.clearTimeout((startStep as any)._half);
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

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const key = e.key.toLowerCase();
    let handled = true;

    if (key === "arrowup" || key === "w") startStep("up");
    else if (key === "arrowdown" || key === "s") startStep("down");
    else if (key === "arrowleft" || key === "a") startStep("left");
    else if (key === "arrowright" || key === "d") startStep("right");
    else if (key === "r") {
      setAnim(null);
      setPos(start);
      if (resetToastRef.current) clearTimeout(resetToastRef.current);
    } else if (key === "x") {
      if (activeItem) {
        // prefer passing the whole item:
        interactWith(activeItem);
        // If your signature expects an id, make interactWith accept Item | Item["id"],
        // or keep this: interactWith(activeItem.id)
      } else handled = false;
    } else if (key === "j") {
      setFlags((f) => {
        if (f.shoesOff) return f;
        setDialogOpen(false); // stop yelling if open
        if (introToastRef.current) clearTimeout(introToastRef.current);
        return { ...f, shoesOff: true, shoesChoiceMade: true };
      });
    } else handled = false;

    if (handled) e.preventDefault();
  };

  return (
    <div className="min-h-dvh w-full bg-neutral-950 flex items-center justify-center">
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
          className="relative"
          style={{ width: COLS * TILE_PX, height: ROWS * TILE_PX }}
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
          <DialogueBox
            isOpen={dialogOpen}
            data={dialogData}
            onAdvance={() => setDialogOpen(false)} // all lines done → close
            onClose={() => setDialogOpen(false)} // ESC/close
            widthPx={COLS * TILE_PX}
            tilePx={TILE_PX}
          />
          {!welcomeOpen && <HelpButton onClick={() => setHelpOpen(true)} />}

          {/* Welcome (centered) */}
          <StartScreen
            isOpen={welcomeOpen}
            widthPx={BOARD_W}
            onStart={() => setWelcomeOpen(false)}
          />

          {/* Help (bottom) */}
          <HelpOverlay
            isOpen={helpOpen}
            widthPx={BOARD_W}
            onClose={() => setHelpOpen(false)}
          />

          <ProximityAudio
            src="/audio/singing.mp3"
            tilePx={TILE_PX}
            item={uke}
            playerXY={renderXY} // the same XY you pass to PlayerSprite
            unlocked={audioUnlocked}
            fullRadiusTiles={1.2} // full volume within ~1.2 tiles
            maxRadiusTiles={5} // silent at ~7 tiles
            maxVolume={0.4} // cap volume
            smooth={0.18} // smoothing factor
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
      </div>
    </div>
  );
}
