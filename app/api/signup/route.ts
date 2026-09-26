import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const invitePassword =
      typeof body.invitePassword === "string"
        ? body.invitePassword
        : "";

    if (!email || !password || !invitePassword) {
      return NextResponse.json(
        {
          error:
            "Email, password, and invite password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Your account password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const requiredInvitePassword =
      process.env.SIGNUP_INVITE_PASSWORD;

    if (!requiredInvitePassword) {
      console.error(
        "SIGNUP_INVITE_PASSWORD is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Private signup is not configured correctly.",
        },
        { status: 500 }
      );
    }

    if (invitePassword !== requiredInvitePassword) {
      return NextResponse.json(
        {
          error: "Incorrect invite password.",
        },
        { status: 403 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Supabase environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Signup is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: !data.session,
      message: data.session
        ? "Account created successfully."
        : "Account created. Check your email to confirm your account, then sign in.",
    });
  } catch (error) {
    console.error("Signup route error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}
