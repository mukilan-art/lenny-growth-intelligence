import type { Session, Message, KnowledgeStats, ModelsConfig, Artifact, User, AuthResponse } from './types';

const API_BASE = 'http://127.0.0.1:8000/api';

function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem('lenny_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- AUTHENTICATION ---
  async register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const data: AuthResponse = await res.json();
    sessionStorage.setItem('lenny_token', data.access_token);
    sessionStorage.setItem('lenny_user', JSON.stringify(data.user));
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid email or password');
    }
    const data: AuthResponse = await res.json();
    sessionStorage.setItem('lenny_token', data.access_token);
    sessionStorage.setItem('lenny_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    sessionStorage.removeItem('lenny_token');
    sessionStorage.removeItem('lenny_user');
  },

  async getMe(): Promise<User | null> {
    const token = sessionStorage.getItem('lenny_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        sessionStorage.removeItem('lenny_token');
        sessionStorage.removeItem('lenny_user');
        return null;
      }
      return res.json();
    } catch {
      return null;
    }
  },

  // --- SYSTEM & KNOWLEDGE ---
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

  async searchKnowledge(q: string, topK: number = 8) {
    const res = await fetch(`${API_BASE}/knowledge/search?q=${encodeURIComponent(q)}&top_k=${topK}`);
    return res.json();
  },

  // --- SESSIONS ---
  async listSessions(): Promise<Session[]> {
    const res = await fetch(`${API_BASE}/sessions`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createSession(title?: string): Promise<Session> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: title || 'New Research Session' }),
    });
    return res.json();
  },

  async deleteSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getMessages(sessionId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async sendMessage(sessionId: string, content: string, provider: string, model?: string): Promise<Message> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, provider, model }),
    });
    return res.json();
  },

  // --- WRITING STUDIO ---
  async generateEssay(topic: string, sessionId?: string, provider?: string, speakerPreference?: string, customInstructions?: string): Promise<{
    id: string;
    topic: string;
    content: string;
    word_count: number;
    sources: any[];
    artifact_id?: string;
  }> {
    const res = await fetch(`${API_BASE}/essay/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        topic,
        session_id: sessionId,
        provider,
        speaker_preference: speakerPreference,
        custom_instructions: customInstructions,
      }),
    });
    return res.json();
  },

  // --- ARTIFACTS ---
  async generateArtifact(content: string, formatType: 'html' | 'markdown' | 'essay', title: string, sessionId?: string, provider?: string): Promise<Artifact> {
    const res = await fetch(`${API_BASE}/artifacts/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, format_type: formatType, title, session_id: sessionId, provider }),
    });
    return res.json();
  },

  async listArtifacts(sessionId?: string): Promise<Artifact[]> {
    const url = sessionId ? `${API_BASE}/artifacts?session_id=${sessionId}` : `${API_BASE}/artifacts`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getArtifact(artifactId: string): Promise<Artifact> {
    const res = await fetch(`${API_BASE}/artifacts/${artifactId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async updateArtifact(artifactId: string, updates: { title?: string; content?: string; content_type?: string }): Promise<Artifact> {
    const res = await fetch(`${API_BASE}/artifacts/${artifactId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteArtifact(artifactId: string): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/artifacts/${artifactId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  }
};
