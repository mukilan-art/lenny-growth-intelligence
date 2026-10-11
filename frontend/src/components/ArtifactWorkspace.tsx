import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Artifact } from '../types';
import { Code, Eye, Copy, Check, Download, ShieldCheck, X, Edit3, Save, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  artifact: Artifact | null;
  onClose: () => void;
  onArtifactUpdated?: (updated: Artifact) => void;
  onArtifactDeleted?: (id: string) => void;
}

export const ArtifactWorkspace: React.FC<Props> = ({
  artifact,
  onClose,
  onArtifactUpdated,
  onArtifactDeleted,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'edit'>('preview');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (artifact) {
      setEditContent(artifact.content);
      setEditTitle(artifact.title);
      setViewMode('preview');
      setError(null);
      setSaveSuccess(false);
      setShowDeleteConfirm(false);
    }
  }, [artifact]);

  if (!artifact) return null;

  // Process HTML content to inject client-side broken-image fallback guard in the iframe preview
  const getRenderContent = () => {
    if (artifact.content_type !== 'html') return artifact.content;
    
    const fallbackScript = `
      <style>
        img { max-width: 100%; height: auto; }
        .img-fallback-box {
          background: #F8FAFC;
          border: 2px dashed #CBD5E1;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          margin: 1rem 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      </style>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          document.querySelectorAll("img").forEach(function(img) {
            img.addEventListener("error", function() {
              var fallback = document.createElement("div");
              fallback.className = "img-fallback-box";
              fallback.innerHTML = '<div style="display:inline-block;background:#EEF2FF;color:#6366F1;padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;text-transform:uppercase;margin-bottom:0.4rem;">Visual Diagram</div><div style="font-weight:600;color:#1E293B;font-size:0.9rem;">' + (this.alt || "Framework Diagram") + '</div><p style="color:#64748B;font-size:0.8rem;margin-top:0.25rem;margin-bottom:0;">Diagram preview rendered without external assets.</p>';
              this.parentNode.replaceChild(fallback, this);
            });
            // Also trigger check if image already failed to load or has relative dummy path
            if (img.src && !img.src.startsWith("http") && !img.complete) {
              img.dispatchEvent(new Event("error"));
            }
          });
        });
      </script>
    `;

    if (artifact.content.includes('</body>')) {
      return artifact.content.replace('</body>', `${fallbackScript}</body>`);
    }
    return artifact.content + fallbackScript;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.content_type === 'html' ? 'html' : 'md';
    const blob = new Blob([artifact.content], {
      type: artifact.content_type === 'html' ? 'text/html' : 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateArtifact(artifact.id, {
        title: editTitle,
        content: editContent,
      });
      if (onArtifactUpdated) onArtifactUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setViewMode('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to save artifact updates.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteArtifact(artifact.id);
      if (onArtifactDeleted) onArtifactDeleted(artifact.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete artifact.');
    }
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
          {viewMode === 'edit' ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-card)'
              }}
            />
          ) : (
            <h3 style={{
              fontSize: '0.925rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}>
              {artifact.title}
            </h3>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {viewMode !== 'edit' ? (
            <>
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
                onClick={() => setViewMode('edit')}
                title="Edit Source"
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
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              title="Save Changes"
              style={{
                background: 'var(--accent-mint)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.35rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          )}

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
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Artifact"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.35rem',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={onClose}
            title="Close Panel"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.35rem',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          borderBottom: '1px solid #A7F3D0'
        }}>
          <Check size={14} color="#10B981" />
          <span>Artifact changes saved and updated successfully.</span>
        </div>
      )}

      {/* Delete Confirmation Modal / Banner */}
      {showDeleteConfirm && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#FEF2F2',
          borderBottom: '1px solid #FCA5A5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: '#B91C1C'
        }}>
          <span>Are you sure you want to delete this artifact?</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleDelete}
              style={{
                backgroundColor: '#DC2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#FEF2F2',
          color: '#B91C1C',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

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

      {/* View / Edit Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: viewMode === 'code' || viewMode === 'edit' ? '1rem' : '0' }}>
        {viewMode === 'preview' ? (
          artifact.content_type === 'html' ? (
            <iframe
              key={`iframe-${artifact.id}-${artifact.updated_at || ''}`}
              title="Artifact Preview"
              srcDoc={getRenderContent()}
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
        ) : viewMode === 'code' ? (
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
        ) : (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.825rem',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'none'
            }}
          />
        )}
      </div>
    </div>
  );
};
