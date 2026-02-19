import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123456";
const SESSION_COOKIE = "zapchast_session";
const SESSION_VALUE = "authenticated_admin";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Noto'g'ri ma'lumotlar" },
      { status: 401 },
    );
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
