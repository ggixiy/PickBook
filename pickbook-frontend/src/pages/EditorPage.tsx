import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createWork, updateWork, getWork } from '../api/works';
import type { MusicMarker } from '../types';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('STORY');
  const [markers, setMarkers] = useState<MusicMarker[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Якщо редагування — завантажуємо існуючий твір
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

  // Додати нову музичну мітку на поточну позицію курсора
  const addMarker = () => {
    const textarea = document.getElementById('content-area') as HTMLTextAreaElement;
    const pos = textarea?.selectionStart ?? content.length;
    setMarkers(m => [...m, { charPosition: pos, musicUrl: '', trackTitle: '' }]);
  };

  const updateMarker = (i: number, field: keyof MusicMarker, value: string | number) => {
    setMarkers(m => m.map((marker, idx) => idx === i ? { ...marker, [field]: value } : marker));
  };

  const removeMarker = (i: number) => setMarkers(m => m.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Заповніть заголовок та текст');
      return;
    }
    // Фільтруємо мітки без URL
    const validMarkers = markers.filter(m => m.musicUrl.trim());
    setSaving(true);
    setError('');
    try {
      const payload = { title, content, description, genre, musicMarkers: validMarkers };
      const work = isEdit
        ? await updateWork(Number(id), payload)
        : await createWork(payload);
      navigate(`/works/${work.id}`);
    } catch (e: any) {
      setError('Не вдалось зберегти. Перевірте дані.');
    } finally {
      setSaving(false);
    }
  };

  // Показуємо позначки у тексті
  const getMarkerAtPosition = (pos: number) =>
    markers.find(m => Math.abs(m.charPosition - pos) < 20);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
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
        {/* Заголовок */}
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Назва твору..." style={{ fontSize: 22, padding: '12px 16px' }} />

        {/* Жанр та опис в рядок */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            <option value="STORY">Оповідання</option>
            <option value="POEM">Поезія</option>
            <option value="ESSAY">Есе</option>
          </select>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Короткий опис (необов'язково)" />
        </div>

        {/* Текст */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="muted">Текст твору</label>
            <button className="btn-ghost" onClick={addMarker} style={{ fontSize: 12, padding: '4px 12px' }}>
              ♪ Додати музику тут
            </button>
          </div>
          <textarea id="content-area"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Починайте писати... Поставте курсор у потрібне місце і натисніть '♪ Додати музику тут'"
            style={{ minHeight: 400, lineHeight: 1.9, fontFamily: 'Georgia, serif', fontSize: 16, resize: 'vertical' }}
          />
          <p className="muted" style={{ marginTop: 4 }}>
            {content.length} символів
          </p>
        </div>

        {/* Музичні мітки */}
        {markers.length > 0 && (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>🎵 Музичні мітки</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {markers.map((m, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Позиція в тексті */}
                    <div style={{ flexShrink: 0 }}>
                      <label className="muted" style={{ fontSize: 11 }}>Позиція</label>
                      <input type="number" value={m.charPosition}
                        onChange={e => updateMarker(i, 'charPosition', Number(e.target.value))}
                        style={{ width: 90, marginTop: 4 }} />
                    </div>
                    {/* URL */}
                    <div style={{ flex: 1 }}>
                      <label className="muted" style={{ fontSize: 11 }}>YouTube або SoundCloud URL</label>
                      <input value={m.musicUrl}
                        onChange={e => updateMarker(i, 'musicUrl', e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        style={{ marginTop: 4 }} />
                    </div>
                    {/* Назва треку */}
                    <div style={{ flex: 0.6 }}>
                      <label className="muted" style={{ fontSize: 11 }}>Назва (необов'язково)</label>
                      <input value={m.trackTitle || ''}
                        onChange={e => updateMarker(i, 'trackTitle', e.target.value)}
                        placeholder="Назва треку"
                        style={{ marginTop: 4 }} />
                    </div>
                    <button onClick={() => removeMarker(i)}
                      style={{ background: 'none', color: 'var(--coral)', padding: '4px 8px', marginTop: 20 }}>
                      ✕
                    </button>
                  </div>
                  <p className="muted" style={{ marginTop: 6, fontSize: 11 }}>
                    Музика почнеться на символі #{m.charPosition} —
                    «{content.substring(Math.max(0, m.charPosition - 20), m.charPosition + 20).trim()}»
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
