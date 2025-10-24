"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

const PROMPT_TEXT = `
You are a meticulous visual prompt engineer. Analyze the attached image and produce ONE final, model-ready prompt that can be pasted into Midjourney / SDXL / DALL·E. Describe only what is clearly visible; avoid guessing. Put the most critical descriptors first.

Follow this order (omit any section you cannot verify from the image):
Subject & Action → Environment/Setting → Materials & Textures → Composition & Framing → Lighting → Style/Medium → Color Palette & Mood → Camera & Lens → Finishing/Grade → Negative Prompts → Parameters.

Rules:
- Be specific and concise, using concrete nouns and visual particulars.
- State composition (angle, shot type, distance, layout rules).
- State lighting (source, quality, direction, color, mood).
- Include camera/lens only if the look implies it (e.g., “50mm, f/2.8, shallow DOF”).
- End with negatives and a minimal parameter line.
- Output as ONE compact paragraph (no headers, no lists).

Always append these negatives (trim if inappropriate):
--no text, watermark, signature, logos, distorted anatomy, extra fingers, lowres, oversharpening, banding, artifacts

Parameter hints (adjust to match the image):
- Aspect Ratio: derive from image; else --ar 16:9 (landscapes), --ar 4:5 or 1:1 (portraits)
- Stylization: lower = photoreal, higher = stylized (e.g., --s 120)
- Quality: --q 2 for finals when supported
- Chaos/Variation: raise only if exploration is desired (e.g., --c 8)
- Seed: include only if provided

FINAL OUTPUT EXAMPLE FORMAT (yours must be a single paragraph like this):
“A cinematic editorial portrait of an elderly botanist examining a fern frond in a misty greenhouse at blue hour, soft diffused skylight with gentle volumetric rays through glass panes, weathered wood benches and dewy leaves with beaded moisture, three-quarter medium shot at eye level with leading lines, photorealistic with subtle 35mm grain and pastel greens, complementary amber highlights, 50mm lens at f/2.8 with delicate bokeh, slight bloom and warm split-tone grade — --no text, watermark, signature, logos, distorted anatomy, lowres, artifacts — --ar 4:5 --s 120 --q 2 --c 8”
`;

function CopyPromptButton() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy prompt to clipboard"
      title="Copy prompt"
      className="rounded-md border border-white/30 bg-white/15 px-3 py-2 text-sm text-white hover:bg-white/25"
    >
      {copied ? "Copied!" : "Copy prompt"}
    </button>
  );
}

// Types
interface Item {
  id: string;
  name: string | null;
  title: string;
  prompt: string | null;
  image_url: string;
  link: string | null; // NEW
  x: number; // unused in this layout
  y: number; // unused in this layout
}
type Ph = Item & { ar?: number }; // aspect ratio w/h

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnon);

// Helpers
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function getAspectRatio(src: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
    img.onerror = () => resolve(1); // fallback to square
    img.src = src;
  });
}
// add scheme if missing; return null if bad url
function normalizeUrl(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  try {
    const hasProto = /^https?:\/\//i.test(s);
    const u = new URL(hasProto ? s : `https://${s}`);
    return u.toString();
  } catch {
    return null;
  }
}

// upsert + dedupe helpers
function upsertById<T extends { id: string }>(arr: T[], item: T) {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [...arr, item];
  const next = arr.slice();
  next[i] = { ...arr[i], ...item };
  return next;
}

// ——— Justified layout hook ———
// Packs items into 2–4 rows (auto), each row scaled to fill viewport width
function useJustifiedLayout(items: Ph[], gapPx = 16) {
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const set = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  // pick a sensible number of rows based on count; clamp 2..4
  const rowsCount = useMemo(() => {
    if (items.length <= 6) return 2;
    if (items.length >= 20) return 4;
    return 3;
  }, [items.length]);

  return useMemo(() => {
    if (!vw || !vh || items.length === 0) return { rows: [], rowH: 0 };

    const padX = 32; // side padding
    const padY = 32; // top/bottom padding
    const totalGapY = gapPx * (rowsCount - 1);
    const availH = Math.max(1, vh - padY * 2 - totalGapY);
    const rowH = Math.floor(availH / rowsCount);

    // Greedy balance: place next image into the row with least current width
    const rows: { item: Ph; w: number; h: number }[][] = Array.from(
      { length: rowsCount },
      () => []
    );
    const rowWidths = new Array(rowsCount).fill(0);

    items.forEach((it) => {
      const ar = it.ar || 1;
      const w = Math.max(1, Math.round(rowH * ar));
      const idx = rowWidths.indexOf(Math.min(...rowWidths));
      rows[idx].push({ item: it, w, h: rowH });
      rowWidths[idx] += w + gapPx;
    });

    // Scale each row so it exactly fills viewport width with even gaps
    for (let r = 0; r < rows.length; r++) {
      if (rows[r].length === 0) continue;
      const totalGaps = gapPx * (rows[r].length - 1);
      const natural = rows[r].reduce((s, x) => s + x.w, 0);
      const scale = (vw - padX * 2 - totalGaps) / Math.max(1, natural);
      rows[r] = rows[r].map((x) => ({
        ...x,
        w: Math.max(1, Math.floor(x.w * scale)),
        h: Math.max(1, Math.floor(x.h * scale)),
      }));
    }

    return { rows, rowH };
  }, [items, vw, vh, rowsCount, gapPx]);
}

