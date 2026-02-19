import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "zapchast_session";
const SESSION_VALUE = "authenticated_admin";

const PUBLIC_PATHS = ["/", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE);
  const isAuthenticated = session?.value === SESSION_VALUE;

  if (!isAuthenticated) {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
