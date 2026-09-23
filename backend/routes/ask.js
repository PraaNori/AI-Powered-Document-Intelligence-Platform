import express from "express";
import { retrieveChunks } from "../services/retrieve.js";
import { generateAnswer } from "../services/llm.js";

const router = express.Router();

/**
 * POST /api/ask
 * Body: { "question": "..." }
 * Full RAG flow: embed question -> vector search -> build context -> generate answer.
 */
router.post("/", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Request body must include a non-empty 'question' string." });
    }

    const chunks = await retrieveChunks(question);

    if (chunks.length === 0) {
      return res.json({
        answer: "I don't have any indexed documents to answer this from yet. Please upload some first.",
        sources: [],
      });
    }

    const answer = await generateAnswer(question, chunks);

    res.json({
      answer,
      sources: chunks.map((c) => ({
        sourceDoc: c.sourceDoc,
        chunkIndex: c.chunkIndex,
        score: c.score,
        preview: c.text.slice(0, 150) + (c.text.length > 150 ? "..." : ""),
      })),
    });
  } catch (err) {
    console.error("Ask error:", err);
    res.status(500).json({ error: "Failed to answer question", detail: err.message });
  }
});

export default router;
