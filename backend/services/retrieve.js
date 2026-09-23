import Chunk from "../models/Chunk.js";
import { embedQuery } from "./embeddings.js";

const TOP_K = parseInt(process.env.TOP_K || "4", 10);
const VECTOR_INDEX_NAME = "vector_index"; // must match the name given in Atlas UI

/**
 * Embeds the question, then runs MongoDB Atlas Vector Search ($vectorSearch)
 * to find the most semantically similar chunks. This replaces FAISS entirely —
 * MongoDB does the ANN search natively over the `embedding` field.
 */
export async function retrieveChunks(question, topK = TOP_K) {
  const queryVector = await embedQuery(question);

  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(topK * 20, 100),
        limit: topK,
      },
    },
    {
      $project: {
        text: 1,
        sourceDoc: 1,
        docId: 1,
        chunkIndex: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results;
}
