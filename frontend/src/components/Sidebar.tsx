import React from 'react';
import type { Session, KnowledgeStats, ModelsConfig, User, Artifact } from '../types';
import { MessageSquare, Plus, Trash2, Cpu, Database, PenTool, Search, Layers, LogOut, LogIn } from 'lucide-react';

interface Props {
  user: User | null;
  activeTab: 'chat' | 'writing' | 'evidence';
  onSelectTab: (tab: 'chat' | 'writing' | 'evidence') => void;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  savedArtifacts: Artifact[];
  onOpenArtifact: (artifact: Artifact) => void;
  stats: KnowledgeStats | null;
  modelsConfig: ModelsConfig | null;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<Props> = ({
  user,
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  savedArtifacts,
  onOpenArtifact,
  stats,
  modelsConfig,
  selectedProvider,
  onSelectProvider,
  onLogout,
  onOpenAuth,
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
            Lenny Growth Intelligence
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Evidence-First Strategy
          </p>
        </div>
      </div>

      {/* Navigation Modules */}
      <div style={{ padding: '0.75rem 0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => onSelectTab('chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'chat' ? '#E2E8F0' : 'transparent',
            color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'chat' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <MessageSquare size={15} color={activeTab === 'chat' ? 'var(--accent-violet)' : 'inherit'} />
          <span>Research Chat</span>
        </button>

        <button
          onClick={() => onSelectTab('writing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'writing' ? '#E2E8F0' : 'transparent',
            color: activeTab === 'writing' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'writing' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <PenTool size={15} color={activeTab === 'writing' ? 'var(--accent-violet)' : 'inherit'} />
          <span>Writing Studio (Ship 30)</span>
        </button>

        <button
          onClick={() => onSelectTab('evidence')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'evidence' ? '#E2E8F0' : 'transparent',
            color: activeTab === 'evidence' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'evidence' ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Search size={15} color={activeTab === 'evidence' ? 'var(--accent-violet)' : 'inherit'} />
          <span>Evidence Explorer</span>
        </button>
      </div>

      {/* Action / New Research */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <button
          onClick={() => {
            onSelectTab('chat');
            onNewSession();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.55rem',
            backgroundColor: 'var(--text-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <Plus size={15} />
          <span>New Research Chat</span>
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

      {/* Scrollable Center: Sessions & Saved Artifacts */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
        {/* Sessions Section */}
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem 0.35rem' }}>
          Recent Conversations
        </div>

        {sessions.length === 0 ? (
          <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No conversations yet.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId && activeTab === 'chat';
            return (
              <div
                key={s.id}
                onClick={() => {
                  onSelectTab('chat');
                  onSelectSession(s.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#E2E8F0' : 'transparent',
                  marginBottom: '0.15rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                  <MessageSquare size={13} color={isActive ? 'var(--accent-violet)' : 'var(--text-muted)'} />
                  <span style={{
                    fontSize: '0.8rem',
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
                    padding: '0.2rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}

        {/* Saved Artifacts Section */}
        {savedArtifacts.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem 0.35rem' }}>
              Saved Artifacts ({savedArtifacts.length})
            </div>
            {savedArtifacts.map((art) => (
              <div
                key={art.id}
                onClick={() => onOpenArtifact(art)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <Layers size={13} color="var(--accent-amber)" />
                <span style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px'
                }}>
                  {art.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile & Auth Footer */}
      <div style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)'
      }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.display_name || user.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.email}
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.35rem',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.5rem',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <LogIn size={14} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>

      {/* Knowledge Base Status Bar */}
      <div style={{
        padding: '0.625rem 1rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '0.725rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
          <Database size={12} color="var(--accent-mint)" />
          <span>Lenny Archive Knowledge</span>
        </div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{stats?.total_documents ?? 0} transcripts</span>
          <span>{stats?.total_chunks ?? 0} chunks</span>
        </div>
      </div>
    </aside>
  );
};
