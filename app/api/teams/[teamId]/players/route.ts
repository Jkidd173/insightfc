import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { teamId: string };

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> }
) {
  const { teamId } = await ctx.params;

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<Params> }
) {
  const { teamId } = await ctx.params;
  const body = await req.json().catch(() => null);

  const name = body?.name?.trim();
  const jersey_number =
    body?.jersey_number === undefined ||
    body?.jersey_number === null ||
    body?.jersey_number === ""
      ? null
      : Number(body.jersey_number);

  const position = body?.position?.trim() ?? null;

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Player name is required" },
      { status: 400 }
    );
  }

  if (jersey_number !== null && Number.isNaN(jersey_number)) {
    return NextResponse.json(
      { ok: false, error: "jersey_number must be a number" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("players")
    .insert([{ team_id: teamId, name, jersey_number, position }])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}