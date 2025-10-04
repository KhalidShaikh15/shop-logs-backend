import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());

// 🔹 CORS configuration
// Allow only your frontend origin (Netlify)
const allowedOrigins = ["https://gamehouse26.netlify.app"];
app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `CORS policy: This origin (${origin}) is not allowed.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// 🔹 MongoDB Atlas Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

let db;

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

// 🔹 Routes

// Get all logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await db.collection("logs").find().toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs", details: err.message });
  }
});

// Add new log
app.post("/api/logs", async (req, res) => {
  try {
    const { player, score } = req.body;
    if (!player || score === undefined) {
      return res.status(400).json({ error: "Player and score are required" });
    }
    const result = await db.collection("logs").insertOne({ player, score, createdAt: new Date() });
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add log", details: err.message });
  }
});

// Edit log by ID
app.put("/api/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { player, score } = req.body;
    const { ObjectId } = await import("mongodb");
    const updatedLog = await db.collection("logs").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { player, score } },
      { returnDocument: "after" }
    );
    res.json(updatedLog.value);
  } catch (err) {
    res.status(500).json({ error: "Failed to edit log", details: err.message });
  }
});

// Reset logs (delete all)
app.delete("/api/logs/reset", async (req, res) => {
  try {
    await db.collection("logs").deleteMany({});
    res.json({ success: true, message: "All logs deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset logs", details: err.message });
  }
});

// 🔹 Start server
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
