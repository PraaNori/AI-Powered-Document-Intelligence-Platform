import mongoose from "mongoose";

/**
 * Each document = one chunk of text + its embedding vector + metadata.
 * The `embedding` field is indexed by an Atlas Vector Search index (created
 * separately in the Atlas UI or via the Atlas Admin API — see README).
 */
const chunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], required: true }, // length must match EMBEDDING_MODEL dims
    sourceDoc: { type: String, required: true },     // original filename
    docId: { type: String, required: true, index: true }, // groups chunks back to parent doc
    chunkIndex: { type: Number, required: true },    // position within the source doc
  },
  { timestamps: true }
);

export default mongoose.model("Chunk", chunkSchema);
