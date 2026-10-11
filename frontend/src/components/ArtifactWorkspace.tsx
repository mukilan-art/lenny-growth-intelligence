import React, { useState } from 'react';
import type { Artifact } from '../types';
import { Code, Eye, Copy, Check, Download, ShieldCheck, X } from 'lucide-react';

interface Props {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactWorkspace: React.FC<Props> = ({ artifact, onClose }) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.content_type === 'html' ? 'html' : 'md';
    const blob = new Blob([artifact.content], { type: artifact.content_type === 'html' ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="artifact-panel">
      {/* Header */}
      <div style={{
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.125rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: artifact.content_type === 'html' ? '#E0E7FF' : '#FEF3C7',
            color: artifact.content_type === 'html' ? '#4338CA' : '#B45309',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            {artifact.content_type}
          </span>
          <h3 style={{
            fontSize: '0.925rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '220px'
          }}>
            {artifact.title}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
            title={viewMode === 'preview' ? 'View Source Code' : 'View Preview'}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem'
            }}
          >
            {viewMode === 'preview' ? <Code size={14} /> : <Eye size={14} />}
            <span>{viewMode === 'preview' ? 'Code' : 'Preview'}</span>
          </button>

          <button
            onClick={handleCopy}
            title="Copy to Clipboard"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem'
            }}
          >
            {copied ? <Check size={14} color="var(--accent-mint)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download Artifact"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '0.35rem 0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.75rem'
            }}
          >
            <Download size={14} />
          </button>

          <button
            onClick={onClose}
            title="Close Panel"
            style={{
              background: 'none',
              border: 'none',
              borderRadius: '4px',
              padding: '0.35rem',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div style={{
        padding: '0.35rem 0.75rem',
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        color: '#64748B'
      }}>
        <ShieldCheck size={13} color="#10B981" />
        <span>Sandboxed Execution Context (`sandbox="allow-scripts"`)</span>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: viewMode === 'code' ? '1rem' : '0' }}>
        {viewMode === 'preview' ? (
          artifact.content_type === 'html' ? (
            <iframe
              title="Artifact Preview"
              srcDoc={artifact.content}
              sandbox="allow-scripts"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#FFFFFF'
              }}
            />
          ) : (
            <div style={{ padding: '1.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
              {artifact.content}
            </div>
          )
        ) : (
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            padding: '1rem',
            borderRadius: '6px',
            overflow: 'auto',
            height: '100%'
          }}>
            {artifact.content}
          </pre>
        )}
      </div>
    </div>
  );
};
