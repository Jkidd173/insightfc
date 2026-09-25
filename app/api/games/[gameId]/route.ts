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
      .from("games")
      .select("*")
      .eq("id", gameId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Game not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/games/[gameId] failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load game.",
      },
      { status: 500 }
    );
  }
}
