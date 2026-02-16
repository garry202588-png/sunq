import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = await createToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set("ai-toolbox-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return response;
}
