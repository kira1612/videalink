import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import Buckets from './pages/Buckets';
import BucketDetail from './pages/BucketDetail';
import Endpoints from './pages/Endpoints';
import Settings from './pages/Settings';
import Users from './pages/Users';
import LandingPage from './pages/LandingPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('iot_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds

    const handleLogout = () => {
      localStorage.removeItem('iot_token');
      localStorage.removeItem('iot_user');
      navigate('/login', { replace: true });
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    // Events that represent user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Sync user profile from API (so timezone & other fields are always fresh)
    import('./services/api').then(({ authApi }) => {
      authApi.me().then(res => {
        const existing = JSON.parse(localStorage.getItem('iot_user') || '{}');
        localStorage.setItem('iot_user', JSON.stringify({ ...existing, ...res.data }));
        window.dispatchEvent(new Event('user-updated'));
      }).catch(() => {});
    });

    // Start timer initially
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:id" element={<DeviceDetail />} />
          <Route path="buckets" element={<Buckets />} />
          <Route path="buckets/:id" element={<BucketDetail />} />
          <Route path="endpoints" element={<Endpoints />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
