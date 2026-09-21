import { jwtDecode } from 'jwt-decode';
import { apiClient, API_BASE } from '../api';

/**
 * Get current user ID from stored JWT token
 */
export const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.user_id || decoded.id || null;
  } catch (e) {
    return null;
  }
};

const getStorageKey = (userId) => `user_prefs_${userId || 'guest'}`;

/**
 * Read preferences for a specific user or current active user.
 * Falls back to global localStorage defaults if not yet customized.
 */
export const getUserPreferences = (explicitUserId = null) => {
  const userId = explicitUserId || getCurrentUserId();
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading user preferences:', e);
  }
  return null;
};

/**
 * Save preferences locally and sync asynchronously to backend database.
 */
export const saveUserPreferences = async (partialPrefs, explicitUserId = null) => {
  const userId = explicitUserId || getCurrentUserId();
  const key = getStorageKey(userId);

  let current = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) current = JSON.parse(raw);
  } catch (e) {}

  const updated = { ...current, ...partialPrefs };
  try {
    localStorage.setItem(key, JSON.stringify(updated));

    // Also update legacy keys for backward compatibility if applicable
    if (partialPrefs.theme_mode) {
      localStorage.setItem('theme_mode', partialPrefs.theme_mode);
    }
    if (partialPrefs.currency) {
      localStorage.setItem('currency', partialPrefs.currency);
      window.dispatchEvent(new Event('currencyChange'));
    }

    // Broadcast update across components
    window.dispatchEvent(
      new CustomEvent('user-preferences-updated', {
        detail: { userId, preferences: updated },
      })
    );
  } catch (e) {
    console.error('Error storing preferences locally:', e);
  }

  // Asynchronously sync to backend database if user is logged in
  if (userId && localStorage.getItem('accessToken')) {
    try {
      await apiClient.patch('/auth/settings/preferences/', partialPrefs, {
        baseURL: API_BASE,
      });
    } catch (err) {
      // Backend may be offline, remote Vercel, or local MySQL down; local preference is already safe
    }
  }

  return updated;
};

/**
 * Fetch preferences from backend database upon login/app load and sync to local storage.
 */
export const syncUserPreferencesFromBackend = async (explicitUserId = null) => {
  const userId = explicitUserId || getCurrentUserId();
  if (!userId || !localStorage.getItem('accessToken')) return null;

  try {
    const res = await apiClient.get('/auth/settings/preferences/', {
      baseURL: API_BASE,
    });
    if (res.data) {
      const remoteData = res.data;
      const key = getStorageKey(userId);
      let current = {};
      try {
        const raw = localStorage.getItem(key);
        if (raw) current = JSON.parse(raw);
      } catch (e) {}

      // Filter out empty strings or nulls from remote
      const cleanRemote = {};
      for (const [k, v] of Object.entries(remoteData)) {
        if (v !== '' && v !== null && v !== undefined) {
          cleanRemote[k] = v;
        }
      }

      const merged = { ...current, ...cleanRemote };
      localStorage.setItem(key, JSON.stringify(merged));

      if (merged.theme_mode) {
        localStorage.setItem('theme_mode', merged.theme_mode);
      }
      if (merged.currency) {
        localStorage.setItem('currency', merged.currency);
        window.dispatchEvent(new Event('currencyChange'));
      }

      window.dispatchEvent(
        new CustomEvent('user-preferences-updated', {
          detail: { userId, preferences: merged },
        })
      );
      return merged;
    }
  } catch (err) {
    // Graceful fallback to existing local preferences
  }

  return getUserPreferences(userId);
};
