import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.GENERATION_MODEL || "gpt-4o-mini";

/**
 * Generates an answer grounded in the retrieved context chunks.
 * Returns the raw answer text; caller attaches sources separately.
 */
export async function generateAnswer(question, contextChunks) {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] (source: ${c.sourceDoc})\n${c.text}`)
    .join("\n\n");

  const systemPrompt =
    "You are a helpful assistant answering questions using only the provided context. " +
    "If the answer isn't in the context, say you don't know — do not make things up. " +
    "Cite sources using [1], [2], etc. matching the context blocks.";

  const userPrompt = `Context:\n${context}\n\nQuestion: ${question}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
}
