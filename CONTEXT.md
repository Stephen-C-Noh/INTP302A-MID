# ObsidianAI Study Helper

A web app that turns a learner's raw course notes into a single, Obsidian-ready study note using AI, and persists the result for later review.

## Language

**Study Material**:
The raw, unstructured course notes a user submits as input (pasted text or an uploaded `.md` file).
_Avoid_: document, source, input text, notes

**Study Note**:
The single Obsidian-ready `.md` artifact the AI produces from one piece of Study Material — contains the summary, key concepts, and review questions together. One input produces exactly one Study Note.
_Avoid_: study pack, study material (that's the input), document, output

**Key Concept**:
An important idea extracted from the Study Material, carried as a term plus a one-line definition, and embedded in the Study Note as an Obsidian `[[wikilink]]` so it appears in the vault graph.
_Avoid_: keyword, tag, entity

**Course**:
The subject a Study Note belongs to (e.g. "Biology 101"). User-provided, or AI-inferred from the Study Material when left blank. Rendered as an Obsidian `[[wikilink]]` so all notes of a course cluster into one hub (MOC) node in the graph, and used to group/filter the history in the app.
_Avoid_: subject, category, topic, class

**Review Question**:
An open-ended prompt (2–3 per Study Note) meant to provoke reflection — deliberately has no provided answer. It is "food for thought," not a quiz with a correct response.
_Avoid_: quiz question, test question, exam question
