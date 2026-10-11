import React, { useState } from 'react';
import { api } from '../api';
import type { SourceExcerpt } from '../types';
import { Search, ExternalLink, User, Clock, Bookmark, AlertCircle, FileText } from 'lucide-react';

interface Props {
  onCiteExcerpt?: (source: SourceExcerpt) => void;
}

export const EvidenceExplorerPage: React.FC<Props> = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SourceExcerpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);
    setHasSearched(true);

    try {
      const data = await api.searchKnowledge(query, 12);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search knowledge base.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Adam Mosseri AI impact on team size",
    "Elena Verna B2B product-led growth",
    "Marc Andreessen product market fit",
    "Pricing mistakes and monetization strategies",
    "Retention curves and activation milestones"
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Search Header */}
      <div style={{
        padding: '2rem 3rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Bookmark size={20} color="var(--accent-violet)" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Evidence & Transcript Explorer
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Direct semantic and keyword search across 60 indexed transcripts, newsletters, and 4,193 searchable chunks with verbatim speaker quotes and timestamps.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by topic, keyword, or speaker (e.g. 'retention Elena Verna')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.925rem',
                  backgroundColor: 'var(--bg-primary)',
                  outline: 'none'
                }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '0.85rem' }} />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-violet)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !query.trim() ? 0.6 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search Archive'}
            </button>
          </form>

          {/* Quick Examples */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try queries:</span>
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sq);
                  api.searchKnowledge(sq, 12).then((d) => {
                    setResults(d.results || []);
                    setHasSearched(true);
                  });
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {hasSearched && (
            <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Found <strong>{results.length}</strong> matching transcript excerpts for "<strong>{query}</strong>":
            </div>
          )}

          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((r, idx) => (
                <div
                  key={r.chunk_id || idx}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', backgroundColor: '#EEF2FF', color: 'var(--accent-violet)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {r.doc_type}
                        </span>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                          {r.title}
                        </h3>
                        {r.post_url && (
                          <a
                            href={r.post_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                            title="Open original episode / newsletter"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.speaker && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User size={12} /> {r.speaker}
                        </span>
                      )}
                      {r.timestamp && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {r.timestamp}
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    backgroundColor: 'var(--bg-primary)',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    borderLeft: '3px solid var(--accent-violet)',
                    fontStyle: 'italic',
                    margin: '0.75rem 0 0.5rem'
                  }}>
                    "{r.full_content || r.excerpt}"
                  </p>
                </div>
              ))}
            </div>
          ) : hasSearched && !loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No direct transcript chunks found for this query.</p>
              <p style={{ fontSize: '0.85rem' }}>Try broadening your search terms or search by a guest speaker's name.</p>
            </div>
          ) : !hasSearched ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <FileText size={40} color="var(--border-strong)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Search Lenny's Entire Knowledge Base
              </h3>
              <p style={{ maxWidth: '440px', margin: '0 auto', fontSize: '0.875rem' }}>
                Enter a question or topic above to explore verbatim answers and traceable passages from high-impact product leaders.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
