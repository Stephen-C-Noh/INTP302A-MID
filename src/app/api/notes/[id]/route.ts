import { NextResponse } from "next/server";
import { deleteStudyNote, getStudyNote } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/notes/[id]">,
) {
  const { id } = await params;
  try {
    const note = await getStudyNote(id);
    if (!note) {
      return NextResponse.json({ error: "Study Note not found." }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load the Study Note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/notes/[id]">,
) {
  const { id } = await params;
  try {
    const deleted = await deleteStudyNote(id);
    if (!deleted) {
      return NextResponse.json({ error: "Study Note not found." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete the Study Note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
