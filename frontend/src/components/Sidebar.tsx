import React from 'react';
import type { Session, KnowledgeStats, ModelsConfig } from '../types';
import { MessageSquare, Plus, Trash2, Cpu, Database } from 'lucide-react';

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  stats: KnowledgeStats | null;
  modelsConfig: ModelsConfig | null;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
}

export const Sidebar: React.FC<Props> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  stats,
  modelsConfig,
  selectedProvider,
  onSelectProvider,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--accent-violet)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem'
        }}>
          L
        </div>
        <div>
          <h1 style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Lenny Growth
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Evidence Intelligence
          </p>
        </div>
      </div>

      {/* Action / New Research */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <button
          onClick={onNewSession}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.625rem',
            backgroundColor: 'var(--text-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
        >
          <Plus size={16} />
          <span>New Research Session</span>
        </button>
      </div>

      {/* Model Selector & Status */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
          <Cpu size={12} /> Model Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => onSelectProvider(e.target.value)}
          style={{
            width: '100%',
            padding: '0.4rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <option value="ollama">
            Ollama Local ({modelsConfig?.ollama?.status === 'connected' ? 'Connected' : 'Offline'})
          </option>
          <option value="anthropic">
            Claude 3.5 Sonnet ({modelsConfig?.anthropic?.status === 'configured' ? 'Configured' : 'Missing Key'})
          </option>
          <option value="openai">
            OpenAI GPT-4o ({modelsConfig?.openai?.status === 'configured' ? 'Configured' : 'Missing Key'})
          </option>
        </select>
      </div>

      {/* Session History List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem 0.5rem' }}>
          Research Sessions
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No sessions yet.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#E2E8F0' : 'transparent',
                  marginBottom: '0.2rem',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <MessageSquare size={14} color={isActive ? 'var(--accent-violet)' : 'var(--text-muted)'} />
                  <span style={{
                    fontSize: '0.825rem',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '160px'
                  }}>
                    {s.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                  title="Delete Session"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Knowledge Base Status Footer */}
      <div style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <Database size={13} color="var(--accent-mint)" />
          <span>Lenny Archive Knowledge Base</span>
        </div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{stats?.total_documents ?? 0} transcripts</span>
          <span>{stats?.total_chunks ?? 0} chunks</span>
        </div>
      </div>
    </aside>
  );
};
