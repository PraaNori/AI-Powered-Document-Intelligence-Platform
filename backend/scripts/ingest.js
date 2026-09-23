/**
 * Bulk-ingest all .txt files in a folder without going through the HTTP API.
 * Usage: node scripts/ingest.js ./data
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
import "dotenv/config";
import Chunk from "../models/Chunk.js";
import { chunkText } from "../utils/chunker.js";
import { embedTexts } from "../services/embeddings.js";

dotenv.config();

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "800", 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "150", 10);

async function main() {
  const dataDir = process.argv[2] || "./data";

  if (!fs.existsSync(dataDir)) {
    console.error(`Directory not found: ${dataDir}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".txt"));
  if (files.length === 0) {
    console.error(`No .txt files found in ${dataDir}`);
    process.exit(1);
  }

  let totalChunks = 0;

  for (const filename of files) {
    const filepath = path.join(dataDir, filename);
    const text = fs.readFileSync(filepath, "utf-8");
    const docId = randomUUID();

    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`Embedding ${chunks.length} chunks from ${filename}...`);
    const vectors = await embedTexts(chunks);

    const docs = chunks.map((c, i) => ({
      text: c,
      embedding: vectors[i],
      sourceDoc: filename,
      docId,
      chunkIndex: i,
    }));

    await Chunk.insertMany(docs);
    totalChunks += chunks.length;
    console.log(`  -> stored ${docs.length} chunks for ${filename}`);
  }

  console.log(`\nDone. Ingested ${files.length} file(s), ${totalChunks} chunk(s) total.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
