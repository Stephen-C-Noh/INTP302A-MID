import { NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import {
  buildUserPrompt,
  MAX_MATERIAL_CHARS,
  studyNoteJsonSchema,
  SYSTEM_PROMPT,
  type StudyNote,
} from "@/lib/studyNote";
import { saveStudyNote } from "@/lib/db";

export const runtime = "nodejs";

function getClient(): AzureOpenAI {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!endpoint || !apiKey || !deployment) {
    throw new Error(
      "Missing Azure OpenAI configuration (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_KEY / AZURE_OPENAI_DEPLOYMENT).",
    );
  }
  return new AzureOpenAI({
    endpoint,
    apiKey,
    deployment,
    apiVersion: "2024-10-21",
  });
}

async function generate(material: string, course?: string): Promise<StudyNote> {
  const client = getClient();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT as string;

  const completion = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(material, course) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: studyNoteJsonSchema,
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from the model.");
  return JSON.parse(content) as StudyNote;
}

export async function POST(req: Request) {
  let body: { material?: unknown; course?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const material = typeof body.material === "string" ? body.material : "";
  const course = typeof body.course === "string" ? body.course : undefined;

  if (!material.trim()) {
    return NextResponse.json(
      { error: "Study Material is required." },
      { status: 400 },
    );
  }
  if (material.length > MAX_MATERIAL_CHARS) {
    return NextResponse.json(
      { error: `Study Material exceeds ${MAX_MATERIAL_CHARS} characters.` },
      { status: 400 },
    );
  }

  try {
    // One retry on a transient/parse failure.
    let note: StudyNote;
    try {
      note = await generate(material, course);
    } catch {
      note = await generate(material, course);
    }
    // Azure SQL is the source of truth — persist before returning (ADR 0001).
    const saved = await saveStudyNote(note, material);
    return NextResponse.json(saved);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate Study Note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
