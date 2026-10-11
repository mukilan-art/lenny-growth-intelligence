# Lenny Growth Intelligence

**Lenny Growth Intelligence** is an evidence-first product strategy and growth intelligence workspace that enables founders, product managers, and growth leaders to extract grounded, traceable wisdom from Lenny Rachitsky's podcast transcripts and newsletter archives.

---

## Key Highlights
- **Evidence-First Retrieval**: Answers cite verbatim quotes, episode names, speakers, timestamps, and episode URLs from 60 indexed podcast transcripts and newsletter deep dives (4,193 searchable chunks).
- **Session Isolation & State Management**: Independent research sessions stored with full lifecycle management in PostgreSQL / SQLite.
- **Ship 30 for 30 Essay Generation**: Specialized digital writing engine that transforms podcast evidence into a structured ~1,250-word atomic essay with hooks, scannable subheadings, bolded core takeaways, and source attribution.
- **Sandboxed Artifact Workspace**: Live rendering of generated interactive HTML/CSS cards, diagrams, and Markdown documents inside a strictly sandboxed `iframe` (`sandbox="allow-scripts"`).
- **Flexible Model Routing**: Dynamic switching between local inference via **Ollama** and cloud inference (**Claude 3.5 Sonnet**, **OpenAI GPT-4o**) with graceful fallback and missing-key validation.

---

## Architecture Overview

```
                      +-----------------------------+
                      | React (Vite + TypeScript)   |
                      |   - Evidence Explorer       |
                      |   - Ship 30 Essay Generator |
                      |   - Sandboxed IFrame Viewer |
                      +--------------+--------------+
                                     |  REST API
                                     v
                      +-----------------------------+
                      | FastAPI Backend Core        |
                      |   - BM25 & Semantic Matcher |
                      |   - Model Routing Engine    |
                      |   - Session & Artifact DB   |
                      +-------+--------------+------+
                              |              |
                +-------------+              +-------------+
                v                                          v
      +------------------+                       +-------------------+
      | Local / Cloud LLM|                       | Storage & Index   |
      | - Ollama (Local) |                       | - PostgreSQL / DB |
      | - Claude / GPT-4o|                       | - 4,193 Chunks    |
      +------------------+                       +-------------------+
```

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- (Optional) Docker & Docker Compose
- (Optional) Ollama with `llama3.2` model (`ollama pull llama3.2`)

### 1. Installation

Clone and install dependencies:
```bash
# 1. Backend setup
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Frontend setup
cd frontend
npm install
cd ..
```

### 2. Running Locally

**Terminal 1 — Backend:**
```bash
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload --port 8000
```
*API and Swagger documentation will be accessible at `http://localhost:8000/docs`.*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
*Frontend interface will be available at `http://localhost:5173`.*

---

## Running with Docker Compose
If Docker is installed on your system:
```bash
docker compose up --build
```
This boots:
1. `pgvector/pgvector:pg16` database container on port `5432`
2. FastAPI backend on port `8000`
3. React production build preview on port `5173`

---

## Testing

Run the automated backend test suite:
```powershell
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend\tests\test_backend.py -v
```

Verifies:
- Health and database connection checks
- Model configuration detection
- Knowledge base indexing statistics
- Search retrieval and relevance scoring
- Multi-session lifecycle and strict session isolation
- Artifact rendering and fallback resilience

---

## Model Provider Configuration

Configure `.env`:
```ini
DEFAULT_PROVIDER="ollama"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.2"

# Cloud Providers (Optional)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
```
