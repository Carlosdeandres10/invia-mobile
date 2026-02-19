/**
 * Data Explorer Screen — Simple SQL query tool
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { apiClient, type DataExplorerResult } from '../api/client';

const QUICK_QUERIES = [
  { label: '📊 Ver tablas', sql: "SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG=0" },
  { label: '🛒 Retail reciente', sql: "SELECT FIRST 20 * FROM RETAIL_DATA ORDER BY FECHA DESC" },
  { label: '🌤️ Clima hoy', sql: "SELECT FIRST 10 * FROM WEATHER_DATA ORDER BY FECHA DESC" },
  { label: '📈 Nielsen top', sql: "SELECT FIRST 20 * FROM TABLA1" },
];

export function DataExplorerScreen() {
  const theme = useTheme();
  const [sql, setSql] = useState('');
  const [results, setResults] = useState<DataExplorerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (query?: string) => {
    const q = query || sql.trim();
    if (!q) return;
    if (query) setSql(query);

    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await apiClient.executeSQL(q);
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Error de ejecución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPrimary }]}>
      {/* SQL Editor */}
      <View style={[styles.editorSection, { borderBottomColor: theme.colors.border }]}>
        <TextInput
          style={[
            styles.sqlInput,
            {
              backgroundColor: theme.colors.inputBg,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.textPrimary,
              fontFamily: 'monospace',
            },
          ]}
          placeholder="SELECT * FROM ..."
          placeholderTextColor={theme.colors.textMuted}
          value={sql}
          onChangeText={setSql}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Quick Queries */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.quickQueryRow}>
            {QUICK_QUERIES.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.quickQueryChip,
                  {
                    backgroundColor: theme.colors.bgCard,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleExecute(q.sql)}
              >
                <Text style={[styles.quickQueryText, { color: theme.colors.textSecondary }]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.executeBtn,
            { backgroundColor: theme.colors.accentBlue },
            loading && { opacity: 0.7 },
          ]}
          onPress={() => handleExecute()}
          disabled={loading || !sql.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.executeBtnText}>▶ Ejecutar SQL</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.accentRedGlow }]}>
          <Text style={[styles.errorText, { color: theme.colors.accentRed }]}>
            ❌ {error}
          </Text>
        </View>
      )}

      {/* Results Table */}
      {results && (
        <ScrollView style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultCount, { color: theme.colors.textMuted }]}>
              {results.row_count} fila{results.row_count !== 1 ? 's' : ''}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Column Headers */}
              <View
                style={[
                  styles.tableHeaderRow,
                  { backgroundColor: theme.colors.accentBlue + '10' },
                ]}
              >
                {results.columns.map((col, i) => (
                  <View key={i} style={styles.tableCell}>
                    <Text
                      style={[styles.tableCellHeader, { color: theme.colors.accentBlue }]}
                      numberOfLines={1}
                    >
                      {col}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Data Rows */}
              {results.rows.map((row, rowIdx) => (
                <View
                  key={rowIdx}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor:
                        rowIdx % 2 === 0
                          ? theme.colors.bgCard
                          : theme.colors.bgSecondary,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  {row.map((cell, colIdx) => (
                    <View key={colIdx} style={styles.tableCell}>
                      <Text
                        style={[styles.tableCellText, { color: theme.colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {cell !== null && cell !== undefined ? String(cell) : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* Empty state */}
      {!results && !error && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗃️</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            Data Explorer
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            Ejecuta consultas SQL directamente{'\n'}
            contra la base de datos Firebird
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorSection: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  sqlInput: {
    minHeight: 80,
    maxHeight: 150,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  quickQueryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickQueryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickQueryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  executeBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(16, 110, 234, 0.2)',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableCell: {
    width: 140,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableCellText: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
