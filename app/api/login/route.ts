import { NextRequest, NextResponse } from "next/server";
import { LoginPayloadSchema } from "@/schemas/auth";
import { signSession, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = LoginPayloadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { username, password } = result.data;
    const expectedUsername = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "password123";

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signSession({ username, role: "admin" });

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return response;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
