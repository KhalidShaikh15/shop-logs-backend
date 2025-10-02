import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Environment Variables
const COUCHDB_URL = process.env.COUCHDB_URL;
const db = new PouchDB(couchUrl + '/gaminglogs');
const ADMIN_PIN = process.env.ADMIN_PIN || "1526";

// 🔹 Add log entry
app.post("/add-log", async (req, res) => {
  try {
    const doc = req.body;

    const response = await fetch(`${COUCHDB_URL}/${COUCHDB_DB}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add log" });
  }
});

// 🔹 Get all logs
app.get("/logs", async (req, res) => {
  try {
    const response = await fetch(`${COUCHDB_URL}/${COUCHDB_DB}/_all_docs?include_docs=true`);
    const data = await response.json();
    const logs = data.rows.map((row) => row.doc);
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

    // Fetch existing doc first
    const getRes = await fetch(`${COUCHDB_URL}/${COUCHDB_DB}/${id}`);
    const existingDoc = await getRes.json();

    // Merge _rev so CouchDB accepts update
    updatedDoc._rev = existingDoc._rev;

    const response = await fetch(`${COUCHDB_URL}/${COUCHDB_DB}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedDoc),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to edit log" });
  }
});

// 🔹 Reset logs (Admin only)
app.post("/reset-logs", async (req, res) => {
  try {
    const { pin } = req.body;
    if (pin !== ADMIN_PIN) {
      return res.status(403).json({ error: "Invalid PIN" });
    }

    // Fetch all docs
    const response = await fetch(`${COUCHDB_URL}/${COUCHDB_DB}/_all_docs?include_docs=true`);
    const data = await response.json();

    // Mark docs as deleted
    const deletions = data.rows.map((row) => ({
      ...row.doc,
      _deleted: true,
    }));

    // Bulk delete
    await fetch(`${COUCHDB_URL}/${COUCHDB_DB}/_bulk_docs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docs: deletions }),
    });

    res.json({ success: true, message: "Logs reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset logs" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
