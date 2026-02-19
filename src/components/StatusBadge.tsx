/**
 * StatusBadge — Colored badge showing online/offline/configuring states
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'info';
  label: string;
  compact?: boolean;
}

export function StatusBadge({ status, label, compact }: StatusBadgeProps) {
  const theme = useTheme();

  const statusColors = {
    online: theme.colors.accentGreen,
    offline: theme.colors.accentRed,
    warning: theme.colors.accentOrange,
    info: theme.colors.accentBlue,
  };

  const color = statusColors[status];

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: color + '18' },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 11,
  },
});
