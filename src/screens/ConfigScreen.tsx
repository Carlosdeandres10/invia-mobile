/**
 * Config Screen — Settings, server URL, theme, logout
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { apiClient } from '../api/client';

export function ConfigScreen() {
  const theme = useTheme();
  const { user, role, logout } = useAuthStore();
  const { isDarkMode, serverUrl, toggleTheme, setServerUrl } = useSettingsStore();

  const [editUrl, setEditUrl] = useState(serverUrl);
  const [urlChanged, setUrlChanged] = useState(false);

  const handleSaveUrl = () => {
    const cleaned = editUrl.trim().replace(/\/+$/, '');
    setServerUrl(cleaned);
    apiClient.setBaseUrl(cleaned);
    setUrlChanged(false);
    Alert.alert('✅ Guardado', `Servidor actualizado a:\n${cleaned}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bgPrimary }]}
      contentContainerStyle={styles.content}
    >
      {/* User Info */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.bgCard,
            borderColor: theme.colors.border,
            ...theme.shadow.md,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.accentBlue + '20' },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.accentBlue }]}>
              {(user || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
              {user || 'Usuario'}
            </Text>
            <Text style={[styles.userRole, { color: theme.colors.textMuted }]}>
              Rol: {role || 'usuario'}
            </Text>
          </View>
        </View>
      </View>

      {/* Theme */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.bgCard,
            borderColor: theme.colors.border,
            ...theme.shadow.sm,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🎨 Apariencia
        </Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
              Modo Oscuro
            </Text>
            <Text style={[styles.settingHint, { color: theme.colors.textMuted }]}>
              Cambia entre tema claro y oscuro
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.accentBlue + '60',
            }}
            thumbColor={isDarkMode ? theme.colors.accentBlue : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Server URL */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.bgCard,
            borderColor: theme.colors.border,
            ...theme.shadow.sm,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          🔌 Conexión al Servidor
        </Text>
        <Text style={[styles.settingHint, { color: theme.colors.textMuted }]}>
          URL del servidor Flask (panel_server.py)
        </Text>
        <TextInput
          style={[
            styles.urlInput,
            {
              backgroundColor: theme.colors.inputBg,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.textPrimary,
            },
          ]}
          value={editUrl}
          onChangeText={(t) => {
            setEditUrl(t);
            setUrlChanged(t.trim().replace(/\/+$/, '') !== serverUrl);
          }}
          placeholder="http://192.168.1.100:5050"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {urlChanged && (
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.colors.accentGreen }]}
            onPress={handleSaveUrl}
          >
            <Text style={styles.saveBtnText}>💾 Guardar URL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* About */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.bgCard,
            borderColor: theme.colors.border,
            ...theme.shadow.sm,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          ℹ️ Información
        </Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
            Versión
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            1.0.0
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
            Framework
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            React Native + Expo
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
            Backend
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
            Flask / Python
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: theme.colors.accentRed + '12' }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={[styles.logoutBtnText, { color: theme.colors.accentRed }]}>
          🚪 Cerrar Sesión
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingHint: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  urlInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  saveBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
