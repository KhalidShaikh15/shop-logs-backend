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

// Get all logs
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await logsCollection.find().sort({ _id: -1 }).toArray();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// Get single log
app.get("/api/logs/:id", async (req, res) => {
  try {
    const log = await logsCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log" });
  }
});

// Add log
app.post("/api/logs", async (req, res) => {
  try {
    const { device, startTime, endTime, controllers, totalPayment, cash, online } = req.body;
    if (!device || !startTime || !endTime) return res.status(400).json({ error: "Missing fields" });

    const result = await logsCollection.insertOne({
      device, startTime, endTime, controllers, totalPayment, cash, online, createdAt: new Date()
    });
    res.json({ success: true, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add log" });
  }
});

// Update log
app.put("/api/logs/:id", async (req, res) => {
  try {
    const { device, startTime, endTime, controllers, totalPayment, cash, online } = req.body;
    await logsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { device, startTime, endTime, controllers, totalPayment, cash, online } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update log" });
  }
});

// Delete log
app.delete("/api/logs/:id", async (req, res) => {
  try {
    await logsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete log" });
  }
});

// Reset all logs (PIN required)
app.delete("/api/logs/reset", async (req, res) => {
  try {
    const { pin } = req.body;
    if (pin !== "1526") return res.status(403).json({ error: "Invalid PIN" });

    await logsCollection.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset logs" });
  }
});

app.listen(process.env.PORT || 5000, () => console.log("Backend running"));
