# Video Demonstration Script — Lenny Growth Intelligence
**Duration**: 2.5 minutes (150 seconds)
**Presenter**: Camera-enabled walk-through by candidate

---

### Segment 1: The Problem & The Solution (0:00 - 0:35)
**Visual**: Front screen of Lenny Growth Intelligence displaying the editorial interface, 60 indexed transcripts, and 4,193 searchable chunks.
**Script**:
"Hi, I'm presenting Lenny Growth Intelligence. Every product manager and founder wants to learn from Lenny Rachitsky's podcast guests like Adam Mosseri or Elena Verna. But raw transcripts are thousands of words long, and generic chatbots hallucinate quotes.
We built Lenny Growth Intelligence: an evidence-first strategy workspace where every answer is strictly grounded in verbatim podcast transcripts, with traceable timestamps and zero fabricated citations."

---

### Segment 2: Real Conversation with Evidence Grounding (0:35 - 1:15)
**Visual**: Type question into the chat workspace: *"What did Adam Mosseri say about how AI impacts product teams?"* Hit Enter.
**Script**:
"Watch as we submit this question. The backend queries our PostgreSQL/relational index of over 4,000 chunks. Notice the response: Adam Mosseri's exact insight on moving from 12-person baker's dozen teams to 4-to-6 person pods with generalist product staff is cited directly.
Underneath the answer, our Evidence Explorer displays the exact episode title, Adam's name, the timestamp, and the excerpt."

---

### Segment 3: Ship 30 for 30 Essay & Artifact Generation (1:15 - 1:55)
**Visual**: Click 'Ship 30 Essay' in the top header, then click 'Render HTML Artifact' on the assistant response. The sandboxed workspace opens on the right.
**Script**:
"With one click, we can transform this synthesis into a Ship 30 for 30 Atomic Essay. It formats the advice with a compelling hook, short scannable paragraphs, bold emphasis, and actionable checklists.
Furthermore, we can convert any research answer into an interactive HTML/CSS strategy card. Notice how it renders seamlessly in our sandboxed viewer. Because it runs in an iframe with strict sandbox flags, untrusted model HTML can never compromise the application DOM or access session tokens."

---

### Segment 4: Model Routing & Technical Trade-offs (1:55 - 2:30)
**Visual**: Show the model provider selector in the sidebar switching between Ollama Local, Anthropic Claude, and OpenAI.
**Script**:
"Our architecture features a clean model-provider router supporting local inference via Ollama or cloud models via Claude and OpenAI. If Ollama or an API key is missing, the system gracefully surfaces the diagnostics without crashing.
A key technical trade-off was indexing speed versus vector storage: we implemented BM25 term frequency with guest weighting directly over our chunks, providing sub-50ms search latency without external API dependencies.
Thank you!"
