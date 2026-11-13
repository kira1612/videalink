import { userApi } from '../services/api';

/**
 * Storage base keys for per-user dashboard & appearance preferences.
 */
export const PREF_KEYS = {
  LAYOUT: 'iot_dashboard_layout',
  STYLES: 'iot_dashboard_styles',
  PINNED_BUCKETS: 'iot_dashboard_pinned_bucket_widgets',
  PINNED_ROOMS: 'iot_dashboard_pinned_rooms',
  SIDEBAR_OPEN: 'iot_dashboard_bucket_sidebar_open',
  CUSTOM_PRIMARY: 'iot_custom_primary',
  TRANSPARENT_SIDEBAR: 'iot_transparent_sidebar',
  WALLS_PREFIX: 'iot_layout_walls',
  NOTIFICATIONS: 'iot_notification_prefs',
};

const KEY_TO_DB_FIELD = {
  [PREF_KEYS.LAYOUT]: 'layout',
  [PREF_KEYS.STYLES]: 'styles',
  [PREF_KEYS.PINNED_BUCKETS]: 'pinned_bucket_widgets',
  [PREF_KEYS.PINNED_ROOMS]: 'pinned_rooms',
  [PREF_KEYS.CUSTOM_PRIMARY]: 'custom_primary',
  [PREF_KEYS.TRANSPARENT_SIDEBAR]: 'transparent_sidebar',
  [PREF_KEYS.NOTIFICATIONS]: 'notifications',
};

const LEGACY_GLOBAL_KEYS = [
  'iot_dashboard_layout',
  'iot_dashboard_styles',
  'iot_hero_artwork',
  'iot_dashboard_pinned_bucket_widgets',
  'iot_dashboard_pinned_rooms',
  'iot_dashboard_bucket_sidebar_open',
  'iot_custom_primary',
];

let pendingDbPatch = {};
let syncTimer = null;
let lastLocalWriteAt = 0;
let lastHydratedUserId = null;

/**
 * Read current authenticated user object safely from localStorage.
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('iot_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Return current user ID string or null if not logged in.
 */
export function getCurrentUserId() {
  const user = getStoredUser();
  return user?.id != null ? String(user.id) : null;
}

/**
 * Build a user-scoped localStorage key to strictly isolate accounts in the same browser.
 */
export function getUserScopedKey(baseKey, userIdOverride = null) {
  const uid = userIdOverride != null ? String(userIdOverride) : getCurrentUserId();
  return uid ? `${baseKey}__u_${uid}` : baseKey;
}

/**
 * Remove legacy global (unscoped) dashboard keys so they cannot leak across accounts.
 */
