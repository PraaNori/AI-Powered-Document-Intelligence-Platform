import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

/**
 * Embeds an array of text strings. Batches in groups of 100 to stay under
 * API request limits — important once you're embedding thousands of chunks.
 */



console.log("embeddings.js OPENAI =", process.env.OPENAI_API_KEY);

export async function embedTexts(texts) {
  const BATCH_SIZE = 100;
  const vectors = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await client.embeddings.create({
      model: MODEL,
      input: batch,
    });
    vectors.push(...response.data.map((d) => d.embedding));
  }

  return vectors;
}

export async function embedQuery(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}
