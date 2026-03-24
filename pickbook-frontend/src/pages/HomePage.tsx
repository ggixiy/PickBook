import { useState, useEffect } from 'react';
import { getWorks, searchWorks } from '../api/works';
import WorkCard from '../components/WorkCard';
import type { Work, Page } from '../types';

export default function HomePage() {
  const [data, setData] = useState<Page<Work> | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const req = query.trim()
      ? searchWorks(query, page)
      : getWorks(page, 10);
    req.then(setData).finally(() => setLoading(false));
  }, [query, page]);

  // Скидаємо на першу сторінку при пошуку
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(0);
  };

  return (
    <div>
      {/* Герой-секція */}
      <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
        <h1 style={{ fontSize: 42, marginBottom: 12, color: 'var(--text)' }}>
          Читай з відчуттям
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 28 }}>
          Твори де музика починає грати саме в потрібний момент
        </p>
        {/* Пошук */}
        <input
          placeholder="Пошук творів..."
          value={query}
          onChange={handleSearch}
          style={{ maxWidth: 420, fontSize: 16 }}
        />
      </div>

      {/* Список творів */}
      {loading ? (
        <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Завантаження...</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data?.content.length === 0 && (
              <p className="muted" style={{ textAlign: 'center', padding: 40 }}>
                Нічого не знайдено
              </p>
            )}
            {data?.content.map(work => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>

          {/* Пагінація */}
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button className="btn-ghost" disabled={page === 0}
                onClick={() => setPage(p => p - 1)}>← Назад</button>
              <span className="muted" style={{ padding: '10px 16px' }}>
                {page + 1} / {data.totalPages}
              </span>
              <button className="btn-ghost" disabled={page >= data.totalPages - 1}
                onClick={() => setPage(p => p + 1)}>Вперед →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
