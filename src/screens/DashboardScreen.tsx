/**
 * Dashboard Screen — KPIs, API status, and system overview
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { apiClient, type ApiStatusItem } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { SectionHeader } from '../components/SectionHeader';

export function DashboardScreen() {
  const theme = useTheme();
  const { user, role } = useAuthStore();

  const [apis, setApis] = useState<ApiStatusItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const status = await apiClient.getApiStatus();
      const normalizedApis = Array.isArray(status?.apis)
        ? status.apis
        : Array.isArray(status)
          ? status
          : [];
      setApis(normalizedApis);
    } catch (err: any) {
      setError(err?.message || 'Error de conexión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const configuredApis = apis.filter((a) => a.configured).length;
  const totalApis = apis.length;

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.bgPrimary },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.accentBlue} />
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Cargando panel...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.bgPrimary }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.accentBlue}
          colors={[theme.colors.accentBlue]}
        />
      }
    >
      {/* Welcome Header */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>
            Bienvenido
          </Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
            {user || 'Usuario'}
          </Text>
        </View>
        <StatusBadge
          status={role === 'admin' ? 'info' : 'online'}
          label={role === 'admin' ? 'Admin' : 'Usuario'}
        />
      </View>

      {error && (
        <View
          style={[styles.errorBanner, { backgroundColor: theme.colors.accentRedGlow }]}
        >
          <Text style={[styles.errorText, { color: theme.colors.accentRed }]}>
            ⚠ {error}
          </Text>
          <TouchableOpacity onPress={fetchData}>
            <Text style={[styles.retryText, { color: theme.colors.accentBlue }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* KPI Cards */}
      <SectionHeader title="Panel General" icon="📊" />

      <View style={styles.kpiGrid}>
        <KPICard
          icon="🔌"
          label="APIs Activas"
          value={`${configuredApis}/${totalApis}`}
          color={theme.colors.accentBlue}
          trend={configuredApis === totalApis ? 'up' : 'neutral'}
          trendValue={configuredApis === totalApis ? 'Todo OK' : 'Faltan configs'}
        />
        <KPICard
          icon="🤖"
          label="Chat IA"
          value={apis.find((a) => a.name?.toLowerCase().includes('openrouter') || a.name?.toLowerCase().includes('intelligence'))?.configured ? '✓' : '✗'}
          color={theme.colors.accentPurple}
          subtitle="OpenRouter"
        />
      </View>

      <View style={styles.kpiGrid}>
        <KPICard
          icon="🌤"
          label="Clima"
          value={apis.find((a) => a.name?.toLowerCase().includes('weather') || a.name?.toLowerCase().includes('clima'))?.configured ? 'Activo' : 'Off'}
          color={theme.colors.accentOrange}
          subtitle="OpenWeather"
        />
        <KPICard
          icon="🛒"
          label="Retail"
          value={apis.find((a) => a.name?.toLowerCase().includes('zenrows') || a.name?.toLowerCase().includes('retail'))?.configured ? 'Activo' : 'Off'}
          color={theme.colors.accentGreen}
          subtitle="ZenRows"
        />
      </View>

      {/* API Status List */}
      <SectionHeader title="Estado de APIs" icon="🔗" actionLabel="Refrescar" onAction={onRefresh} />

      <View
        style={[
          styles.apiListCard,
          {
            backgroundColor: theme.colors.bgCard,
            borderColor: theme.colors.border,
            ...theme.shadow.sm,
          },
        ]}
      >
        {apis.map((api, index) => (
          <View
            key={api.name || index}
            style={[
              styles.apiRow,
              index < apis.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.apiRowLeft}>
              <Text
                style={[styles.apiName, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {api.name}
              </Text>
              {api.key_masked && (
                <Text
                  style={[styles.apiKey, { color: theme.colors.textMuted }]}
                  numberOfLines={1}
                >
                  {api.key_masked}
                </Text>
              )}
            </View>
            <StatusBadge
              status={api.configured ? 'online' : 'offline'}
              label={api.configured ? 'OK' : 'No configurada'}
              compact
            />
          </View>
        ))}
        {apis.length === 0 && (
          <Text
            style={[styles.emptyText, { color: theme.colors.textMuted }]}
          >
            No se encontraron APIs
          </Text>
        )}
      </View>

      {/* Bottom padding */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  errorBanner: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  apiListCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  apiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  apiRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  apiName: {
    fontSize: 15,
    fontWeight: '600',
  },
  apiKey: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    padding: 20,
    textAlign: 'center',
  },
});
