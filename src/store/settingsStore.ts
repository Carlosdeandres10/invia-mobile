/**
 * App Settings Store — Theme preference, server URL, etc.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isDarkMode: boolean;
  serverUrl: string;

  toggleTheme: () => void;
  setServerUrl: (url: string) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_THEME = '@invia_theme';
const STORAGE_SERVER = '@invia_base_url';

export const useSettingsStore = create<SettingsState>((set) => ({
  isDarkMode: false,
  serverUrl: 'http://192.168.1.100:5050',

  toggleTheme: () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      AsyncStorage.setItem(STORAGE_THEME, newMode ? 'dark' : 'light');
      return { isDarkMode: newMode };
    });
  },

  setServerUrl: (url: string) => {
    const cleaned = url.replace(/\/+$/, '');
    AsyncStorage.setItem(STORAGE_SERVER, cleaned);
    set({ serverUrl: cleaned });
  },

  loadSettings: async () => {
    const [theme, server] = await Promise.all([
      AsyncStorage.getItem(STORAGE_THEME),
      AsyncStorage.getItem(STORAGE_SERVER),
    ]);
    set({
      isDarkMode: theme === 'dark',
      ...(server ? { serverUrl: server } : {}),
    });
  },
}));
