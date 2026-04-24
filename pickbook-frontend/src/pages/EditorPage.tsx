import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createWork, updateWork, getWork } from '../api/works';
import type { MusicMarker } from '../types';

declare const YT: any;

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

// Перетворює секунди в "хв:сек"
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Парсить "хв:сек" або просто секунди в число
function parseTime(value: string): number | undefined {
  if (!value.trim()) return undefined;
  if (value.includes(':')) {
    const [m, s] = value.split(':').map(Number);
    return m * 60 + (s || 0);
  }
  const n = parseInt(value);
  return isNaN(n) ? undefined : n;
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('STORY');
  const [markers, setMarkers] = useState<MusicMarker[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Music Player State
  const [currentMarker, setCurrentMarker] = useState<MusicMarker | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const playerRef = useRef<any>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerReadyRef = useRef(false);
  const activeMarkerRef = useRef<MusicMarker | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (id) {
      getWork(Number(id)).then(work => {
        setTitle(work.title);
        setContent(work.content);
        setDescription(work.description || '');
        setGenre(work.genre || 'STORY');
        setMarkers(work.musicMarkers || []);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!markers?.length) return;

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
  }, [markers]);

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
    }, 60);
  }, []);

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

  const stopMusic = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    playerRef.current?.stopVideo();
    playerRef.current?.setVolume(100);
    setCurrentMarker(null);
    setBannerVisible(false);
    activeMarkerRef.current = null;
  };

  const checkMusicScroll = useCallback(() => {
    if (!markers?.length || !playerReadyRef.current || !backdropRef.current) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const textareaRect = textarea.getBoundingClientRect();
    const screenMiddle = textareaRect.top + textareaRect.height / 2;
    const screenTop = textareaRect.top;

    const markNodes = backdropRef.current.querySelectorAll('mark[data-marker-idx]');
    let bestMarker: MusicMarker | null = null;
    let foundActiveId: number | null = null;

    markNodes.forEach(node => {
      const rect = node.getBoundingClientRect();
      const markerIdx = parseInt(node.getAttribute('data-marker-idx') || '-1', 10);
      const m = markers[markerIdx];
      if (!m || !m.musicUrl) return;

      if (rect.top <= screenMiddle && rect.bottom >= screenTop) {
        bestMarker = m;
        foundActiveId = markerIdx;
      }
    });

    if (bestMarker !== activeMarkerRef.current) {
      if (bestMarker === null) {
        fadeOutAndStop();
      } else {
        playMarker(bestMarker);
      }
    }
    setActiveMarkerId(foundActiveId);
  }, [markers, fadeOutAndStop, playMarker]);

  useEffect(() => {
    // В редакторі слухаємо скрол самого текстового поля
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.addEventListener('scroll', checkMusicScroll, { passive: true });
        return () => textarea.removeEventListener('scroll', checkMusicScroll);
    }
  }, [checkMusicScroll]);

  // Також перевіряємо при загальному скролі вікна
  useEffect(() => {
    window.addEventListener('scroll', checkMusicScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkMusicScroll);
  }, [checkMusicScroll]);

  const onTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    checkMusicScroll();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;
    const cursorEnd = e.target.selectionEnd;

    const diff = newContent.length - oldContent.length;

    if (diff !== 0) {
      const changePos = diff > 0 ? cursorEnd - diff : cursorEnd;

      setMarkers(prev => prev.map(m => {
        let newStart = m.charPosition;
        let newEnd = m.charPositionEnd ?? (m.charPosition + 50);

        if (changePos <= newStart) {
          newStart += diff;
          newEnd += diff;
        } else if (changePos > newStart && changePos <= newEnd) {
          newEnd += diff;
        }

        return {
          ...m,
          charPosition: Math.max(0, newStart),
          charPositionEnd: Math.max(0, newEnd)
        };
      }));
    }

    setContent(newContent);
    setTimeout(checkMusicScroll, 0);
  };

  // Додаємо мітку на виділений фрагмент
  const addMarker = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const actualEnd = end > start ? end : Math.min(start + 50, content.length);

    // Перевіряємо, чи немає мітки, яка перекриває цей діапазон
    const isOverlapping = markers.some(m => {
      const mEnd = m.charPositionEnd ?? m.charPosition + 50;
      return (start < mEnd && actualEnd > m.charPosition);
    });

    if (isOverlapping) {
        alert("Мітки не можуть перекривати одна одну!");
        return;
    }

    setMarkers(m => [...m, {
      charPosition: start,
      charPositionEnd: actualEnd,
      musicUrl: '',
      trackTitle: '',
      startTime: undefined,
      endTime: undefined,
    }]);
    setTimeout(() => ta.focus(), 0);
  };

  const updateMarker = (i: number, field: keyof MusicMarker, value: any) => {
    setMarkers(m => m.map((marker, idx) => idx === i ? { ...marker, [field]: value } : marker));
  };

  const removeMarker = (i: number) => {
    setMarkers(m => m.filter((_, idx) => idx !== i));
    setTimeout(checkMusicScroll, 0);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Заповніть заголовок та текст');
      return;
    }
    const validMarkers = markers.filter(m => m.musicUrl.trim());
    setSaving(true);
    setError('');
    try {
      const payload = { title, content, description, genre, musicMarkers: validMarkers };
      const work = isEdit
        ? await updateWork(Number(id), payload)
        : await createWork(payload);
      navigate(`/works/${work.id}`);
    } catch {
      setError('Не вдалось зберегти. Перевірте дані.');
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...markers].sort((a, b) => a.charPosition - b.charPosition);

  // Resize handler for dragging markers
  const [resizing, setResizing] = useState<{ idx: number, type: 'start' | 'end', startX: number, startChar: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, markerIdx: number, type: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    const marker = markers[markerIdx];
    setResizing({
      idx: markerIdx,
      type,
      startX: e.clientX,
      startChar: type === 'start' ? marker.charPosition : (marker.charPositionEnd ?? marker.charPosition + 50)
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing || !textareaRef.current) return;

      const diffX = e.clientX - resizing.startX;
      // Приблизна оцінка: 1 символ ~ 8 пікселів ширини (дуже грубо, але дозволяє змінити розмір)
      const charsDiff = Math.round(diffX / 8);

      setMarkers(prev => prev.map((m, i) => {
        if (i !== resizing.idx) return m;

        let newStart = m.charPosition;
        let newEnd = m.charPositionEnd ?? (m.charPosition + 50);

        if (resizing.type === 'start') {
          newStart = Math.max(0, resizing.startChar + charsDiff);
          if (newStart >= newEnd) newStart = newEnd - 1; // Запобігаємо схрещуванню
        } else {
          newEnd = Math.min(content.length, resizing.startChar + charsDiff);
          if (newEnd <= newStart) newEnd = newStart + 1;
        }

        // Перевірка на перекриття з іншими мітками (спрощена)
        const isOverlapping = prev.some((otherM, otherI) => {
          if (otherI === i) return false;
          const otherEnd = otherM.charPositionEnd ?? otherM.charPosition + 50;
          return (newStart < otherEnd && newEnd > otherM.charPosition);
        });

        if (isOverlapping) {
           return m; // Відхиляємо зміну
        }

        return { ...m, charPosition: newStart, charPositionEnd: newEnd };
      }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, content.length]);


  const renderHighlightedText = () => {
    if (!content) return null;

    const validMarkers = sorted.filter(m => m.charPositionEnd !== undefined && m.charPositionEnd > m.charPosition);
    if (!validMarkers.length) return <span>{content}</span>;

    const segments: { text: string; markerIdx: number | null }[] = [];
    let lastPos = 0;

    validMarkers.forEach((m) => {
      const originalIdx = markers.indexOf(m);
      if (m.charPosition > lastPos) {
        segments.push({ text: content.slice(lastPos, m.charPosition), markerIdx: null });
      }
      segments.push({ text: content.slice(m.charPosition, m.charPositionEnd), markerIdx: originalIdx });
      lastPos = m.charPositionEnd!;
    });
    if (lastPos < content.length) {
      segments.push({ text: content.slice(lastPos), markerIdx: null });
    }

    return (
      <>
        {segments.map((seg, i) =>
          seg.markerIdx !== null ? (
            <mark
              key={i}
              data-marker-idx={seg.markerIdx}
              className={`editor-marker ${activeMarkerId === seg.markerIdx ? 'editor-marker-active' : ''}`}
              style={{ color: 'transparent', position: 'relative', display: 'inline', padding: '2px 0' }}
              onClick={() => {
                // Scroll to the marker config card
                const el = document.getElementById(`marker-config-${seg.markerIdx}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              {seg.text}
              {/* Resize handles */}
              <span
                style={{
                  position: 'absolute', top: 0, bottom: 0, left: '-2px', width: '6px', cursor: 'ew-resize', pointerEvents: 'auto', zIndex: 10
                }}
                onMouseDown={(e) => handleResizeStart(e, seg.markerIdx!, 'start')}
              />
              <span
                style={{
                  position: 'absolute', top: 0, bottom: 0, right: '-2px', width: '6px', cursor: 'ew-resize', pointerEvents: 'auto', zIndex: 10
                }}
                onMouseDown={(e) => handleResizeStart(e, seg.markerIdx!, 'end')}
              />
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </>
    );
  };

  const sharedStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: 15,
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    padding: '14px',
    margin: 0,
    border: 'none',
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div ref={playerDivRef} style={{ display: 'none' }} />

      {/* Music Banner */}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 26 }}>{isEdit ? 'Редагувати твір' : 'Новий твір'}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={() => navigate(-1)}>Скасувати</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Збереження...' : '💾 Зберегти'}
          </button>
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Назва твору..." style={{ fontSize: 22, padding: '12px 16px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            <option value="STORY">Оповідання</option>
            <option value="POEM">Поезія</option>
            <option value="ESSAY">Есе</option>
          </select>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Короткий опис (необов'язково)" />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="muted">Текст твору</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="muted" style={{ fontSize: 11 }}>виділіть текст →</span>
              <button className="btn-ghost" onClick={addMarker} style={{ fontSize: 11, padding: '3px 10px' }}>
                ♪ прикріпити музику
              </button>
            </div>
          </div>

          <div style={{
            position: 'relative',
            height: 500,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--bg2)',
          }}>
            <div
              ref={backdropRef}
              style={{
                ...sharedStyle,
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                color: 'transparent',
                pointerEvents: 'none',
                overflowY: 'auto',
                overflowX: 'hidden',
                zIndex: 0
              }}
              aria-hidden="true"
            >
              {renderHighlightedText()}
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onScroll={onTextareaScroll}
              placeholder="Почніть писати... Виділіть фрагмент тексту і натисніть '♪ прикріпити музику'"
              style={{
                ...sharedStyle,
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                resize: 'none',
                background: 'transparent',
                color: 'var(--text)',
                outline: 'none',
                overflowY: 'auto',
                overflowX: 'hidden',
                zIndex: 1,
                caretColor: 'var(--text)'
              }}
            />
          </div>
          <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>{content.length} символів</p>
        </div>

        {markers.length > 0 && (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>🎵 Музичні мітки ({markers.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((m, i) => {
                const originalIdx = markers.findIndex(x => x === m);
                const fragment = content.slice(m.charPosition, m.charPositionEnd || m.charPosition + 50);
                return (
                  <div key={i} id={`marker-config-${originalIdx}`} className={`card ${activeMarkerId === originalIdx ? 'editor-marker-active' : ''}`} style={{ padding: 14, transition: 'background-color 0.3s, box-shadow 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{
                          background: 'rgba(139,92,246,0.15)',
                          border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: 4, padding: '2px 8px', fontSize: 12,
                          color: 'var(--purple)', flexShrink: 0
                        }}>♪</span>
                        <span style={{
                          fontSize: 13, color: 'var(--text2)', fontFamily: 'Georgia, serif',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          background: 'rgba(255,182,193,0.3)', padding: '1px 6px', borderRadius: 3
                        }}>
                          «{fragment.trim().slice(0, 60)}{fragment.length > 60 ? '...' : ''}»
                        </span>
                      </div>
                      <button onClick={() => removeMarker(originalIdx)}
                        style={{ background: 'none', color: 'var(--coral)', padding: '2px 6px', flexShrink: 0 }}>✕</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input value={m.musicUrl}
                        onChange={e => updateMarker(originalIdx, 'musicUrl', e.target.value)}
                        placeholder="https://youtube.com/watch?v=..." />
                      <input value={m.trackTitle || ''}
                        onChange={e => updateMarker(originalIdx, 'trackTitle', e.target.value)}
                        placeholder="Назва треку" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>Грати з:</span>
                      <input
                        value={m.startTime !== undefined ? formatTime(m.startTime) : ''}
                        onChange={e => updateMarker(originalIdx, 'startTime', parseTime(e.target.value))}
                        placeholder="0:00"
                        style={{ width: 70 }}
                      />
                      <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>до:</span>
                      <input
                        value={m.endTime !== undefined ? formatTime(m.endTime) : ''}
                        onChange={e => updateMarker(originalIdx, 'endTime', parseTime(e.target.value))}
                        placeholder="необов'язково"
                        style={{ width: 120 }}
                      />
                      <span className="muted" style={{ fontSize: 11 }}>формат хв:сек</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
