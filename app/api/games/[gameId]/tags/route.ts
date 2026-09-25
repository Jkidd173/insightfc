import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = {
  gameId: string;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> }
) {
  try {
    const { gameId } = await ctx.params;

    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "Game ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("game_id", gameId)
      .order("minute", { ascending: true })
      .order("second", { ascending: true })
      .order("created_at", { ascending: true });

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
  } catch (error) {
    console.error("GET /api/games/[gameId]/tags failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load tags.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<Params> }
) {
  try {
    const { gameId } = await ctx.params;

    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "Game ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const label =
      typeof body.label === "string"
        ? body.label.trim()
        : "";

    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    const playerId =
      typeof body.player_id === "string" && body.player_id
        ? body.player_id
        : null;

    const minute = Number.isFinite(Number(body.minute))
      ? Math.max(0, Math.floor(Number(body.minute)))
      : 0;

    const second = Number.isFinite(Number(body.second))
      ? Math.max(
          0,
          Math.min(59, Math.floor(Number(body.second)))
        )
      : 0;

    if (!label) {
      return NextResponse.json(
        { ok: false, error: "Tag label is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({
        game_id: gameId,
        player_id: playerId,
        minute,
        second,
        label,
        notes,
      })
      .select("*")
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
  } catch (error) {
    console.error("POST /api/games/[gameId]/tags failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create tag.",
      },
      { status: 500 }
    );
  }
}
