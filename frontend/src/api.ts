import type { Session, Message, KnowledgeStats, ModelsConfig, Artifact } from './types';

const API_BASE = 'http://127.0.0.1:8000/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getModelsConfig(): Promise<ModelsConfig> {
    const res = await fetch(`${API_BASE}/config/models`);
    return res.json();
  },

  async getKnowledgeStats(): Promise<KnowledgeStats> {
    const res = await fetch(`${API_BASE}/knowledge/status`);
    return res.json();
  },

  async listSessions(): Promise<Session[]> {
    const res = await fetch(`${API_BASE}/sessions`);
    return res.json();
  },

  async createSession(title?: string): Promise<Session> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'New Research Session' }),
    });
    return res.json();
  },

  async deleteSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getMessages(sessionId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
    return res.json();
  },

  async sendMessage(sessionId: string, content: string, provider: string, model?: string): Promise<Message> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, provider, model }),
    });
    return res.json();
  },

  async generateEssay(topic: string, sessionId?: string, provider?: string): Promise<{
    topic: string;
    content: string;
    word_count: number;
    sources: any[];
    artifact_id?: string;
  }> {
    const res = await fetch(`${API_BASE}/essay/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, session_id: sessionId, provider }),
    });
    return res.json();
  },

  async generateArtifact(content: string, formatType: 'html' | 'markdown', title: string, sessionId?: string, provider?: string): Promise<Artifact> {
    const res = await fetch(`${API_BASE}/artifacts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format_type: formatType, title, session_id: sessionId, provider }),
    });
    return res.json();
  },

  async listArtifacts(sessionId?: string): Promise<Artifact[]> {
    const url = sessionId ? `${API_BASE}/artifacts?session_id=${sessionId}` : `${API_BASE}/artifacts`;
    const res = await fetch(url);
    return res.json();
  }
};
