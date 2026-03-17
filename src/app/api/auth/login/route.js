import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByUsername, isInitialized } from "@/lib/config";
import { signToken, createSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
  }

  const initialized = await isInitialized();
  if (!initialized) {
    return NextResponse.json({ error: "Application non configurée" }, { status: 400 });
  }

  const user = await getUserByUsername(username.trim());

  if (!user) {
    // Délai anti-timing-attack même si l'utilisateur n'existe pas
    await bcrypt.hash("dummy", 12);
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });
  }

  const token = signToken({ role: user.role, username: user.username, userId: user.id, loginAt: Date.now() });
  const cookieOptions = createSessionCookie(token);

  const response = NextResponse.json({ success: true, username: user.username });
  response.cookies.set(cookieOptions);

  return response;
}