export default function GalleryBoard() {
  const [items, setItems] = useState<Ph[]>([]);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [website, setWebsite] = useState(""); // NEW
  const [file, setFile] = useState<File | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // add near other state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1); // default 100%

  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // track IDs we've rendered to avoid duplicate rows from Realtime
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const disablePinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };

    const disableGestureZoom = (e: Event) => {
      e.preventDefault(); // Prevent Safari zoom gesture
    };

    document.addEventListener("touchstart", disablePinchZoom, {
      passive: false,
    });
    document.addEventListener("touchmove", disablePinchZoom, {
      passive: false,
    });
    document.addEventListener("gesturestart", disableGestureZoom, {
      passive: false,
    });
    document.addEventListener("gesturechange", disableGestureZoom, {
      passive: false,
    });
    document.addEventListener("gestureend", disableGestureZoom, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchstart", disablePinchZoom);
      document.removeEventListener("touchmove", disablePinchZoom);
      document.removeEventListener("gesturestart", disableGestureZoom);
      document.removeEventListener("gesturechange", disableGestureZoom);
      document.removeEventListener("gestureend", disableGestureZoom);
    };
  }, []);

  // spacebar toggles pan mode (Figma-style)
  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || t.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (isTypingTarget(e.target)) return; // allow spaces in inputs
        e.preventDefault();
        setSpaceDown(true);
        document.body.style.cursor = isPanning ? "grabbing" : "grab";
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceDown(false);
        if (!isPanning) document.body.style.cursor = "";
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isPanning]);

  // Fullscreen form open/closed
  const [formOpen, setFormOpen] = useState(true);
  // start pan when space is held OR middle mouse button
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!(spaceDown || e.button === 1)) return; // not in pan mode
    e.currentTarget.setPointerCapture(e.pointerId);
    panStartRef.current = { x: e.clientX, y: e.clientY };
    originRef.current = { ...pan };
    setIsPanning(true);
    document.body.style.cursor = "grabbing";
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({ x: originRef.current.x + dx, y: originRef.current.y + dy });
  };

  const onPointerUp = () => {
    if (!isPanning) return;
    setIsPanning(false);
    panStartRef.current = null;
    if (spaceDown) {
      document.body.style.cursor = "grab";
    } else {
      document.body.style.cursor = "";
    }
  };

  // trackpad/mouse wheel pans the board (no page scroll)
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Zoom if Ctrl/Cmd is held (trackpad pinch or browser zoom gesture)
    if (activeItem) return;
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom((z) => {
        let next = z - e.deltaY * 0.005; // sensitivity
        next = Math.min(Math.max(next, 0.25), 4); // clamp between 25% and 400%
        return next;
      });
    } else {
      // Otherwise, pan normally
      e.preventDefault();
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  // Disable body scroll (stationary screen)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Load items from Supabase on mount (measure AR once)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, name, title, prompt, image_url, link, x, y, created_at") // link included
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Load error", error);
        return;
      }
      const typed = (data || []) as Item[];
      const withAR = await Promise.all(
        typed.map(async (it) => ({
          ...it,
          ar: await getAspectRatio(it.image_url),
        }))
      );
      setItems(withAR);
      // seed the seen set so Realtime doesn't double-add initial rows
      seenIdsRef.current = new Set(withAR.map((i) => i.id));
    })();
  }, []);

  // Realtime updates (deduped + upsert)
  useEffect(() => {
    const channel = supabase
      .channel("photos-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "photos" },
        async (payload) => {
          const row = payload.new as Item;
          if (seenIdsRef.current.has(row.id)) return; // already present
          const ar = await getAspectRatio(row.image_url);
          setItems((prev) => {
            const next = upsertById(prev, { ...row, ar });
            seenIdsRef.current.add(row.id);
            return next;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "photos" },
        async (payload) => {
          const row = payload.new as Item;
          const ar = await getAspectRatio(row.image_url);
          setItems((prev) => {
            const next = upsertById(prev, { ...row, ar });
            seenIdsRef.current.add(row.id);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Create a new card (upload + insert) — rely on Realtime to add it
  const onAdd = async () => {
    if (!file || !title.trim()) return;
    try {
      setIsAdding(true);
      // 1) Upload to Storage
      const ext = file.name.split(".").pop() || "jpg";
      const id = uid();
      const path = `${id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      // 2) Get public URL
      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(path);
      const image_url = urlData?.publicUrl;
      if (!image_url) throw new Error("No public URL returned");

      // 3) Normalize website
      const link = normalizeUrl(website) || null;

      // 4) Insert DB row (Realtime INSERT will update UI)
      const { error: insertErr } = await supabase.from("photos").insert({
        name: name.trim() || null,
        title: title.trim(),
        prompt: prompt.trim() || null,
        image_url,
        link, // NEW
        x: 0,
        y: 0,
      });
      if (insertErr) throw insertErr;

      // reset + minimize form (don't setItems here to avoid duplicates)
      setFile(null);
      setTitle("");
      setPrompt("");
      setWebsite(""); // reset website
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Upload failed: ${String((err as Error)?.message || err)}`);
    } finally {
      setIsAdding(false);
    }
  };

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeId) || null,
    [activeId, items]
  );

  // Layout (fills viewport; no scroll)
  const { rows } = useJustifiedLayout(items, 16); // 16px = gap-4

  return (
    <div
      ref={rootRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      // keep the screen stationary; show grab/grabbing cursor when panning
      className={`relative h-screen w-screen overflow-hidden bg-neutral-100 text-[#040232] ${
        spaceDown ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""
      }`}
    >
      {/* Floating circle FAB to reopen the form */}
      <Fab
        open={formOpen}
        count={items.length}
        onClick={() => setFormOpen(true)}
      />

      {/* Bottom-right credit */}
      <a
        href="https://thaianle.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/70 px-3 py-1 text-xs text-white backdrop-blur-md transition hover:bg-black/90"
      >
        Made with 🩶 by Thai An Le :-)
      </a>

      {/* Fullscreen frosted form */}
      <AnimatePresence>
        {formOpen && (
          <FullscreenForm
            isAdding={isAdding}
            name={name}
            title={title}
            prompt={prompt}
            website={website} // NEW
            file={file}
            setName={setName}
            setTitle={setTitle}
            setPrompt={setPrompt}
            setWebsite={setWebsite} // NEW
            setFile={setFile}
            onAdd={onAdd}
            onClose={() => setFormOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Justified Gallery Area */}
      <div
        className="absolute inset-0 px-4 pt-6 pb-4 origin-top-left"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          willChange: "transform",
        }}
      >
        <div className="flex h-full w-full flex-col gap-4">
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="flex w-full justify-center gap-4">
              {row.map(({ item, w, h }, iIdx) => (
                <CardFixed
                  key={item.id}
                  item={item}
                  width={w}
                  height={h}
                  onOpen={() => setActiveId(item.id)}
                  index={iIdx}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal for details (scrollable page) */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveId(null)}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
          >
            <motion.div
              className="absolute inset-0 z-50 overflow-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto max-w-3xl p-5">
                <button
                  className="mb-4 rounded-full border bg-white/80 px-3 py-1 text-sm shadow-sm hover:bg-white"
                  onClick={() => setActiveId(null)}
                >
                  Close
                </button>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeItem.image_url}
                  alt={activeItem.title}
                  className="block w-full h-auto rounded-xl align-top"
                />
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {activeItem.title}
                </h3>
                {(activeItem.name || activeItem.link) && (
                  <div className="text-sm text-white/90">
                    generated by{" "}
                    {activeItem.link ? (
                      <a
                        href={activeItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80"
                      >
                        {activeItem.name || activeItem.link}
                      </a>
                    ) : (
                      activeItem.name
                    )}
                  </div>
                )}
                {activeItem.prompt && (
                  <p className="mt-2 text-sm leading-relaxed text-white/90">
                    {activeItem.prompt}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Fixed-size card (uses computed width/height; keeps image intact)
function CardFixed({
  item,
  width,
  height,
  onOpen,
  index,
}: {
  item: Ph;
  width: number;
  height: number;
  onOpen: () => void;
  index: number;
}) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-3xl shadow-lg"
      style={{ width, height }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.4) }}
    >
      {/* keep aspect via object-contain; no cropping */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.title}
        className="block h-full w-full object-contain align-top"
        draggable={false}
      />

      {/* Hover overlay: black blur + white text (now works) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-end
                   opacity-0 bg-black/0 backdrop-blur-0
                   transition-[opacity,background-color,backdrop-filter] duration-300
                   group-hover:opacity-100 group-hover:bg-black/50 group-hover:backdrop-blur-sm"
      >
        <div className="w-full p-4 text-white">
          <div className="text-md font-medium leading-tight">{item.title}</div>
          {(item.name || item.link) && (
            <div className="text-xs opacity-80">
              generated by{" "}
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {item.name || item.link}
                </a>
              ) : (
                item.name
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click target */}
      <button
        onClick={onOpen}
        className="absolute inset-0"
        aria-label={`Open ${item.title}`}
      />
    </motion.div>
  );
}

/* ---------- UI bits: FAB + Fullscreen frosted form ---------- */

function Fab({
  open,
  count,
  onClick,
}: {
  open: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      data-ui
      onClick={onClick}
      className={`fixed right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition bg-black/40 backdrop-blur-md
        ${
          open
            ? "scale-0 opacity-0 pointer-events-none"
            : "bg-[#040232] text-white hover:-translate-y-0.5"
        }
      `}
      aria-label="Open upload form"
      title="Add photo"
    >
      {/* plus icon */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {/* tiny count badge */}
      <span className="pointer-events-none absolute -bottom-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-medium text-[#040232] shadow">
        {count}
      </span>
    </button>
  );
}

function FullscreenForm({
  isAdding,
  name,
  title,
  file,
  prompt,
  website, // NEW
  setName,
  setTitle,
  setPrompt,
  setWebsite, // NEW
  setFile,
  onAdd,
  onClose,
}: {
  isAdding: boolean;
  name: string;
  title: string;
  file: File | null;
  prompt: string;
  website: string; // NEW
  setName: (v: string) => void;
  setTitle: (v: string) => void;
  setPrompt: (v: string) => void;
  setWebsite: (v: string) => void; // NEW
  setFile: (f: File | null) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      data-ui
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close (X) top-right */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Form card */}
      {/* Wrapper so we can place the Add button outside the card */}
      <div className="relative w-full flex items-center justify-center">
        <motion.div
          className="w-[min(720px,92vw)] rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
          initial={{ y: 20, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 10, scale: 0.99, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
        >
          <h2 className="mb-4 text-center text-xl font-semibold text-white">
            Add to Gallery
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              className="rounded-xl border border-white/20 bg-white/20 px-3 py-2 text-white placeholder-white/70 outline-none backdrop-blur focus:ring-2 focus:ring-[#e1800a]"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="rounded-xl border border-white/20 bg-white/20 px-3 py-2 text-white placeholder-white/70 outline-none backdrop-blur focus:ring-2 focus:ring-[#e1800a] sm:col-span-2"
              placeholder="Photo title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <CopyPromptButton />

            {/* BIG image input (drop area) */}
            <div className="sm:col-span-4">
              <label className="relative block h-26 w-full cursor-pointer rounded-xl border border-dashed border-white/30 bg-white/15 backdrop-blur hover:bg-white/20 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center px-4 text-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mb-2 text-white/90"
                    aria-hidden
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-white/90 text-sm font-medium">
                    Click or drop an image
                  </p>
                  <p className="text-white/70 text-xs">
                    PNG, JPG, GIF up to ~10MB
                  </p>
                </div>
              </label>

              {/* Live preview */}
              {file && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-h-56 w-full rounded-xl object-contain border border-white/20 bg-white/10"
                  />
                </div>
              )}
            </div>

            {/* Website input (optional) */}
            <input
              type="url"
              inputMode="url"
              className="sm:col-span-4 rounded-xl border border-white/20 bg-white/20 px-3 py-2 text-white placeholder-white/70 outline-none backdrop-blur focus:ring-2 focus:ring-[#e1800a]"
              placeholder="Website (optional) — https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <textarea
              className="sm:col-span-4 rounded-xl border border-white/20 bg-white/20 px-3 py-2 text-white placeholder-white/70 outline-none backdrop-blur focus:ring-2 focus:ring-[#e1800a]"
              rows={3}
              placeholder="Prompt / description (optional)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Floating Add button centered BELOW the card */}
        <button
          onClick={onAdd}
          disabled={!title.trim() || isAdding}
          className="absolute left-1/2 top-[100%] mt-4 -translate-x-1/2 rounded-2xl bg-[#040232] px-6 py-2 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? "Uploading…" : "Add"}
        </button>
      </div>
    </motion.div>
  );
}
