import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

  if (publicRoutes.includes(pathname)) {
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "supersecretkey_for_expert_match");
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } catch (error) {
        // Invalid token, continue to login
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "supersecretkey_for_expert_match");
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
