import React, { useState } from 'react';
import { api } from '../api';
import type { Artifact } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PenTool, Sparkles, Copy, Check, Download, AlertCircle } from 'lucide-react';

interface Props {
  selectedProvider: string;
  onOpenArtifact?: (artifact: Artifact) => void;
}

export const WritingStudio: React.FC<Props> = ({ selectedProvider }) => {
  const [topic, setTopic] = useState('');
  const [speakerPreference, setSpeakerPreference] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [essayResult, setEssayResult] = useState<{
    id: string;
    topic: string;
    content: string;
    word_count: number;
    sources: any[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.generateEssay(
        topic,
        undefined,
        selectedProvider,
        speakerPreference || undefined,
        customInstructions || undefined
      );
      setEssayResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate essay. Please check provider connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!essayResult) return;
    navigator.clipboard.writeText(essayResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!essayResult) return;
    const blob = new Blob([essayResult.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ship30_essay_${essayResult.topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Configuration Column */}
      <div style={{
        width: '380px',
        borderRight: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-violet)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PenTool size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Writing Studio
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Ship 30 for 30 Atomic Essays (~1,250 words)
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Essay Topic or Core Question *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. How high-growth B2B startups structure product-led growth sales funnels"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-card)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Target Operator / Guest Preference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Elena Verna, Adam Mosseri, Marc Andreessen"
              value={speakerPreference}
              onChange={(e) => setSpeakerPreference(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-card)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Writing Instructions & Angle (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Focus specifically on early PLG traps and transition metrics for seed-stage teams"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                fontSize: '0.85rem',
                backgroundColor: 'var(--bg-card)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            padding: '0.75rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}>
            <strong>Ship 30 Principles Applied:</strong> 1-2 sentence compelling hook, skimmable subheadings, short paragraphs (1-3 sentences), bold takeaways, grounded quotes, and an actionable operator playbook.
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: 'var(--accent-violet)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !topic.trim() ? 0.6 : 1
            }}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Synthesizing Essay...' : 'Generate Essay'}</span>
          </button>
        </form>
      </div>

      {/* Essay Content Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-card)', overflow: 'hidden' }}>
        {/* Essay Header Bar */}
        <div style={{
          padding: '0.875rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Draft Essay Preview
            </span>
            {essayResult && (
              <span style={{
                marginLeft: '0.75rem',
                fontSize: '0.75rem',
                backgroundColor: '#EEF2FF',
                color: 'var(--accent-violet)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: 600
              }}>
                ~{essayResult.word_count} words
              </span>
            )}
          </div>

          {essayResult && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={14} color="var(--accent-mint)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} />
                <span>Download .md</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Essay Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          {essayResult ? (
            <div className="markdown-content" style={{ lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              <Markdown remarkPlugins={[remarkGfm]}>
                {essayResult.content}
              </Markdown>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <PenTool size={36} color="var(--border-strong)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Your Generated Essay Will Appear Here
              </h3>
              <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.875rem' }}>
                Enter your strategy topic on the left and Lenny Growth Intelligence will retrieve verbatim transcript evidence and craft a ~1,250-word Ship 30 for 30 essay.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
