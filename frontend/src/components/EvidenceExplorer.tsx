import React from 'react';
import type { SourceExcerpt } from '../types';
import { ExternalLink, User, Clock, Bookmark } from 'lucide-react';

interface Props {
  sources: SourceExcerpt[];
  onSelectExcerpt?: (source: SourceExcerpt) => void;
}

export const EvidenceExplorer: React.FC<Props> = ({ sources, onSelectExcerpt }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{
      marginTop: '1rem',
      padding: '0.875rem 1rem',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      fontSize: '0.875rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem'
      }}>
        <Bookmark size={15} color="var(--accent-violet)" />
        <span>Traceable Evidence ({sources.length} sources cited)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sources.map((s, idx) => (
          <div
            key={s.chunk_id || idx}
            onClick={() => onSelectExcerpt && onSelectExcerpt(s)}
            style={{
              padding: '0.625rem 0.75rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              cursor: onSelectExcerpt ? 'pointer' : 'default',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{s.title}</span>
                {s.post_url && (
                  <a
                    href={s.post_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {s.speaker && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={11} /> {s.speaker}
                  </span>
                )}
                {s.timestamp && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={11} /> {s.timestamp}
                  </span>
                )}
              </div>
            </div>

            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontStyle: 'italic',
              lineHeight: 1.4
            }}>
              "{s.excerpt}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
