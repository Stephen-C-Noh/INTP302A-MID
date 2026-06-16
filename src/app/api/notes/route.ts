import { NextResponse } from "next/server";
import { listStudyNoteSummaries } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notes = await listStudyNoteSummaries();
    return NextResponse.json(notes);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load Study Notes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
