import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import documentsRouter from "./routes/documents.js";
import askRouter from "./routes/ask.js";

console.log("OPENAI =", process.env.OPENAI_API_KEY);
console.log("MONGO =", process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mongoConnected: mongoose.connection.readyState === 1 });
});

app.use("/api/documents", documentsRouter);
app.use("/api/ask", askRouter);

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`RAG backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