export function clearLegacyGlobalPrefs() {
  try {
    LEGACY_GLOBAL_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/**
 * Update local cached `iot_user.dashboard_preferences` and schedule debounced API sync.
 */
function queueDbSync(partialPrefs, immediate = false) {
  const uid = getCurrentUserId();
  if (!uid) return;

  lastLocalWriteAt = Date.now();
  pendingDbPatch = { ...pendingDbPatch, ...partialPrefs };

  // Keep cached iot_user in sync immediately so fast page navigations/reloads see latest state
  try {
    const user = getStoredUser();
    if (user && String(user.id) === uid) {
      const existingPrefs =
        user.dashboard_preferences && typeof user.dashboard_preferences === 'object'
          ? user.dashboard_preferences
          : {};
      user.dashboard_preferences = { ...existingPrefs, ...partialPrefs };
      localStorage.setItem('iot_user', JSON.stringify(user));
    }
  } catch {}

  const flush = () => {
    const payload = { ...pendingDbPatch };
    pendingDbPatch = {};
    if (Object.keys(payload).length === 0) return;
    if (!localStorage.getItem('iot_token')) return;

    userApi
      .update({ dashboard_preferences: payload })
      .then((res) => {
        if (res?.data?.id) {
          const current = getStoredUser();
          if (current && String(current.id) === String(res.data.id)) {
            localStorage.setItem('iot_user', JSON.stringify({ ...current, ...res.data }));
          }
        }
      })
      .catch(() => {});
  };

  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  if (immediate) {
    flush();
  } else {
    syncTimer = setTimeout(flush, 350);
  }
}

/**
 * Read a JSON preference scoped to the active user.
 */
export function getUserJsonPref(baseKey, fallbackValue = null, userIdOverride = null) {
  try {
    const uid = userIdOverride != null ? String(userIdOverride) : getCurrentUserId();
    if (!uid) return fallbackValue;
    const raw = localStorage.getItem(getUserScopedKey(baseKey, uid));
    if (raw === null || raw === undefined) return fallbackValue;
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

/**
 * Persist a JSON preference to user-scoped localStorage and queue DB sync.
 */
export function setUserJsonPref(
  baseKey,
  value,
  { syncToServer = true, immediate = false, userId = null } = {}
) {
  const uid = userId != null ? String(userId) : getCurrentUserId();
  if (!uid) return;

  try {
    localStorage.setItem(getUserScopedKey(baseKey, uid), JSON.stringify(value));
  } catch {}

  const dbField = KEY_TO_DB_FIELD[baseKey];
  if (syncToServer && dbField) {
    queueDbSync({ [dbField]: value }, immediate);
  }
}

/**
 * Read a string preference scoped to the active user.
 */
export function getUserStringPref(baseKey, fallbackValue = null, userIdOverride = null) {
  try {
    const uid = userIdOverride != null ? String(userIdOverride) : getCurrentUserId();
    if (!uid) return fallbackValue;
    const raw = localStorage.getItem(getUserScopedKey(baseKey, uid));
    return raw !== null ? raw : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

/**
 * Save or delete a string preference scoped to the active user and sync to DB.
 */
export function setUserStringPref(
  baseKey,
  value,
  { syncToServer = true, immediate = false, userId = null } = {}
) {
  const uid = userId != null ? String(userId) : getCurrentUserId();
  if (!uid) return;

  const scopedKey = getUserScopedKey(baseKey, uid);
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(scopedKey);
    } else {
      localStorage.setItem(scopedKey, String(value));
    }
  } catch {}

  const dbField = KEY_TO_DB_FIELD[baseKey];
  if (syncToServer && dbField) {
    queueDbSync({ [dbField]: value ?? null }, immediate);
  }
}

/**
 * Remove a preference from user-scoped localStorage and optionally set null in DB.
 */
export function removeUserPref(baseKey, { syncToServer = true, immediate = false, userId = null } = {}) {
  const uid = userId != null ? String(userId) : getCurrentUserId();
  if (!uid) return;

  try {
    localStorage.removeItem(getUserScopedKey(baseKey, uid));
  } catch {}

  const dbField = KEY_TO_DB_FIELD[baseKey];
  if (syncToServer && dbField) {
    queueDbSync({ [dbField]: null }, immediate);
  }
}

/**
 * Reset a user's dashboard layout & styles to default cleanly.
 */
export function resetUserDashboardPrefs(userId = null) {
  const uid = userId != null ? String(userId) : getCurrentUserId();
  if (!uid) return;

  try {
    localStorage.removeItem(getUserScopedKey(PREF_KEYS.LAYOUT, uid));
    localStorage.removeItem(getUserScopedKey(PREF_KEYS.STYLES, uid));
  } catch {}

  queueDbSync({ layout: null, styles: null }, true);
}

/**
 * Clear pending debounce state (called on logout or account switch).
 */
export function clearPendingPrefsSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  pendingDbPatch = {};
  lastLocalWriteAt = 0;
  lastHydratedUserId = null;
}

/**
 * Hydrate per-user localStorage cache from authenticated `user.dashboard_preferences`.
 * Dispatches `'dashboard-prefs-updated'` and `'theme-updated'` when applied.
 */
export function hydratePrefsFromUser(user, { force = false } = {}) {
  if (!user || user.id == null) return;
  const uid = String(user.id);
  const userChanged = lastHydratedUserId !== null && lastHydratedUserId !== uid;

  if (userChanged) {
    clearPendingPrefsSync();
  }

  // Avoid overwriting recent in-flight local edits during background authApi.me() refresh for the same user
  const hasPendingLocalWrite =
    Object.keys(pendingDbPatch).length > 0 || Date.now() - lastLocalWriteAt < 2500;
  if (!force && !userChanged && lastHydratedUserId === uid && hasPendingLocalWrite) {
    return;
  }

  lastHydratedUserId = uid;
  clearLegacyGlobalPrefs();

  const prefs = user.dashboard_preferences;
  if (prefs && typeof prefs === 'object') {
    const jsonMappings = [
      { field: 'layout', key: PREF_KEYS.LAYOUT },
      { field: 'styles', key: PREF_KEYS.STYLES },
      { field: 'pinned_bucket_widgets', key: PREF_KEYS.PINNED_BUCKETS },
      { field: 'pinned_rooms', key: PREF_KEYS.PINNED_ROOMS },
      { field: 'notifications', key: PREF_KEYS.NOTIFICATIONS },
    ];

    jsonMappings.forEach(({ field, key }) => {
      if (Object.prototype.hasOwnProperty.call(prefs, field)) {
        const scopedKey = getUserScopedKey(key, uid);
        if (prefs[field] === null) {
          localStorage.removeItem(scopedKey);
        } else if (prefs[field] !== undefined) {
          localStorage.setItem(scopedKey, JSON.stringify(prefs[field]));
        }
      }
    });

    if (Object.prototype.hasOwnProperty.call(prefs, 'custom_primary')) {
      const customKey = getUserScopedKey(PREF_KEYS.CUSTOM_PRIMARY, uid);
      if (prefs.custom_primary) {
        localStorage.setItem(customKey, String(prefs.custom_primary));
      } else {
        localStorage.removeItem(customKey);
      }
    }

    if (Object.prototype.hasOwnProperty.call(prefs, 'transparent_sidebar')) {
      const sbKey = getUserScopedKey(PREF_KEYS.TRANSPARENT_SIDEBAR, uid);
      if (prefs.transparent_sidebar === null || prefs.transparent_sidebar === undefined) {
        localStorage.removeItem(sbKey);
      } else {
        localStorage.setItem(sbKey, String(prefs.transparent_sidebar));
      }
    }
  }

  window.dispatchEvent(new Event('dashboard-prefs-updated'));
  window.dispatchEvent(new Event('theme-updated'));
}
