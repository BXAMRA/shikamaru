const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

// Determine the database path. When packaged, it will be relative to the executable.
const dbPath = path.resolve(__dirname, "shikamaru.db");

async function setupDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign key support is crucial for cascading deletes
  await db.exec("PRAGMA foreign_keys = ON;");

  await db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            parent_project_id TEXT,
            FOREIGN KEY (parent_project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    `);

  await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            project_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    `);

  await db.exec(`
        CREATE TABLE IF NOT EXISTS progress (
            id TEXT PRIMARY KEY,
            note TEXT NOT NULL,
            task_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
    `);

  console.log("Connected to the SQLite database with sqlite.");
  return db;
}

module.exports = setupDatabase();
