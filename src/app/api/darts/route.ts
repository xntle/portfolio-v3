import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";
import { dartsAllowed, isDartValue, MAX_DARTS } from "@/app/play/darts";

// The dart leaderboard. Visitors do not sign in; the browser sends a random id
// it keeps for itself, a name, and the darts it threw. Everything is checked
// here, and only this route can write to the table.

export const dynamic = "force-dynamic";

const TABLE = "darts_scores";
const TOP = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME = /^[A-Za-z0-9 _-]{2,12}$/;

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** A name fit to show to everyone, or null. */
function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (!NAME.test(name)) return null;
  // also check it with the separators taken out, so "f_u-c k" does not get through
  if (matcher.hasMatch(name) || matcher.hasMatch(name.replace(/[ _-]/g, ""))) return null;
  return name;
}

/** An optional line to go with the score: plain text, one line, clean. */
function cleanMessage(raw: unknown): string | null | false {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") return false;
  // no control characters or angle brackets; it is only ever shown as text
  const text = raw.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length > 60 || /https?:|www\./i.test(text)) return false;
  if (matcher.hasMatch(text) || matcher.hasMatch(text.replace(/[^\p{L}\p{N}]/gu, ""))) return false;
  return text;
}

async function top(client: NonNullable<ReturnType<typeof db>>) {
  const { data, error } = await client
    .from(TABLE)
    .select("name, score, message")
    .eq("hidden", false)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(TOP);
  if (error) throw error;
  return data ?? [];
}

export async function GET() {
  const client = db();
  if (!client) return NextResponse.json({ enabled: false, scores: [] });
  try {
    return NextResponse.json({ enabled: true, scores: await top(client) });
  } catch {
    return NextResponse.json({ enabled: false, scores: [] });
  }
}

export async function POST(req: Request) {
  const client = db();
  if (!client) return NextResponse.json({ error: "The leaderboard is not set up yet." }, { status: 503 });

  let body: { visitor?: unknown; name?: unknown; message?: unknown; hits?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const visitor = typeof body.visitor === "string" && UUID.test(body.visitor) ? body.visitor.toLowerCase() : null;
  if (!visitor) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const name = cleanName(body.name);
  if (!name) {
    return NextResponse.json({ error: "Pick another name: 2 to 12 letters or numbers, and keep it clean." }, { status: 422 });
  }

  const message = cleanMessage(body.message);
  if (message === false) {
    return NextResponse.json({ error: "Change the message: up to 60 characters, no links, and keep it clean." }, { status: 422 });
  }

  // the round has to be one the game could have produced: real dart values,
  // and exactly as many darts as the rules allow (three, plus three more for
  // every set of three worth 100 or more)
  const hits = Array.isArray(body.hits) ? body.hits : null;
  if (!hits || hits.length > MAX_DARTS || !hits.every(isDartValue) || dartsAllowed(hits) !== hits.length) {
    return NextResponse.json({ error: "That round does not add up." }, { status: 422 });
  }
  const score = hits.reduce((sum, p) => sum + p, 0);

  try {
    const { data: mine } = await client.from(TABLE).select("score, updated_at").eq("visitor", visitor).maybeSingle();
    // one write every few seconds per browser is plenty
    if (mine && Date.now() - new Date(mine.updated_at).getTime() < 4000) {
      return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
    }
    // each browser keeps its best round; a lower one only updates the name
    const row = !mine || score > mine.score ? { visitor, name, message, score, darts: hits.length } : { visitor, name, message };
    const { error } = mine
      ? await client.from(TABLE).update({ ...row, updated_at: new Date().toISOString() }).eq("visitor", visitor)
      : await client.from(TABLE).insert(row);
    if (error) throw error;
    return NextResponse.json({ enabled: true, scores: await top(client), best: Math.max(score, mine?.score ?? 0) });
  } catch {
    return NextResponse.json({ error: "Could not save that. Try again." }, { status: 500 });
  }
}
