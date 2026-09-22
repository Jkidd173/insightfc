import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { gameId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { gameId } = await ctx.params;

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}