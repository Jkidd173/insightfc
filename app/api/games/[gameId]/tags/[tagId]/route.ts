import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { tagId: string };

export async function DELETE(_req: Request, ctx: { params: Promise<Params> }) {
  const { tagId } = await ctx.params;

  const { data, error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}