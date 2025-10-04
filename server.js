import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let logsCollection;

async function connectDB() {
  try {
    await client.connect();
    logsCollection = client.db("gaminglogs").collection("logs");
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}
connectDB();

// Get logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await logsCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(Array.isArray(logs) ? logs : []);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// Add log
app.post("/api/logs", async (req, res) => {
  try {
    const { player, score } = req.body;
    if (!player || score === undefined) return res.status(400).json({ error: "Missing data" });

    const result = await logsCollection.insertOne({ player, score, createdAt: new Date() });
    res.json({ success: true, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add log" });
  }
});

app.listen(process.env.PORT || 5000, () => console.log("Backend running"));
