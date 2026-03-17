import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getLogs } from "@/lib/config";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "logs") {
    const logs = await getLogs(100);
    return NextResponse.json({ logs });
  }

  const { getWatcherStatus } = await import("@/lib/watcher");
  const status = getWatcherStatus();
  return NextResponse.json(status);
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { action } = await request.json();

  const { startWatcher, stopWatcher, restartWatcher, processExistingFiles } = await import("@/lib/watcher");

  if (action === "start") return NextResponse.json(await startWatcher());
  if (action === "stop") return NextResponse.json(await stopWatcher());
  if (action === "restart") return NextResponse.json(await restartWatcher());
  if (action === "process-existing") return NextResponse.json(await processExistingFiles());

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
