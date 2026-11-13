import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  PREF_KEYS,
  getUserStringPref,
  hydratePrefsFromUser,
  clearPendingPrefsSync,
  clearLegacyGlobalPrefs,
} from './utils/dashboardPrefs';
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
import Rooms from './pages/Rooms';
import Automations from './pages/Automations';
import FloorPlan from './pages/FloorPlan';
import Guide from './pages/Guide';
import Billing from './pages/Billing';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('iot_token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds

    const handleLogout = () => {
      clearPendingPrefsSync();
      clearLegacyGlobalPrefs();
      localStorage.removeItem('iot_token');
      localStorage.removeItem('iot_user');
      navigate('/login', { replace: true });
      setTimeout(() => window.dispatchEvent(new Event('user-updated')), 10);
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

    // Hydrate from cached user first (and purge any legacy global keys)
    try {
      const cachedUser = JSON.parse(localStorage.getItem('iot_user') || 'null');
      if (cachedUser?.id) {
        hydratePrefsFromUser(cachedUser);
      } else {
        clearLegacyGlobalPrefs();
      }
    } catch {}

    // Sync user profile from API (so timezone, theme, & dashboard_preferences are always fresh)
    const syncUserProfile = () => {
      import('./services/api').then(({ authApi }) => {
        authApi.me().then(res => {
          const existing = JSON.parse(localStorage.getItem('iot_user') || '{}');
          const newData = { ...existing, ...res.data };
          if (JSON.stringify(existing) !== JSON.stringify(newData)) {
            localStorage.setItem('iot_user', JSON.stringify(newData));
            hydratePrefsFromUser(res.data);
            window.dispatchEvent(new Event('user-updated'));
          }
        }).catch(() => {});
      });
    };

    syncUserProfile();
    window.addEventListener('focus', syncUserProfile);

    // Start timer initially
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      window.removeEventListener('focus', syncUserProfile);
    };
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export function applyCustomPrimaryHex(hex) {
  const root = document.documentElement;
  if (!hex || !/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].forEach(k => {
      root.style.removeProperty(`--primary-${k}`);
    });
    return;
  }
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const mix = (c, target, w) => Math.round(c + (target - c) * w);

  root.style.setProperty('--primary-50', `${mix(r, 255, 0.9)} ${mix(g, 255, 0.9)} ${mix(b, 255, 0.9)}`);
  root.style.setProperty('--primary-100', `${mix(r, 255, 0.8)} ${mix(g, 255, 0.8)} ${mix(b, 255, 0.8)}`);
  root.style.setProperty('--primary-200', `${mix(r, 255, 0.6)} ${mix(g, 255, 0.6)} ${mix(b, 255, 0.6)}`);
  root.style.setProperty('--primary-300', `${mix(r, 255, 0.4)} ${mix(g, 255, 0.4)} ${mix(b, 255, 0.4)}`);
  root.style.setProperty('--primary-400', `${mix(r, 255, 0.2)} ${mix(g, 255, 0.2)} ${mix(b, 255, 0.2)}`);
  root.style.setProperty('--primary-500', `${r} ${g} ${b}`);
  root.style.setProperty('--primary-600', `${mix(r, 0, 0.16)} ${mix(g, 0, 0.16)} ${mix(b, 0, 0.16)}`);
  root.style.setProperty('--primary-700', `${mix(r, 0, 0.32)} ${mix(g, 0, 0.32)} ${mix(b, 0, 0.32)}`);
  root.style.setProperty('--primary-800', `${mix(r, 0, 0.48)} ${mix(g, 0, 0.48)} ${mix(b, 0, 0.48)}`);
  root.style.setProperty('--primary-900', `${mix(r, 0, 0.62)} ${mix(g, 0, 0.62)} ${mix(b, 0, 0.62)}`);
}

export default function App() {
  useEffect(() => {
    const applyTheme = () => {
      const userStr = localStorage.getItem('iot_user');
      let savedTheme = localStorage.getItem('iot_theme');
      let savedMode = localStorage.getItem('iot_mode');
      let customHex = null;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.id != null) {
            savedTheme = user.theme || 'blue';
            savedMode = user.mode || 'dark';
            customHex =
              getUserStringPref(PREF_KEYS.CUSTOM_PRIMARY, null, user.id) ||
              user.dashboard_preferences?.custom_primary ||
              null;
          }
        } catch (e) {}
      }

      if (savedTheme && savedTheme !== 'blue') {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      applyCustomPrimaryHex(customHex);
      
      if (savedMode && savedMode === 'light') {
        document.documentElement.setAttribute('data-mode', 'light');
      } else {
        document.documentElement.removeAttribute('data-mode');
      }
    };

    applyTheme();
    window.addEventListener('user-updated', applyTheme);
    window.addEventListener('theme-updated', applyTheme);
    window.addEventListener('dashboard-prefs-updated', applyTheme);
    return () => {
      window.removeEventListener('user-updated', applyTheme);
      window.removeEventListener('theme-updated', applyTheme);
      window.removeEventListener('dashboard-prefs-updated', applyTheme);
    };
  }, []);

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
          <Route path="rooms" element={<Rooms />} />
          <Route path="automations" element={<Automations />} />
          <Route path="floorplan" element={<FloorPlan />} />
          <Route path="users" element={<Users />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="guide" element={<Guide />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
