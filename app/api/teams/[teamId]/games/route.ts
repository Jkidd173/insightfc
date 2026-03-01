import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { teamId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { teamId } = await ctx.params;

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { teamId } = await ctx.params;
  const body = await req.json().catch(() => null);

  const type = body?.type ?? "game"; // game | scrimmage | tournament
  const status = body?.status ?? "scheduled"; // scheduled | in_progress | completed

  const date = body?.date; // "YYYY-MM-DD" (required)
  const time = body?.time ?? null; // "HH:MM" (optional)

  const opponent = body?.opponent?.trim?.() ?? null;
  const location = body?.location?.trim?.() ?? null;
  const home_away = body?.home_away ?? null; // home | away | null

  if (!date) {
    return NextResponse.json({ ok: false, error: "date is required (YYYY-MM-DD)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("games")
    .insert([
      {
        team_id: teamId,
        type,
        status,
        date,
        time,
        opponent,
        location,
        home_away,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}