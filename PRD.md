# Product Requirements Document (PRD) — Lenny Growth Intelligence

## 1. Executive Summary & Problem
Product managers, founders, and growth leads consistently struggle to translate high-level business advice into concrete, defensible tactics. While Lenny Rachitsky has interviewed hundreds of elite tech leaders (Adam Mosseri, Elena Verna, Marc Andreessen, Keith Rabois), this wisdom remains trapped in hours of audio and extensive text files.

**Lenny Growth Intelligence** unlocks this repository by providing:
1. Verbatim quote grounding and source attribution.
2. Independent session-based product strategy chats.
3. Rapid transformation of insights into Ship 30 for 30 atomic essays (~1,250 words).
4. Direct in-app rendering of HTML/CSS artifacts and Markdown specifications in a sandboxed viewer.

---

## 2. Target Users & Personas
- **Early-Stage Founders**: Need rapid validation on product-market fit milestones, retention benchmarks, and launch loops.
- **Product Managers**: Looking for canonical frameworks on team topologies, feature deprecation, and AI tool adoption.
- **Growth Engineers**: Seeking PLG loops, viral coefficients, and monetization pricing strategies.

---

## 3. Success Metrics
- **Retrieval Precision**: 100% of grounded assertions cite real transcript passages, episode titles, speakers, and timestamps.
- **Zero Hallucination Attribution**: Never invent fake episode titles or fabricated guest quotes.
- **Session Isolation**: 100% message separation across distinct user research sessions.
- **Performance**: Sub-100ms retrieval query response time over 4,000+ indexed chunks.

---

## 4. Key Scope & Functional Requirements

### 4.1 Knowledge Base & Retrieval
- Ingest all markdown transcripts in `transcripts_repo/podcasts` and `transcripts_repo/newsletters`.
- Extract frontmatter metadata: title, guest, date, post_url, word count.
- Split text into sliding overlapping chunks (250 words, 50-word overlap) preserving speaker names and timestamps.
- Index in relational storage (PostgreSQL / SQLite) with BM25 term weighting.

### 4.2 AI Chat & Model Switching
- Dynamic provider configuration: Ollama (local), Anthropic Claude, OpenAI.
- Transparent status reporting when providers are offline or missing credentials.

### 4.3 Ship 30 for 30 Writing Engine
- Transform insights into structured 1,200–1,400 word essays.
- Must include hook, subheadings, bullet lists, bolded concepts, and actionable PM takeaways.

### 4.4 Sandboxed Artifact Workspace
- Render HTML/CSS components and Markdown docs in an isolated iframe (`sandbox="allow-scripts"`).
- Provide code vs. preview toggles, clipboard copy, and one-click file download.
