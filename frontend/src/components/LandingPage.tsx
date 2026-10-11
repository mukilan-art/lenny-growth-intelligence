import React from 'react';
import { Sparkles, Database, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface Props {
  onSignIn: () => void;
  onGetStarted: () => void;
  docCount: number;
  chunkCount: number;
}

export const LandingPage: React.FC<Props> = ({ onSignIn, onGetStarted, docCount, chunkCount }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 3rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-violet)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.1rem'
          }}>
            L
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Lenny Growth Intelligence
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Evidence-First Product Strategy
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={onSignIn}
            style={{
              padding: '0.55rem 1.1rem',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: '0.55rem 1.25rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-violet)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', padding: '4.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#EEF2FF',
          color: 'var(--accent-violet)',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={14} />
          <span>Evidence-grounded across {docCount} transcripts & {chunkCount} indexed passages</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '3.5rem',
          fontWeight: 700,
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          marginBottom: '1.5rem',
          letterSpacing: '-0.03em'
        }}>
          Learn from world-class product operators with traceable evidence.
        </h1>

        <p style={{
          maxWidth: '720px',
          margin: '0 auto 2.5rem',
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          Lenny Growth Intelligence parses verbatim insights from founders and tech leaders like Adam Mosseri, Elena Verna, and Marc Andreessen. Ask tactical questions, inspect cited timestamps, and turn research into Ship 30 for 30 essays.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem' }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '0.85rem 2rem',
              backgroundColor: 'var(--text-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <span>Explore Workspace</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onSignIn}
            style={{
              padding: '0.85rem 1.75rem',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Existing Member Sign In
          </button>
        </div>

        {/* 3 Pillars Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#EEF2FF',
              color: 'var(--accent-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Database size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Traceable Evidence Explorer
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Zero hallucinated quotes. Every answer cites verbatim transcript excerpts, timestamps, and guest names directly from Lenny's archives.
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#ECFDF5',
              color: 'var(--accent-mint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <BookOpen size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Ship 30 for 30 Writing Studio
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Distill podcast research into high-signal, ~1,250-word Atomic Essays with hooks, skimmable headings, bold takeaways, and actionable playbooks.
            </p>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#FEF3C7',
              color: 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Layers size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Sandboxed Artifact Workspace
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Generate, edit, and preview interactive HTML/CSS strategy artifacts in an isolated sandbox with full edit and download workflows.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-card)'
      }}>
        Lenny Growth Intelligence — Built with FastAPI, SQLite/PostgreSQL, React, and Ollama/Claude
      </footer>
    </div>
  );
};
