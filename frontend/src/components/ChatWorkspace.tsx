import React, { useState, useRef, useEffect } from 'react';
import type { Message, Session } from '../types';
import { EvidenceExplorer } from './EvidenceExplorer';
import { Send, FileText, Layout, Copy, Check, Sparkles, User, Bot } from 'lucide-react';

interface Props {
  activeSession: Session | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  onGenerateEssay: (topic: string) => void;
  onGenerateArtifact: (content: string, type: 'html' | 'markdown', title: string) => void;
}

export const ChatWorkspace: React.FC<Props> = ({
  activeSession,
  messages,
  loading,
  onSendMessage,
  onGenerateEssay,
  onGenerateArtifact,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const content = input;
    setInput('');
    onSendMessage(content);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    "What did Adam Mosseri say about how AI impacts product teams?",
    "How does Elena Verna recommend scaling B2B product-led growth?",
    "What frameworks exist for determining true Product-Market Fit?",
    "What are the most common pricing and monetization mistakes for SaaS?"
  ];

  return (
    <div className="chat-panel">
      {/* Session Header */}
      <div className="header">
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            {activeSession ? activeSession.title : 'Research Workspace'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Grounding across 60 Lenny transcripts & newsletters
          </p>
        </div>

        {activeSession && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onGenerateEssay(activeSession.title)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <FileText size={14} color="var(--accent-violet)" />
              <span>Ship 30 Essay</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: '640px', margin: 'auto', textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#EEF2FF',
              color: 'var(--accent-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <Sparkles size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Lenny Growth Intelligence
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Explore tactical product advice, retention loops, and growth strategy grounded in verbatim podcast transcripts from world-class operators.
            </p>

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Suggested Research Questions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    style={{
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '80%' : '90%'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-violet)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div style={{
                  backgroundColor: isUser ? 'var(--text-primary)' : 'var(--bg-card)',
                  color: isUser ? '#ffffff' : 'var(--text-primary)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  lineHeight: 1.6,
                  fontSize: '0.925rem'
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>

                  {/* Grounded Evidence Sources */}
                  {!isUser && m.sources && m.sources.length > 0 && (
                    <EvidenceExplorer sources={m.sources} />
                  )}

                  {/* Actions for Assistant Messages */}
                  {!isUser && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.875rem',
                      paddingTop: '0.625rem',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {copiedId === m.id ? <Check size={13} color="var(--accent-mint)" /> : <Copy size={13} />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => onGenerateArtifact(m.content, 'html', 'Interactive Strategy Card')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: 'var(--accent-violet)'
                        }}
                      >
                        <Layout size={13} />
                        <span>Render HTML Artifact</span>
                      </button>

                      <button
                        onClick={() => onGenerateArtifact(m.content, 'markdown', 'Product Strategy Spec')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <FileText size={13} />
                        <span>Markdown Artifact</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#E2E8F0',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-violet)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={18} />
            </div>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              padding: '0.875rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>Retrieving knowledge and synthesizing evidence...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Ask any product, retention, or startup growth question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-strong)',
              fontSize: '0.925rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--accent-violet)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.925rem',
              fontWeight: 500,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.6 : 1,
              transition: 'opacity 0.15s ease'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
