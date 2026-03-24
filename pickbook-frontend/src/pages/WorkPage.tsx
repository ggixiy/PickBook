import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWork, addComment, rateWork, deleteWork } from '../api/works';
import { useAuth } from '../context/AuthContext';
import type { Work, MusicMarker } from '../types';

// Оголошуємо глобальний YT який завантажується через script tag в index.html
declare const YT: any;

export default function WorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthor } = useAuth();

  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  // Стан музичного плеєра
  const [currentMarker, setCurrentMarker] = useState<MusicMarker | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);

  // Коментарі
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Рейтинг
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    getWork(Number(id))
      .then(setWork)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  // Ініціалізуємо YouTube плеєр після завантаження твору
  useEffect(() => {
    if (!work || !work.musicMarkers?.length) return;

    const initPlayer = () => {
      if (!playerDivRef.current) return;
      playerRef.current = new YT.Player(playerDivRef.current, {
        height: '0', width: '0', // Прихований плеєр
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: () => setPlayerReady(true),
        },
      });
    };

    // YT може ще не бути завантажений
    if (typeof YT !== 'undefined' && YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      playerRef.current?.destroy();
    };
  }, [work]);

  // Слідкуємо за скролом і запускаємо музику в потрібний момент
  const handleScroll = useCallback(() => {
    if (!work?.musicMarkers?.length || !playerReady) return;

    // Знаходимо який символ зараз приблизно видно на екрані
    const textEl = document.getElementById('work-text');
    if (!textEl) return;

    const textRect = textEl.getBoundingClientRect();
    const screenCenter = window.innerHeight / 2;
    const relativePos = screenCenter - textRect.top;
    const charWidth = textEl.scrollWidth / (work.content.length || 1);
    const lineHeight = 32; // px
    const charsPerLine = Math.floor(textEl.clientWidth / (charWidth * 6));
    const linesScrolled = relativePos / lineHeight;
    const approxCharPos = Math.floor(linesScrolled * charsPerLine);

    // Знаходимо найближчу мітку яку ще не відтворювали
    const triggered = work.musicMarkers
      .filter(m => m.charPosition <= approxCharPos)
      .sort((a, b) => b.charPosition - a.charPosition)[0];

    if (triggered && triggered !== currentMarker) {
      setCurrentMarker(triggered);
      playYouTube(triggered.musicUrl);
    }
  }, [work, playerReady, currentMarker]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const playYouTube = (url: string) => {
    if (!playerRef.current) return;
    // Витягуємо video ID з URL
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    if (match) {
      playerRef.current.loadVideoById(match[1]);
    }
  };

  const stopMusic = () => {
    playerRef.current?.stopVideo();
    setCurrentMarker(null);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await addComment(Number(id), commentText);
      setWork(w => w ? { ...w, comments: [comment, ...(w.comments || [])] } : w);
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRate = async (score: number) => {
    setMyRating(score);
    await rateWork(Number(id), score);
    const updated = await getWork(Number(id));
    setWork(updated);
  };

  const handleDelete = async () => {
    if (!confirm('Видалити цей твір?')) return;
    await deleteWork(Number(id));
    navigate('/');
  };

  if (loading) return <p className="muted" style={{ textAlign: 'center', padding: 60 }}>Завантаження...</p>;
  if (!work) return null;

  const isOwner = user?.username === work.authorUsername;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Прихований YouTube плеєр */}
      <div ref={playerDivRef} style={{ display: 'none' }} />

      {/* Музичний банер — з'являється коли грає музика */}
      {currentMarker && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg2)', border: '1px solid var(--purple)',
          borderRadius: 40, padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 200, boxShadow: '0 4px 24px rgba(139,92,246,0.3)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: 18 }}>♪</span>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>
            {currentMarker.trackTitle || 'Зараз грає...'}
          </span>
          <button onClick={stopMusic}
            style={{ background: 'none', color: 'var(--text2)', padding: '0 4px', fontSize: 16 }}>
            ✕
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>

      {/* Шапка твору */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 36, lineHeight: 1.3, marginBottom: 12 }}>{work.title}</h1>
          {isOwner && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => navigate(`/editor/${work.id}`)}>Редагувати</button>
              <button style={{ background: 'rgba(249,112,102,0.15)', color: 'var(--coral)', padding: '6px 12px', fontSize: 13, borderRadius: 8 }}
                onClick={handleDelete}>Видалити</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to={`/profile/${work.authorId}`} className="muted">@{work.authorUsername}</Link>
          {work.genre && <span className="muted">· {work.genre}</span>}
          {work.musicMarkers?.length ? (
            <span style={{ color: 'var(--purple)', fontSize: 13 }}>
              ♪ {work.musicMarkers.length} муз. {work.musicMarkers.length === 1 ? 'мітка' : 'мітки'}
            </span>
          ) : null}
          {work.averageRating && (
            <span className="muted">★ {work.averageRating.toFixed(1)} ({work.ratingsCount})</span>
          )}
        </div>

        {work.description && (
          <p style={{ color: 'var(--text2)', marginTop: 12, fontStyle: 'italic' }}>{work.description}</p>
        )}

        {work.musicMarkers?.length ? (
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            🎵 Музика почнеться автоматично під час читання
          </p>
        ) : null}
      </div>

      {/* Текст твору */}
      <div id="work-text" style={{
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        lineHeight: 2,
        color: 'var(--text)',
        whiteSpace: 'pre-wrap',
        marginBottom: 48,
      }}>
        {work.content}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 32 }} />

      {/* Оцінка */}
      {user && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Ваша оцінка</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: 'none', fontSize: 28, padding: '0 2px',
                  color: star <= (hoverRating || myRating) ? '#f59e0b' : 'var(--border)',
                  transition: 'color 0.1s'
                }}>★</button>
            ))}
          </div>
        </div>
      )}

      {/* Коментарі */}
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>
          Коментарі {work.comments?.length ? `(${work.comments.length})` : ''}
        </h3>

        {user && (
          <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Поділіться враженнями..."
              style={{ minHeight: 80, marginBottom: 8, resize: 'vertical' }} />
            <button type="submit" className="btn-primary" disabled={submittingComment || !commentText.trim()}>
              {submittingComment ? 'Відправка...' : 'Коментувати'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {work.comments?.map(c => (
            <div key={c.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>@{c.username}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(c.createdAt).toLocaleDateString('uk-UA')}
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{c.text}</p>
            </div>
          ))}
          {!work.comments?.length && (
            <p className="muted" style={{ textAlign: 'center', padding: 24 }}>
              Коментарів ще немає. Будьте першим!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
