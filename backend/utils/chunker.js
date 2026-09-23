/**
 * Splits text into overlapping chunks so retrieval can find precise, local context.
 * Character-based (simple, fast). Swap for a tokenizer-aware splitter later if needed.
 */
export function chunkText(text, chunkSize = 800, overlap = 150) {
  const chunks = [];
  const cleaned = text.trim();
  let start = 0;

  while (start < cleaned.length) {
    const end = start + chunkSize;
    const chunk = cleaned.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}
