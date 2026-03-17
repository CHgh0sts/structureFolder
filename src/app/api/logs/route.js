import { NextResponse } from "next/server";
import { getLogs, clearLogs } from "@/lib/config";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const logs = await getLogs();
  return NextResponse.json({ logs });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await clearLogs();
  return NextResponse.json({ success: true });
}
