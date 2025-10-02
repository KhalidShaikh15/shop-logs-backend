import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import nano from "nano";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const couchUrl = process.env.COUCHDB_URL;
const dbName = process.env.COUCHDB_DB;
const adminPin = process.env.ADMIN_PIN;

const nanoClient = nano(couchUrl);
const logsDB = nanoClient.db.use(dbName);

// Add log
app.post("/add-log", async (req, res) => {
  try {
    const log = {
      ...req.body,
      createdAt: new Date().toLocaleDateString("en-GB"), // dd/mm/yyyy
    };
    const response = await logsDB.insert(log);
    res.json({ ok: true, id: response.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all logs
app.get("/logs", async (req, res) => {
  try {
    const docs = await logsDB.list({ include_docs: true });
    const logs = docs.rows.map(r => r.doc);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset logs (admin only)
app.post("/reset", async (req, res) => {
  const { pin } = req.body;
  if (pin !== adminPin) {
    return res.status(403).json({ error: "Invalid PIN" });
  }

  try {
    const docs = await logsDB.list({ include_docs: true });
    for (const row of docs.rows) {
      await logsDB.destroy(row.id, row.value.rev);
    }
    res.json({ ok: true, msg: "Logs reset done!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend running on port 5000");
});
