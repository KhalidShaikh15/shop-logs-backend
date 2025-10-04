import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

let db;

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db("gaminglogs"); // database name
    console.log("✅ Connected to MongoDB Atlas (gaminglogs db)");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

connectDB();

// API: Fetch all logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await db.collection("logs").find().toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs", details: err.message });
  }
});

// API: Add new log
app.post("/api/logs", async (req, res) => {
  try {
    const { player, score } = req.body;
    if (!player || !score) {
      return res.status(400).json({ error: "Player and score are required" });
    }
    const result = await db.collection("logs").insertOne({ player, score, createdAt: new Date() });
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add log", details: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
