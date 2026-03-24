import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWorksByAuthor } from '../api/works';
import WorkCard from '../components/WorkCard';
import type { Work } from '../types';

export default function ProfilePage() {
  const { authorId } = useParams();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorksByAuthor(Number(authorId))
      .then(setWorks)
      .finally(() => setLoading(false));
  }, [authorId]);

  const authorName = works[0]?.authorUsername;

  return (
    <div>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--purple)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28, marginBottom: 12
        }}>
          {authorName?.[0]?.toUpperCase() || '?'}
        </div>
        <h2 style={{ fontSize: 26 }}>@{authorName || '...'}</h2>
        {!loading && (
          <p className="muted" style={{ marginTop: 6 }}>
            {works.length} {works.length === 1 ? 'твір' : works.length < 5 ? 'твори' : 'творів'}
          </p>
        )}
      </div>

      {loading ? (
        <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Завантаження...</p>
      ) : works.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', padding: 40 }}>
          Автор ще не опублікував жодного твору
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {works.map(work => <WorkCard key={work.id} work={work} />)}
        </div>
      )}
    </div>
  );
}
