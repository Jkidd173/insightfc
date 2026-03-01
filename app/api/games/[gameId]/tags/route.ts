import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { gameId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { gameId } = await ctx.params;

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("game_id", gameId)
    .order("minute", { ascending: true })
    .order("second", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { gameId } = await ctx.params;
  const body = await req.json().catch(() => null);

  const label = body?.label?.trim?.();
  const notes = body?.notes?.trim?.() ?? null;

  const minute =
    body?.minute === undefined || body?.minute === null || body?.minute === ""
      ? null
      : Number(body.minute);

  const second =
    body?.second === undefined || body?.second === null || body?.second === ""
      ? null
      : Number(body.second);

  const player_id = body?.player_id ?? null; // optional UUID

  if (!label) {
    return NextResponse.json({ ok: false, error: "label is required" }, { status: 400 });
  }
  if (minute !== null && Number.isNaN(minute)) {
    return NextResponse.json({ ok: false, error: "minute must be a number" }, { status: 400 });
  }
  if (second !== null && Number.isNaN(second)) {
    return NextResponse.json({ ok: false, error: "second must be a number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tags")
    .insert([
      {
        game_id: gameId,
        player_id,
        minute,
        second,
        label,
        notes,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}