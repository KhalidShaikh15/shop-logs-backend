import express from "express";
import cors from "cors";
import PouchDB from "pouchdb";

const app = express();
app.use(express.json());
app.use(cors());

// Environment Variables
const COUCHDB_URL = process.env.COUCHDB_URL || "http://localhost:5984";
const COUCHDB_DB = "gaminglogs";
const db = new PouchDB(`${COUCHDB_URL}/${COUCHDB_DB}`);
const ADMIN_PIN = process.env.ADMIN_PIN || "1526";

// 🔹 Add log entry
app.post("/add-log", async (req, res) => {
  try {
    const doc = req.body;
    const response = await db.post(doc); // PouchDB handles _id automatically
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add log" });
  }
});

// 🔹 Get all logs
app.get("/logs", async (req, res) => {
  try {
    const result = await db.allDocs({ include_docs: true });
    const logs = result.rows.map((row) => row.doc);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// 🔹 Edit a log
app.put("/edit-log/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedDoc = req.body;

    // Fetch the existing document
    const existingDoc = await db.get(id);

    // Merge _rev to allow updating
    updatedDoc._rev = existingDoc._rev;
    updatedDoc._id = id;

    const response = await db.put(updatedDoc);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to edit log" });
  }
});

// 🔹 Delete all logs (Admin only)
app.post("/reset-logs", async (req, res) => {
  try {
    const { pin } = req.body;
    if (pin !== ADMIN_PIN) return res.status(403).json({ error: "Invalid PIN" });

    const result = await db.allDocs({ include_docs: true });
    const deletions = result.rows.map((row) => ({
      ...row.doc,
      _deleted: true,
    }));

    await db.bulkDocs(deletions);
    res.json({ success: true, message: "Logs reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset logs" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
