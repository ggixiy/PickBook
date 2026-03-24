import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkPage from './pages/WorkPage';
import EditorPage from './pages/EditorPage';
import ProfilePage from './pages/ProfilePage';

// Захищений маршрут — тільки для авторизованих
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/works/:id" element={<WorkPage />} />
          <Route path="/profile/:authorId" element={<ProfilePage />} />
          <Route path="/editor" element={
            <PrivateRoute><EditorPage /></PrivateRoute>
          } />
          <Route path="/editor/:id" element={
            <PrivateRoute><EditorPage /></PrivateRoute>
          } />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
