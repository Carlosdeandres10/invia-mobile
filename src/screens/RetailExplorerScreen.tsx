/**
 * Retail Explorer Screen — Search products across retail platforms
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTheme } from '../theme';
import { apiClient, type RetailResult } from '../api/client';

const PLATFORMS = [
  { id: 'carrefour', label: '🥕 Carrefour', color: '#004b93' },
  { id: 'mercadona', label: '🟢 Mercadona', color: '#38a169' },
  { id: 'amazon', label: '📦 Amazon', color: '#ff9900' },
  { id: 'alcampo', label: '🔵 Alcampo', color: '#0073cf' },
  { id: 'soysuper', label: '🛍️ SoySuper', color: '#e53e3e' },
];

export function RetailExplorerScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('carrefour');
  const [results, setResults] = useState<RetailResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearchDone(false);
    try {
      const data = await apiClient.testRetailTargeted(selectedPlatform, query.trim());
      setResults(data);
      setSearchDone(true);
    } catch (err: any) {
      setError(err?.message || 'Error en la búsqueda');
      setResults([]);
      setSearchDone(true);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item, index }: { item: RetailResult; index: number }) => (
    <TouchableOpacity
      style={[
        styles.productCard,
        {
          backgroundColor: theme.colors.bgCard,
          borderColor: theme.colors.border,
          ...theme.shadow.sm,
        },
      ]}
      onPress={() => item.url && Linking.openURL(item.url)}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <Text
          style={[styles.productTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.titulo}
        </Text>
        <Text style={[styles.productPrice, { color: theme.colors.accentGreen }]}>
          {typeof item.precio === 'number'
            ? `${item.precio.toFixed(2)} €`
            : item.precio || 'N/A'}
        </Text>
      </View>
      <View style={styles.productMeta}>
        {item.marca && (
          <View
            style={[styles.metaBadge, { backgroundColor: theme.colors.accentBlue + '15' }]}
          >
            <Text style={[styles.metaText, { color: theme.colors.accentBlue }]}>
              {item.marca}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.metaBadge,
            { backgroundColor: theme.colors.accentPurple + '15' },
          ]}
        >
          <Text style={[styles.metaText, { color: theme.colors.accentPurple }]}>
            {item.plataforma}
          </Text>
        </View>
        {item.url && (
          <Text style={[styles.linkText, { color: theme.colors.accentBlue }]}>
            Ver →
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPrimary }]}>
      {/* Search Bar */}
      <View style={[styles.searchSection, { borderBottomColor: theme.colors.border }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.inputBg,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.textPrimary,
            },
          ]}
          placeholder="Buscar producto... (ej: repelente mosquitos)"
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        {/* Platform Chips */}
        <FlatList
          data={PLATFORMS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.platformList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.platformChip,
                {
                  backgroundColor:
                    selectedPlatform === item.id
                      ? item.color
                      : theme.colors.bgCard,
                  borderColor:
                    selectedPlatform === item.id
                      ? item.color
                      : theme.colors.border,
                },
              ]}
              onPress={() => setSelectedPlatform(item.id)}
            >
              <Text
                style={[
                  styles.platformChipText,
                  {
                    color:
                      selectedPlatform === item.id
                        ? '#fff'
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          style={[
            styles.searchBtn,
            { backgroundColor: theme.colors.accentBlue },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchBtnText}>🔍 Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {error && (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.accentRedGlow }]}>
          <Text style={[styles.errorText, { color: theme.colors.accentRed }]}>
            ⚠ {error}
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderProduct}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          searchDone && !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyEmoji]}>🛒</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                {results.length === 0 && searchDone
                  ? 'Sin resultados'
                  : 'Explorador Retail'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                {results.length === 0 && searchDone
                  ? 'Prueba con otro producto o plataforma'
                  : 'Busca productos en las principales plataformas'}
              </Text>
            </View>
          ) : !searchDone && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                Explorador Retail
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
                Busca productos en Carrefour, Mercadona, Amazon y más
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          searchDone && results.length > 0 ? (
            <Text style={[styles.resultCount, { color: theme.colors.textMuted }]}>
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado
              {results.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  platformList: {
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
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
  resultsList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
