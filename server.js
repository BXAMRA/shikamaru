const express = require("express");
const path = require("path");
const dbPromise = require("./database.js");

const app = express();
const port = 3000;
const host = "0.0.0.0";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- API Endpoints ---
app.get("/api/data", async (req, res) => {
  try {
    const db = await dbPromise;
    const projects = await db.all("SELECT * FROM projects");
    const tasks = await db.all("SELECT * FROM tasks");
    const progressNotes = await db.all(
      "SELECT * FROM progress ORDER BY created_at ASC"
    );

    const projectMap = new Map();
    projects.forEach((p) => {
      projectMap.set(p.id, { ...p, subProjects: [], tasks: [] });
    });

    tasks.forEach((t) => {
      const project = projectMap.get(t.project_id);
      if (project) {
        t.progress = progressNotes.filter((note) => note.task_id === t.id);
        project.tasks.push(t);
      }
    });

    const rootProjects = [];
    projectMap.forEach((project) => {
      if (
        project.parent_project_id &&
        projectMap.has(project.parent_project_id)
      ) {
        projectMap.get(project.parent_project_id).subProjects.push(project);
      } else {
        rootProjects.push(project);
      }
    });

    res.json({ projects: rootProjects });
  } catch (error) {
    console.error("API Error fetching data:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const db = await dbPromise;
    const { id, name, description, parentId } = req.body;
    const sql = `INSERT INTO projects (id, name, description, parent_project_id) VALUES (?, ?, ?, ?)`;
    await db.run(sql, [id, name, description, parentId || null]);
    const newProject = await db.get("SELECT * FROM projects WHERE id = ?", id);
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.delete("/api/projects/:projectId", async (req, res) => {
  try {
    const db = await dbPromise;
    const sql = "DELETE FROM projects WHERE id = ?";
    const result = await db.run(sql, req.params.projectId);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const db = await dbPromise;
    const { id, title, status, projectId } = req.body;
    await db.run(
      `INSERT INTO tasks (id, title, status, project_id) VALUES (?, ?, ?, ?)`,
      [id, title, status, projectId]
    );
    const newTask = await db.get("SELECT * FROM tasks WHERE id = ?", id);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.delete("/api/tasks/:taskId", async (req, res) => {
  try {
    const db = await dbPromise;
    const sql = "DELETE FROM tasks WHERE id = ?";
    const result = await db.run(sql, req.params.taskId);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.post("/api/progress", async (req, res) => {
  try {
    const db = await dbPromise;
    const { note, taskId } = req.body;
    const id = `prog-${Date.now()}`;
    await db.run(`INSERT INTO progress (id, note, task_id) VALUES (?, ?, ?)`, [
      id,
      note,
      taskId,
    ]);
    const newProgress = await db.get("SELECT * FROM progress WHERE id = ?", id);
    res.status(201).json(newProgress);
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.put("/api/tasks/:taskId/status", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE tasks SET status = ? WHERE id = ?`, [
      req.body.status,
      req.params.taskId,
    ]);
    res.json({ message: "Task status updated successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.put("/api/tasks/:taskId/rename", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE tasks SET title = ? WHERE id = ?`, [
      req.body.title,
      req.params.taskId,
    ]);
    res.json({ message: "Task title updated successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.put("/api/progress/:progressId/update", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE progress SET note = ? WHERE id = ?`, [
      req.body.note,
      req.params.progressId,
    ]);
    res.json({ message: "Progress note updated successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.put("/api/projects/:projectId/rename", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE projects SET name = ? WHERE id = ?`, [
      req.body.name,
      req.params.projectId,
    ]);
    res.json({ message: "Project renamed successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.put("/api/projects/:projectId/describe", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE projects SET description = ? WHERE id = ?`, [
      req.body.description,
      req.params.projectId,
    ]);
    res.json({ message: "Description updated" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.put("/api/projects/:projectId/move", async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run(`UPDATE projects SET parent_project_id = ? WHERE id = ?`, [
      req.body.newParentId || null,
      req.params.projectId,
    ]);
    res.json({ message: "Project moved successfully" });
  } catch (err) {
    res.status(400).json({ error: `Database error: ${err.message}` });
  }
});

app.listen(port, host, () => {
  console.log(`Shikamaru app listening at http://${host}:${port}`);
});
