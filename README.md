# Lenny Growth Intelligence

**Lenny Growth Intelligence** is an evidence-first product strategy and growth intelligence workspace that enables founders, product managers, and growth leaders to extract grounded, traceable wisdom from Lenny Rachitsky's podcast transcripts and newsletter archives.

---

## Key Highlights & Feature Matrix

- **Landing Page & Authentication**:
  - Editorial public landing page introducing capabilities with zero-login discovery.
  - Secure bcrypt password hashing, JWT bearer authentication with session persistence.
  - Multi-user isolation: users only see and manage their own private conversations and saved artifacts.
- **Evidence-First Retrieval**:
  - Grounded against 60 indexed podcast transcripts and newsletter deep dives (**4,193 searchable chunks**).
  - Exact source attribution with verbatim speaker quotes, timestamps (`00:02:15`), episode titles, and episode URLs.
  - Standalone **Evidence Explorer** search interface to query transcripts independently of chat sessions.
- **Ship 30 for 30 Writing Studio**:
  - Dedicated writing studio to generate structured, ~1,250-word Atomic Essays.
  - Incorporates opening hooks, skimmable subheadings, short paragraphs, bold takeaways, and practical operator checklists.
- **Sandboxed Artifact Workspace**:
  - Generate, edit, preview, and download interactive HTML/CSS cards and Markdown documents.
  - Strictly isolated inside a sandboxed iframe (`sandbox="allow-scripts"`) blocking parent DOM access (`window.parent`) and credentials.
  - Complete artifact lifecycle: Save, Reopen, Edit source, Live Preview toggle, Copy, and Download.
- **Flexible Model Provider Router**:
  - Local inference via **Ollama** (`llama3.2`).
  - Cloud inference via **Anthropic Claude 3.5 Sonnet** and **OpenAI GPT-4o**.
  - Transparent error diagnostics when providers or keys are offline without breaking the application.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, `react-markdown`, `remark-gfm`, `lucide-react`.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy, `passlib`, `bcrypt`, `pyjwt`.
- **Database**: SQLite (default zero-config local persistence in `./data/lenny_growth.db`) or PostgreSQL / pgvector via Docker.
- **Testing**: `pytest`, `pytest-asyncio`, FastAPI `TestClient`.

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Ollama with `llama3.2` model (`ollama run llama3.2`)

### 1. Installation

```powershell
# 1. Backend environment setup
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:
```ini
PROJECT_NAME="Lenny Growth Intelligence"
DATABASE_URL="sqlite:///./data/lenny_growth.db"
SECRET_KEY="lenny-growth-dev-secret-key-change-in-production-2026"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

DEFAULT_PROVIDER="ollama"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3.2"

# Cloud AI Providers (Optional)
ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o"
```

### 3. Running the Application

**Terminal 1 — Backend API:**
```powershell
.\venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload --port 8000
```
*API documentation and OpenAPI schema available at `http://localhost:8000/docs`.*

**Terminal 2 — Frontend Application:**
```powershell
cd frontend
npm run dev
```
*Application available in browser at `http://localhost:5173`.*

---

## Automated Test Suite

Run the full pytest suite (health, BM25 retrieval, session isolation, artifact generation, authentication, and multi-user data boundaries):

```powershell
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend\tests\ -v
```

**Results:**
- `test_auth_registration_and_login`: **PASSED**
- `test_user_session_and_artifact_isolation`: **PASSED**
- `test_health`: **PASSED**
- `test_models_config`: **PASSED**
- `test_knowledge_status`: **PASSED**
- `test_search_knowledge`: **PASSED**
- `test_session_lifecycle_and_isolation`: **PASSED**
- `test_artifact_generation`: **PASSED**

---

## Running with Docker Compose

If Docker is available:
```bash
docker compose up --build
```
