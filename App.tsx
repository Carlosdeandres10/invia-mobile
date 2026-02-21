/**
 * Invia Pipeline — Mobile App Entry Point
 *
 * React Native + Expo + TypeScript
 * Professional native app for the invia-pipeline control panel
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeContext, lightTheme, darkTheme } from './src/theme';
import { AppNavigation } from './src/navigation/AppNavigation';
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { apiClient } from './src/api/client';

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const { isAuthenticated, role, isLoading: authLoading, checkAuth } = useAuthStore();
  const { isDarkMode, loadSettings } = useSettingsStore();

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    async function bootstrap() {
      try {
        // Load persisted settings first
        await loadSettings();
        // Load the base URL into the API client
        await apiClient.loadBaseUrl();
        // Check existing auth session
        await checkAuth();
      } catch {
        // App still loads even if bootstrap fails
      } finally {
        setAppReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!appReady || authLoading) {
    return (
      <View
        style={[
          styles.splash,
          { backgroundColor: theme.colors.bgPrimary },
        ]}
      >
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.bgPrimary}
        />
        <ActivityIndicator size="large" color={theme.colors.accentBlue} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.bgPrimary}
        />
        <AppNavigation isAuthenticated={isAuthenticated} role={role} />
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
