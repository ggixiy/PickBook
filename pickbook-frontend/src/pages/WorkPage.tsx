import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWork, addComment, rateWork, deleteWork } from '../api/works';
import { useAuth } from '../context/AuthContext';
import type { Work, MusicMarker } from '../types';

declare const YT: any;

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

export default function WorkPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMarker, setCurrentMarker] = useState<MusicMarker | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);

  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerReadyRef = useRef(false);
  const activeMarkerRef = useRef<MusicMarker | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    getWork(Number(id))
      .then(setWork)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!work?.musicMarkers?.length) return;

    const initPlayer = () => {
      if (!playerDivRef.current || playerRef.current) return;
      playerRef.current = new YT.Player(playerDivRef.current, {
        height: '0', width: '0',
        playerVars: { autoplay: 0, controls: 0 },
        events: { onReady: () => { playerReadyRef.current = true; } },
      });
    };

    if (typeof YT !== 'undefined' && YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      playerReadyRef.current = false;
    };
  }, [work]);

  // Плавне затухання і зупинка
  const fadeOutAndStop = useCallback(() => {
    if (!playerRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    let vol = 100;
    fadeIntervalRef.current = setInterval(() => {
      vol -= 12;
      if (vol <= 0) {
        clearInterval(fadeIntervalRef.current!);
        playerRef.current?.stopVideo();
        playerRef.current?.setVolume(100);
        setCurrentMarker(null);
        setBannerVisible(false);
        activeMarkerRef.current = null;
      } else {
        playerRef.current?.setVolume(vol);
      }
    }, 60); // ~800ms загальний час затухання
  }, []);

  // Запуск треку
  const playMarker = useCallback((marker: MusicMarker) => {
    if (!playerRef.current || !playerReadyRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const videoId = extractYouTubeId(marker.musicUrl);
    if (!videoId) return;

    playerRef.current.setVolume(100);
    playerRef.current.loadVideoById({
      videoId,
      startSeconds: marker.startTime ?? 0,
      endSeconds: marker.endTime ?? undefined,
    });

    setCurrentMarker(marker);
    setBannerVisible(true);
    activeMarkerRef.current = marker;
  }, []);

  const handleScroll = useCallback(() => {
    if (!work?.musicMarkers?.length || !playerReadyRef.current) return;

    const screenMiddle = window.innerHeight / 2;
    const screenTop = 0;

    const markNodes = document.querySelectorAll('mark[data-marker-idx]');
    let bestMarker: MusicMarker | null = null;

    markNodes.forEach(node => {
      const rect = node.getBoundingClientRect();
      const markerIdx = parseInt(node.getAttribute('data-marker-idx') || '-1', 10);
      const m = work.musicMarkers![markerIdx];
      if (!m || !m.musicUrl) return;

      if (rect.top <= screenMiddle && rect.bottom >= screenTop) {
        bestMarker = m;
      }
    });

    if (bestMarker !== activeMarkerRef.current) {
      if (bestMarker === null) {
        fadeOutAndStop();
      } else {
        playMarker(bestMarker);
      }
    }
  }, [work, fadeOutAndStop, playMarker]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const stopMusic = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    playerRef.current?.stopVideo();
    playerRef.current?.setVolume(100);
    setCurrentMarker(null);
    setBannerVisible(false);
    activeMarkerRef.current = null;
  };

  // Рендер тексту — в режимі читання підсвічення лише коли музика грає для цієї зони
  const renderText = () => {
    if (!work) return null;
    const markers = work.musicMarkers;
    if (!markers?.length) return <>{work.content}</>;

    const sorted = [...markers].sort((a, b) => a.charPosition - b.charPosition);
    const segments: { text: string; markerIdx: number | null }[] = [];
    let lastPos = 0;

    sorted.forEach(m => {
      const originalIdx = markers.indexOf(m);
      const endPos = m.charPositionEnd ?? m.charPosition + 200;
      if (m.charPosition > lastPos) {
        segments.push({ text: work.content.slice(lastPos, m.charPosition), markerIdx: null });
      }
      segments.push({ text: work.content.slice(m.charPosition, endPos), markerIdx: originalIdx });
      lastPos = endPos;
    });
    if (lastPos < work.content.length) {
      segments.push({ text: work.content.slice(lastPos), markerIdx: null });
    }

    return (
      <>
        {segments.map((seg, i) => {
          if (seg.markerIdx === null) return <span key={i}>{seg.text}</span>;
          const marker = markers[seg.markerIdx];
          const isActive = currentMarker === marker;

          return (
            <mark
              key={i}
              data-marker-idx={seg.markerIdx}
              className={`editor-marker ${isActive ? 'editor-marker-active' : ''}`}
              style={{ color: 'inherit', padding: '0 2px' }}
            >
              {seg.text}
            </mark>
          );
        })}
      </>
    );
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
      <div ref={playerDivRef} style={{ display: 'none' }} />

      {/* Музичний банер з плавною появою/зникненням */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'var(--bg2)', border: '1px solid var(--purple)',
        borderRadius: 40, padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        zIndex: 200, boxShadow: '0 4px 24px rgba(139,92,246,0.3)',
        opacity: bannerVisible ? 1 : 0,
        pointerEvents: bannerVisible ? 'auto' : 'none',
        transition: 'opacity 0.6s ease',
      }}>
        <span style={{ fontSize: 18 }}>♪</span>
        <span style={{ fontSize: 14 }}>
          {currentMarker?.trackTitle || 'Зараз грає...'}
        </span>
        <button onClick={stopMusic}
          style={{ background: 'none', color: 'var(--text2)', padding: '0 4px', fontSize: 16 }}>
          ✕
        </button>
      </div>

      {/* Шапка */}
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
              ♪ {work.musicMarkers.length} {work.musicMarkers.length === 1 ? 'мітка' : 'мітки'}
            </span>
          ) : null}
          {work.averageRating ? (
            <span className="muted">★ {work.averageRating.toFixed(1)} ({work.ratingsCount})</span>
          ) : null}
        </div>

        {work.description && (
          <p style={{ color: 'var(--text2)', marginTop: 12, fontStyle: 'italic' }}>{work.description}</p>
        )}
        {work.musicMarkers?.length ? (
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            🎵 Музика вмикається автоматично під час читання
          </p>
        ) : null}
      </div>

      {/* Текст */}
      <div id="work-text" style={{
        fontFamily: 'Georgia, serif', fontSize: 18,
        lineHeight: 2, color: 'var(--text)',
        whiteSpace: 'pre-wrap', marginBottom: 48,
      }}>
        {renderText()}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 32 }} />

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

      <div>
        <h3 style={{ fontSize: 18, marginBottom: 20 }}>
          Коментарі {work.comments?.length ? `(${work.comments.length})` : ''}
        </h3>
        {user && (
          <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Поділіться враженнями..."
              style={{ minHeight: 80, marginBottom: 8, resize: 'vertical' }} />
            <button type="submit" className="btn-primary"
              disabled={submittingComment || !commentText.trim()}>
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
