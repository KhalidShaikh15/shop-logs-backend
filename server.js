import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // ✅ Allows all origins, adjust if needed

const PORT = process.env.PORT || 5000;

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
let logsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("gaminglogs");
    logsCollection = db.collection("logs");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectDB();

// 🔹 Get all logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await logsCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// 🔹 Add a new log
app.post("/api/logs", async (req, res) => {
  try {
    const { player, score } = req.body;
    if (!player || score === undefined) {
      return res.status(400).json({ error: "Player and score are required" });
    }
    const log = { player, score, createdAt: new Date() };
    const result = await logsCollection.insertOne(log);
    res.json({ success: true, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add log" });
  }
});

// 🔹 Edit a log
app.put("/api/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { player, score } = req.body;
    const result = await logsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { player, score } }
    );
    res.json({ success: result.modifiedCount === 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to edit log" });
  }
});

// 🔹 Reset all logs
app.delete("/api/logs/reset", async (req, res) => {
  try {
    const result = await logsCollection.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset logs" });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
