import { useNavigate } from 'react-router-dom';
import type { Work } from '../types';

interface Props { work: Work; }

const GENRE_LABELS: Record<string, string> = {
  STORY: 'Оповідання', POEM: 'Поезія', ESSAY: 'Есе'
};

export default function WorkCard({ work }: Props) {
  const navigate = useNavigate();
  const stars = work.averageRating ? '★'.repeat(Math.round(work.averageRating)) : '';
  const hasMusic = work.musicMarkers && work.musicMarkers.length > 0;

  return (
    <div className="card" onClick={() => navigate(`/works/${work.id}`)}
      style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

      {/* Заголовок + жанр */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ fontSize: 18, fontFamily: 'Georgia, serif' }}>{work.title}</h3>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {hasMusic && (
            <span style={{
              background: 'rgba(139,92,246,0.15)', color: 'var(--purple)',
              fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.3)'
            }}>♪ музика</span>
          )}
          {work.genre && (
            <span style={{
              background: 'var(--bg3)', color: 'var(--text2)',
              fontSize: 11, padding: '2px 8px', borderRadius: 20
            }}>{GENRE_LABELS[work.genre] || work.genre}</span>
          )}
        </div>
      </div>

      {/* Превью тексту */}
      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12, lineHeight: 1.7 }}>
        {work.content}
      </p>

      {/* Автор + рейтинг */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="muted">@{work.authorUsername}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {stars && <span className="stars" style={{ fontSize: 13 }}>{stars}</span>}
          {work.averageRating && (
            <span className="muted">{work.averageRating.toFixed(1)} ({work.ratingsCount})</span>
          )}
        </div>
      </div>
    </div>
  );
}
