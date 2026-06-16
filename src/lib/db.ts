// Azure SQL access layer — the source of truth for Study Notes (see ADR 0001).
// Structured arrays (keyConcepts, questions) are stored as JSON in NVARCHAR(MAX).

import sql from "mssql";
import type {
  SavedStudyNote,
  StudyNote,
  StudyNoteSummary,
} from "@/lib/studyNote";

// Cache the pool across hot-reloads / route invocations so we don't exhaust
// connections on a serverless tier.
const globalForDb = globalThis as unknown as {
  __sqlPool?: Promise<sql.ConnectionPool>;
};

function getPool(): Promise<sql.ConnectionPool> {
  const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("Missing AZURE_SQL_CONNECTION_STRING.");
  }
  if (!globalForDb.__sqlPool) {
    globalForDb.__sqlPool = new sql.ConnectionPool(connectionString)
      .connect()
      .catch((err) => {
        // Let the next call retry rather than caching a dead pool.
        globalForDb.__sqlPool = undefined;
        throw err;
      });
  }
  return globalForDb.__sqlPool;
}

export async function saveStudyNote(
  note: StudyNote,
  sourceMaterial: string,
): Promise<SavedStudyNote> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("title", sql.NVarChar(300), note.title)
    .input("course", sql.NVarChar(200), note.course)
    .input("sourceMaterial", sql.NVarChar(sql.MAX), sourceMaterial)
    .input("summary", sql.NVarChar(sql.MAX), note.summary)
    .input("keyConcepts", sql.NVarChar(sql.MAX), JSON.stringify(note.keyConcepts))
    .input("questions", sql.NVarChar(sql.MAX), JSON.stringify(note.questions))
    .query<{ id: string; createdAt: Date }>(
      `INSERT INTO StudyNotes (title, course, sourceMaterial, summary, keyConcepts, questions)
       OUTPUT INSERTED.id, INSERTED.createdAt
       VALUES (@title, @course, @sourceMaterial, @summary, @keyConcepts, @questions);`,
    );

  const row = result.recordset[0];
  return {
    ...note,
    id: row.id,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export async function listStudyNoteSummaries(): Promise<StudyNoteSummary[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query<{ id: string; title: string; course: string; createdAt: Date }>(
      `SELECT id, title, course, createdAt
       FROM StudyNotes
       ORDER BY createdAt DESC;`,
    );
  return result.recordset.map((r) => ({
    id: r.id,
    title: r.title,
    course: r.course,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

export async function getStudyNote(id: string): Promise<SavedStudyNote | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<{
      id: string;
      title: string;
      course: string;
      summary: string;
      keyConcepts: string;
      questions: string;
      createdAt: Date;
    }>(
      `SELECT id, title, course, summary, keyConcepts, questions, createdAt
       FROM StudyNotes
       WHERE id = @id;`,
    );

  const row = result.recordset[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    course: row.course,
    summary: row.summary,
    keyConcepts: JSON.parse(row.keyConcepts),
    questions: JSON.parse(row.questions),
    createdAt: new Date(row.createdAt).toISOString(),
  };
}
