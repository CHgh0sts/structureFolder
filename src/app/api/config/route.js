import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isInitialized, getAppConfig, initializeApp, updateAppConfig, updateUserPassword } from "@/lib/config";
import { getSession } from "@/lib/auth";

export async function GET() {
  const initialized = await isInitialized();
  if (!initialized) {
    return NextResponse.json({ initialized: false });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ initialized: true, authenticated: false });
  }

  const config = await getAppConfig();
  return NextResponse.json({
    initialized: true,
    authenticated: true,
    config: {
      siteName: config.siteName,
      watchFolders: config.watchFolders,
      defaultDestination: config.defaultDestination,
      adminUsername: session.username,
    },
  });
}

export async function POST(request) {
  const body = await request.json();
  const { adminUsername, adminPassword, watchFolders, defaultDestination, siteName } = body;

  if (!adminUsername || !adminPassword || !watchFolders || watchFolders.length === 0 || !defaultDestination) {
    return NextResponse.json(
      { error: "Paramètres manquants : identifiant, mot de passe, dossiers et destination requis" },
      { status: 400 }
    );
  }

  if (adminUsername.trim().length < 2) {
    return NextResponse.json({ error: "L'identifiant doit contenir au moins 2 caractères" }, { status: 400 });
  }

  if (adminPassword.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
  }

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await initializeApp({
      siteName: siteName || "File Organizer",
      adminUsername: adminUsername.trim().toLowerCase(),
      adminPassword: hashedPassword,
      watchFolders: watchFolders.filter(Boolean),
      defaultDestination,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Erreur lors de la configuration" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { watchFolders, defaultDestination, siteName, newPassword, recursive, excludedFolders } = body;

  const updates = {};
  if (watchFolders) updates.watchFolders = watchFolders.filter(Boolean);
  if (defaultDestination) updates.defaultDestination = defaultDestination;
  if (siteName) updates.siteName = siteName;
  if (recursive !== undefined) updates.recursive = recursive;
  if (excludedFolders !== undefined) updates.excludedFolders = excludedFolders.filter(Boolean);

  try {
    const config = await updateAppConfig(updates);

    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 12);
      await updateUserPassword(session.username, hashed);
    }

    return NextResponse.json({
      success: true,
      config: {
        siteName: config.siteName,
        watchFolders: config.watchFolders,
        defaultDestination: config.defaultDestination,
        recursive: config.recursive ?? false,
        excludedFolders: config.excludedFolders ?? [],
        adminUsername: session.username,
      },
    });
  } catch (err) {
    console.error("Config update error:", err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
