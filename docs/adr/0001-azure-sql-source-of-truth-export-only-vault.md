# Azure SQL is the source of truth; the Obsidian vault is export-only

Azure SQL stores every Study Note and is the system of record. The Obsidian vault is a one-way export destination — users download a `.md` to drop into their vault, and the app never reads back from or writes into the vault.

We chose this over a vault round-trip (vault → AI → vault) and over two-way sync because, without an Obsidian plugin, writing back into the vault is manual and awkward, and it would leave Azure SQL with no clear role. Export-only keeps the vault fully decoupled (feasible in a ~12h solo build) and gives Azure SQL a genuine purpose as the Study Note history store. A future Obsidian plugin (Agentic extension) may add write-back later.
