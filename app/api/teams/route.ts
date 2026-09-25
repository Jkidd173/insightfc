import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: data ?? [],
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const name =
    typeof body?.name === "string" ? body.name.trim() : "";

  const season =
    typeof body?.season === "string"
      ? body.season.trim() || null
      : null;

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Team name is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("teams")
    .insert([
      {
        name,
        season,
        created_by: user.id,
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const teamId = body?.teamId;
  const confirmation = body?.confirmation;

  if (!teamId) {
    return NextResponse.json(
      { ok: false, error: "Team ID is required." },
      { status: 400 }
    );
  }

  if (confirmation !== "delete") {
    return NextResponse.json(
      {
        ok: false,
        error: 'Type "delete" to confirm team deletion.',
      },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Team deleted.",
  });
}
