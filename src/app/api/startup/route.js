import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import { getSession } from "@/lib/auth";

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (!["enable", "disable"].includes(action)) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const scriptPath = path.join(
    process.cwd(),
    "scripts",
    `${action}-startup.mjs`
  );
  const nodeBin = process.execPath;

  try {
    const output = execSync(`"${nodeBin}" "${scriptPath}"`, {
      encoding: "utf-8",
      timeout: 15000,
    });

    return NextResponse.json({
      success: true,
      output: output.trim(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Erreur lors de l'exécution du script",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
