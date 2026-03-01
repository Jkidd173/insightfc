import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const name = body?.name?.trim();
  const season = body?.season?.trim() ?? null;

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Team name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("teams")
    .insert([{ name, season }])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}