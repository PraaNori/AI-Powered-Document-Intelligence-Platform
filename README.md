# MERN RAG System

A production-shaped RAG (Retrieval-Augmented Generation) pipeline built on
Express, MongoDB Atlas Vector Search, and React — the MERN port of the
original Python/FAISS prototype.

```
Load -> Chunk -> Embed -> Store (MongoDB) -> Retrieve ($vectorSearch) -> Generate (LLM)
```

## Stack

| Layer | Tech |
|---|---|
| API | Express (Node) |
| Storage + Vector Index | MongoDB Atlas (native `$vectorSearch`) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Generation | OpenAI `gpt-4o-mini` |
| Frontend | React + Vite |

## 1. Prerequisites

- Node.js 18+
- A **MongoDB Atlas** cluster (free tier works — vector search requires Atlas, not local MongoDB)
- An OpenAI API key

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: fill in MONGODB_URI and OPENAI_API_KEY
```

### Create the Atlas Vector Search index

This is the one manual step Atlas requires — it can't be done through Mongoose.

1. In Atlas, go to your cluster → **Search** tab → **Create Search Index**
2. Choose **Atlas Vector Search** → JSON editor
3. Select the `chunks` collection in your database
4. Use this index definition (name it exactly `vector_index` to match `services/retrieve.js`):

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

`numDimensions: 1536` matches `text-embedding-3-small`. If you swap embedding
models, update this number to match.

### Load the sample data

```bash
npm run ingest        # ingests every .txt file in backend/data/
```

Or start the server and upload files through the API / frontend instead.

### Start the API

```bash
npm run dev            # nodemon, auto-restart
# or
npm start
```

Server runs on `http://localhost:5000`.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`, proxying `/api` calls to the backend.

## 4. API reference

### `POST /api/documents`
Upload a `.txt` file (multipart form, field name `file`). Chunks, embeds, and
stores it — no full-index rebuild required.

### `GET /api/documents`
Lists indexed source documents with chunk counts.

### `DELETE /api/documents/:docId`
Removes all chunks belonging to a document.

### `POST /api/ask`
```json
{ "question": "How many paid leave days do employees get?" }
```
Returns:
```json
{
  "answer": "Employees are entitled to 20 paid leave days per year [1].",
  "sources": [
    { "sourceDoc": "company_policy.txt", "chunkIndex": 0, "score": 0.87, "preview": "..." }
  ]
}
```

## 5. What changed vs. the Python/FAISS version, and why

| Python/FAISS issue | MERN fix |
|---|---|
| `IndexFlatIP` does exhaustive search — slow at scale | Atlas Vector Search uses HNSW under the hood, built for production scale |
| No persistence, rebuilt index every run | MongoDB persists everything; nothing to rebuild |
| No incremental updates | `POST /api/documents` just inserts new chunks |
| CLI `input()` loop | Express `/api/ask` — real concurrent-user API |
| In-memory `self.chunks` list | Chunks + metadata live in MongoDB, shared across instances |
| Local `flan-t5-base` (weak answers) | Hosted `gpt-4o-mini` via API |

## 6. Scaling further

- Add auth + rate limiting (`express-rate-limit`) before exposing publicly
- Put Express behind a load balancer for multiple instances — MongoDB
  handles the shared state, so this is stateless-safe
- Add a `filters` field to chunks (e.g. department, doc type) and use Atlas
  Vector Search's pre-filtering to scope retrieval
- Cache embeddings for repeated questions if traffic is high
- Swap `gpt-4o-mini` for a larger model, or add a hosted API fallback, if
  answer quality needs to go up
