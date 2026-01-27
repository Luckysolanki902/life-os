'use client';

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

export const authStorage = {
  async setToken(token: string) {
    if (Capacitor.isNativePlatform()) {
      // Store in Capacitor Preferences for native apps
      await Preferences.set({
        key: AUTH_TOKEN_KEY,
        value: token,
      });
      await Preferences.set({
        key: AUTH_TIMESTAMP_KEY,
        value: Date.now().toString(),
      });
    } else {
      // Fallback to localStorage for web
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    }
  },

  async getToken(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
      return value;
    } else {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
  },

  async getAuthAge(): Promise<number | null> {
    let timestamp: string | null;
    
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: AUTH_TIMESTAMP_KEY });
      timestamp = value;
    } else {
      timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
    }

    if (!timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    return age;
  },

  async isTokenValid(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    const age = await this.getAuthAge();
    if (!age) return false;

    // Check if token is older than 7 days (in milliseconds)
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    return age < SEVEN_DAYS;
  },

  async clearToken() {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: AUTH_TOKEN_KEY });
      await Preferences.remove({ key: AUTH_TIMESTAMP_KEY });
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    }
  },
};
