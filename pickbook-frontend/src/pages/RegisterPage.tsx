import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/works';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'READER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form);
      login(data.accessToken, { username: data.username, role: data.role as any });
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data;
      setError(typeof msg === 'string' ? msg : 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Реєстрація</h2>
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="muted">Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="you@example.com" required style={{ marginTop: 6 }} />
          </div>
          <div>
            <label className="muted">Ім'я користувача</label>
            <input value={form.username} onChange={set('username')}
              placeholder="ваш_нікнейм" required style={{ marginTop: 6 }} />
          </div>
          <div>
            <label className="muted">Пароль</label>
            <input type="password" value={form.password} onChange={set('password')}
              placeholder="мінімум 6 символів" required style={{ marginTop: 6 }} />
          </div>
          <div>
            <label className="muted">Я хочу...</label>
            <select value={form.role} onChange={set('role')} style={{ marginTop: 6 }}>
              <option value="READER">Читати твори</option>
              <option value="AUTHOR">Писати та публікувати</option>
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Реєстрація...' : 'Зареєструватись'}
          </button>
        </form>
        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}
