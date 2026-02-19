/**
 * KPI Card — Dashboard metric card with icon, value, label and trend
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function KPICard({
  icon,
  label,
  value,
  subtitle,
  color,
  trend,
  trendValue,
}: KPICardProps) {
  const theme = useTheme();
  const accentColor = color || theme.colors.accentBlue;

  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
  const trendColor =
    trend === 'up'
      ? theme.colors.accentGreen
      : trend === 'down'
        ? theme.colors.accentRed
        : theme.colors.textMuted;

  return (
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
      <View style={[styles.iconContainer, { backgroundColor: accentColor + '15' }]}>
        <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
      </View>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
      {trend && trendValue && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
          <Text style={[styles.trendValue, { color: trendColor }]}>{trendValue}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    flex: 1,
    minWidth: 140,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '500',
  },
});
