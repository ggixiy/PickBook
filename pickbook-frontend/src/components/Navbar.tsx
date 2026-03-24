import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthor } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Логотип */}
      <Link to="/" style={{
        fontSize: 20,
        fontFamily: 'Georgia, serif',
        color: 'var(--purple)',
        fontWeight: 'normal',
        textDecoration: 'none'
      }}>
        📖 PickBook
      </Link>

      {/* Навігація */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {user ? (
          <>
            <span className="muted">{user.username}</span>
            {isAuthor && (
              <button className="btn-primary" style={{ padding: '6px 14px' }}
                onClick={() => navigate('/editor')}>
                + Новий твір
              </button>
            )}
            <button className="btn-ghost" style={{ padding: '6px 14px' }}
              onClick={handleLogout}>
              Вийти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'var(--text2)', fontSize: 14 }}>Увійти</Link>
            <button className="btn-primary" style={{ padding: '6px 14px' }}
              onClick={() => navigate('/register')}>
              Реєстрація
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
