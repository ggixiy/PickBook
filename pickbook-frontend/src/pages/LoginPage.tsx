import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/works';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email, password });
      authLogin(data.accessToken, { username: data.username, role: data.role as any });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data || 'Щось пішло не так');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: '60px auto' }}>
      <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Увійти</h2>
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="muted">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={{ marginTop: 6 }} />
          </div>
          <div>
            <label className="muted">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••" required style={{ marginTop: 6 }} />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          Немає акаунту? <Link to="/register">Зареєструватись</Link>
        </p>
      </div>
    </div>
  );
}
