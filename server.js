import express from "express";
import cors from "cors";
import PouchDB from "pouchdb";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 Environment Variables
// Make sure to set COUCHDB_USER and COUCHDB_PASS in your environment
const COUCHDB_HOST = process.env.COUCHDB_HOST || "127.0.0.1:5984";
const COUCHDB_USER = process.env.COUCHDB_USER || "khalid";
const COUCHDB_PASS = process.env.COUCHDB_PASS || "root@root";
const COUCHDB_DB = "gaminglogs";
const ADMIN_PIN = process.env.ADMIN_PIN || "1526";

// Construct CouchDB URL with credentials
const COUCHDB_URL = `http://${COUCHDB_USER}:${COUCHDB_PASS}@${COUCHDB_HOST}`;

// 🔹 Initialize PouchDB
const db = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DB}`);

// 🔹 Check if database exists, create if not
const initDB = async () => {
  try {
    await db.info();
    console.log(`Database "${COUCHDB_DB}" exists ✅`);
  } catch (err) {
    if (err.status === 404) {
      console.log(`Database "${COUCHDB_DB}" not found. Creating...`);
      await fetch(`${COUCHDB_URL}/${COUCHDB_DB}`, { method: "PUT" });
      console.log(`Database "${COUCHDB_DB}" created ✅`);
    } else {
      console.error("Error connecting to database:", err);
    }
  }
};
await initDB();

// 🔹 Add log entry
app.post("/add-log", async (req, res) => {
  try {
    const doc = req.body;
    const response = await db.post(doc);
    res.json(response);
  } catch (err) {
    console.error("Add log error:", err);
    res.status(500).json({ error: "Failed to add log", details: err.message });
  }
});

// 🔹 Get all logs
app.get("/logs", async (req, res) => {
  try {
    const result = await db.allDocs({ include_docs: true });
    const logs = result.rows.map((row) => row.doc);
    res.json(logs);
  } catch (err) {
    console.error("Fetch logs error:", err);
    res.status(500).json({ error: "Failed to fetch logs", details: err.message });
  }
});

// 🔹 Edit a log
app.put("/edit-log/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDoc = req.body;

    const existingDoc = await db.get(id);
    updatedDoc._id = id;
    updatedDoc._rev = existingDoc._rev;

    const response = await db.put(updatedDoc);
    res.json(response);
  } catch (err) {
    console.error("Edit log error:", err);
    res.status(500).json({ error: "Failed to edit log", details: err.message });
  }
});

// 🔹 Delete all logs (Admin only)
app.post("/reset-logs", async (req, res) => {
  try {
    const { pin } = req.body;
    if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Invalid PIN" });

    const result = await db.allDocs({ include_docs: true });
    const deletions = result.rows.map((row) => ({ ...row.doc, _deleted: true }));

    await db.bulkDocs(deletions);
    res.json({ success: true, message: "Logs reset successfully" });
  } catch (err) {
    console.error("Reset logs error:", err);
    res.status(500).json({ error: "Failed to reset logs", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
