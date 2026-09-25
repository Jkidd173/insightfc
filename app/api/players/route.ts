import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["active", "guest", "inactive"];
const VALID_POSITIONS = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];
const VALID_FEET = ["Right", "Left"];

const PLAYER_FIELDS =
  "id,team_id,name,jersey_number,birth_year,position,primary_foot,status,created_at,updated_at";

async function getAuthenticatedClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    authError: error,
  };
}

export async function GET(req: Request) {
  const { supabase, user, authError } =
    await getAuthenticatedClient();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return NextResponse.json(
      { ok: false, error: "Team ID is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("players")
    .select(PLAYER_FIELDS)
    .eq("team_id", teamId)
    .order("name", { ascending: true });

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
  const { supabase, user, authError } =
    await getAuthenticatedClient();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const teamId =
    typeof body?.teamId === "string"
      ? body.teamId.trim()
      : "";

  const name =
    typeof body?.name === "string"
      ? body.name.trim()
      : "";

  const jerseyNumber =
    typeof body?.jerseyNumber === "string"
      ? body.jerseyNumber.trim()
      : "";

  const birthYear = Number(body?.birthYear);

  const position =
    typeof body?.position === "string"
      ? body.position.trim()
      : "";

  const primaryFoot =
    typeof body?.primaryFoot === "string"
      ? body.primaryFoot.trim()
      : "";

  const status =
    typeof body?.status === "string"
      ? body.status.toLowerCase()
      : "active";

  if (!teamId) {
    return NextResponse.json(
      { ok: false, error: "Team ID is required." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Player name is required." },
      { status: 400 }
    );
  }

  if (!jerseyNumber) {
    return NextResponse.json(
      { ok: false, error: "Jersey number is required." },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    birthYear > new Date().getFullYear()
  ) {
    return NextResponse.json(
      { ok: false, error: "A valid birth year is required." },
      { status: 400 }
    );
  }

  if (!VALID_POSITIONS.includes(position)) {
    return NextResponse.json(
      { ok: false, error: "A valid position is required." },
      { status: 400 }
    );
  }

  if (!VALID_FEET.includes(primaryFoot)) {
    return NextResponse.json(
      { ok: false, error: "A valid primary foot is required." },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid player status." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("players")
    .insert([
      {
        team_id: teamId,
        name,
        jersey_number: jerseyNumber,
        birth_year: birthYear,
        position,
        primary_foot: primaryFoot,
        status,
      },
    ])
    .select(PLAYER_FIELDS)
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

export async function PATCH(req: Request) {
  const { supabase, user, authError } =
    await getAuthenticatedClient();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const playerId = body?.playerId;

  const status =
    typeof body?.status === "string"
      ? body.status.toLowerCase()
      : "";

  if (!playerId) {
    return NextResponse.json(
      { ok: false, error: "Player ID is required." },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid player status." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("players")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId)
    .select(PLAYER_FIELDS)
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data,
  });
}

export async function DELETE(req: Request) {
  const { supabase, user, authError } =
    await getAuthenticatedClient();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "You must be signed in." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);

  const playerId = body?.playerId;
  const confirmation = body?.confirmation;

  if (!playerId) {
    return NextResponse.json(
      { ok: false, error: "Player ID is required." },
      { status: 400 }
    );
  }

  if (confirmation !== "delete") {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Type "delete" to permanently remove this player.',
      },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Player permanently removed.",
  });
}
