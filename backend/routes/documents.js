import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import Chunk from "../models/Chunk.js";
import { chunkText } from "../utils/chunker.js";
import { embedTexts } from "../services/embeddings.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "800", 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "150", 10);

/**
 * POST /api/documents
 * Accepts a .txt file upload, chunks it, embeds each chunk, and stores
 * them in MongoDB. This is the "incremental update" path — no need to
 * rebuild an index from scratch, unlike the raw FAISS version.
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Field name must be 'file'." });
    }

    const text = req.file.buffer.toString("utf-8");
    const filename = req.file.originalname;
    const docId = randomUUID();

    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    if (chunks.length === 0) {
      return res.status(400).json({ error: "File produced no chunks (empty content?)." });
    }

    const vectors = await embedTexts(chunks);

    const docs = chunks.map((chunkText, i) => ({
      text: chunkText,
      embedding: vectors[i],
      sourceDoc: filename,
      docId,
      chunkIndex: i,
    }));

    await Chunk.insertMany(docs);

    res.status(201).json({
      message: "Document ingested successfully",
      docId,
      sourceDoc: filename,
      chunkCount: chunks.length,
    });
  } catch (err) {
    console.error("Ingestion error:", err);
    res.status(500).json({ error: "Failed to ingest document", detail: err.message });
  }
});

/**
 * GET /api/documents
 * Lists distinct source documents currently indexed.
 */
router.get("/", async (req, res) => {
  try {
    const docs = await Chunk.aggregate([
      {
        $group: {
          _id: "$docId",
          sourceDoc: { $first: "$sourceDoc" },
          chunkCount: { $sum: 1 },
          createdAt: { $first: "$createdAt" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to list documents", detail: err.message });
  }
});

/**
 * DELETE /api/documents/:docId
 * Removes all chunks belonging to a document.
 */
router.delete("/:docId", async (req, res) => {
  try {
    const result = await Chunk.deleteMany({ docId: req.params.docId });
    res.json({ message: "Deleted", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete document", detail: err.message });
  }
});

export default router;
