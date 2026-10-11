# Architecture Document — Lenny Growth Intelligence

## 1. System Architecture

```
[ Frontend: React 19 + TypeScript + Vite ]
       |
       | REST / JSON
       v
[ Backend API: FastAPI + Python 3.13 ]
  |-- Router: /api/health, /api/sessions, /api/knowledge, /api/essay, /api/artifacts
  |-- Ingestion Engine: Frontmatter parser + Overlapping Chunker (250w / 50w)
  |-- Retrieval Engine: BM25 Term Relevance + Guest/Episode Weighting
  |-- Model Provider Router: Ollama, Anthropic Claude, OpenAI
  v
[ Data & Storage ]
  |-- PostgreSQL (via pgvector/pg16 in Docker) / SQLite Fallback
  |   + sessions (UUID, title, timestamps)
  |   + messages (UUID, role, content, sources_json)
  |   + artifacts (UUID, content_type, content)
  |   + transcript_documents (id, title, guest, word_count)
  |   + transcript_chunks (id, speaker, timestamp, content)
```

## 2. Evidence Grounding & Traceability Flow
1. User submits query (e.g., "What did Adam Mosseri say about AI in product teams?").
2. `RetrievalService` tokenizes query, searches indexed `transcript_chunks` with BM25 term weighting, and ranks candidate passages.
3. Top relevant passages are extracted with speaker names, episode titles, timestamps, and episode URLs.
4. Prompt is synthesized with retrieved context and dispatched to the active provider (e.g. Ollama `llama3.2`).
5. Assistant response and structured citations are saved transactionally and rendered in `EvidenceExplorer`.

## 3. Sandboxed Artifact Security Model
Untrusted or generated HTML/CSS is isolated from the application context:
- Rendered inside an `<iframe sandbox="allow-scripts" srcDoc={content} />`.
- Disallows `allow-same-origin`, preventing access to cookies, parent DOM (`window.parent`), and host local storage.
- Eliminates Cross-Site Scripting (XSS) risks while enabling rich interactive visual previews.
