import express from "express";
import cors from "cors";
import PouchDB from "pouchdb";

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 CouchDB credentials and ngrok host
const COUCHDB_USER = "khalid";
const COUCHDB_PASS = encodeURIComponent("root@root"); // URL-encode special characters
const COUCHDB_HOST = "b78ce8d13175.ngrok-free.app"; // your ngrok URL
const COUCHDB_DB = "gaminglogs";
const ADMIN_PIN = "1526"; // change if needed

// Construct CouchDB URL with authentication
const COUCHDB_URL = `https://${COUCHDB_USER}:${COUCHDB_PASS}@${COUCHDB_HOST}`;

// Initialize PouchDB
const db = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DB}`);

// 🔹 Test database connection
const testConnection = async () => {
  try {
    const info = await db.info();
    console.log(`Connected to CouchDB database "${info.db_name}" ✅`);
  } catch (err) {
    console.error("Failed to connect to CouchDB:", err);
  }
};
await testConnection();

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
