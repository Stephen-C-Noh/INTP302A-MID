-- Azure SQL schema for ObsidianAI Study Helper (issue #3, ADR 0001).
-- Azure SQL is the source of truth; structured arrays are stored as JSON.
-- Run once against the provisioned database (e.g. in the Azure portal Query editor).

IF OBJECT_ID('dbo.StudyNotes', 'U') IS NULL
BEGIN
  CREATE TABLE StudyNotes (
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title          NVARCHAR(300)  NOT NULL,
    course         NVARCHAR(200)  NULL,
    sourceMaterial NVARCHAR(MAX)  NOT NULL,
    summary        NVARCHAR(MAX)  NOT NULL,
    keyConcepts    NVARCHAR(MAX)  NOT NULL,  -- JSON [{term, definition}]
    questions      NVARCHAR(MAX)  NOT NULL,  -- JSON ["...", "..."]
    createdAt      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
