import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { gameId: string };

export async function PATCH(req: Request, ctx: { params: Promise<Params> }) {
  const { gameId } = await ctx.params;
  const body = await req.json().catch(() => null);

  const status = body?.status;

  if (!["scheduled", "in_progress", "completed"].includes(status)) {
    return NextResponse.json(
      { ok: false, error: "status must be scheduled | in_progress | completed" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("games")
    .update({ status })
    .eq("id", gameId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}