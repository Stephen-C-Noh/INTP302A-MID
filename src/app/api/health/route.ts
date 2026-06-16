import { NextResponse } from "next/server";

// Trivial health check — proves the deployed app's API layer is alive.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "ObsidianAI Study Helper",
    time: new Date().toISOString(),
  });
}
