import { NextResponse } from "next/server";
import { getRules, createRule, updateRule, updateAllRules, deleteRule } from "@/lib/config";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const rules = await getRules();
  return NextResponse.json({ rules });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.destination) {
    return NextResponse.json({ error: "La destination est requise" }, { status: 400 });
  }

  try {
    const rule = await createRule(body);
    return NextResponse.json({ success: true, rule });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { rules } = await request.json();
  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }

  try {
    await updateAllRules(rules);
    const updated = await getRules();
    return NextResponse.json({ success: true, rules: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id, enabled } = await request.json();
  if (!id || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "id et enabled (boolean) requis" }, { status: 400 });
  }

  try {
    const updated = await updateRule(id, { enabled });
    return NextResponse.json({ success: true, rule: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  try {
    await deleteRule(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
