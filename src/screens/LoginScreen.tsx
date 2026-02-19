/**
 * Login Screen — Authentication with Invia branding
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiClient } from '../api/client';

export function LoginScreen() {
  const theme = useTheme();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { serverUrl, setServerUrl } = useSettingsStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Introduce usuario y contraseña');
      return;
    }
    clearError();
    await apiClient.setBaseUrl(serverUrl);
    await login(username.trim(), password.trim());
  };

  const handleSaveUrl = () => {
    setServerUrl(tempUrl.trim());
    apiClient.setBaseUrl(tempUrl.trim());
    setShowConfig(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.logoSection}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: theme.colors.accentBlue + '15' },
            ]}
          >
            <Text style={[styles.logoText, { color: theme.colors.accentBlue }]}>
              IN
            </Text>
          </View>
          <Text style={[styles.brandName, { color: theme.colors.textPrimary }]}>
            Invia Pipeline
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Panel de Control — Acceso Móvil
          </Text>
        </View>

        {/* Login Form */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.colors.bgCard,
              borderColor: theme.colors.border,
              ...theme.shadow.lg,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBg,
                borderColor: theme.colors.inputBorder,
                color: theme.colors.textPrimary,
              },
            ]}
            placeholder="Usuario"
            placeholderTextColor={theme.colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBg,
                borderColor: theme.colors.inputBorder,
                color: theme.colors.textPrimary,
              },
            ]}
            placeholder="Contraseña"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: theme.colors.accentRedGlow },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colors.accentRed }]}>
                ⚠ {error}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.accentBlue },
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Config Toggle */}
        <TouchableOpacity
          onPress={() => setShowConfig(!showConfig)}
          style={styles.configToggle}
        >
          <Text style={[styles.configToggleText, { color: theme.colors.textMuted }]}>
            ⚙ Configurar servidor
          </Text>
        </TouchableOpacity>

        {showConfig && (
          <View
            style={[
              styles.configCard,
              {
                backgroundColor: theme.colors.bgCard,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.configLabel, { color: theme.colors.textSecondary }]}>
              URL del servidor Flask
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.inputBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="http://192.168.1.100:5050"
              placeholderTextColor={theme.colors.textMuted}
              value={tempUrl}
              onChangeText={setTempUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.colors.accentGreen }]}
              onPress={handleSaveUrl}
            >
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  configToggle: {
    alignItems: 'center',
    marginTop: 24,
    padding: 8,
  },
  configToggleText: {
    fontSize: 13,
  },
  configCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 12,
    gap: 10,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
