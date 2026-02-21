/**
 * Chat Screen — AI Chatbot with SSE streaming
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '../theme';
import { useChatStore } from '../store/chatStore';
import { apiClient, type ChatMessage } from '../api/client';

interface ParsedMetric {
  label: string;
  value: number;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

interface ParsedKpi {
  label: string;
  value: number;
}

function wrapLongTokens(text: string, maxTokenLength: number = 48): string {
  return text.replace(/\S{49,}/g, (token) => {
    const chunks = token.match(new RegExp(`.{1,${maxTokenLength}}`, 'g'));
    return chunks ? chunks.join('\n') : token;
  });
}

function formatForMobile(content: string): string {
  const withoutCodeFences = content
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ''))
    .replace(/```/g, '');

  const normalized = withoutCodeFences
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^[=]{3,}$/gm, '────────')
    .replace(/^[-]{3,}$/gm, '────────')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return wrapLongTokens(normalized);
}

function parseMetrics(text: string): ParsedMetric[] {
  const lines = text.split('\n');
  const metrics: ParsedMetric[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const inline = line.match(/^([^:]{2,32}):\s*([0-9]+(?:[.,][0-9]+)?)\s*$/);
    if (inline) {
      metrics.push({
        label: inline[1].trim(),
        value: Number(inline[2].replace(',', '.')),
      });
      continue;
    }

    const labelOnly = line.match(/^([^:]{2,32}):\s*$/);
    if (!labelOnly || i + 1 >= lines.length) continue;

    const next = lines[i + 1].trim();
    const nextNumber = next.match(/([0-9]+(?:[.,][0-9]+)?)\s*$/);
    if (nextNumber) {
      metrics.push({
        label: labelOnly[1].trim(),
        value: Number(nextNumber[1].replace(',', '.')),
      });
    }
  }

  const dedup = new Map<string, number>();
  for (const item of metrics) {
    if (!Number.isFinite(item.value)) continue;
    if (!dedup.has(item.label)) dedup.set(item.label, item.value);
  }
  return Array.from(dedup.entries()).map(([label, value]) => ({ label, value }));
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[€$,%\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseMarkdownTable(text: string): ParsedTable | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const start = lines.findIndex((line) => line.startsWith('|') && line.endsWith('|'));
  if (start < 0 || start + 2 >= lines.length) return null;

  const headerLine = lines[start];
  const separatorLine = lines[start + 1];
  if (!/^\|?\s*:?-{2,}/.test(separatorLine)) return null;

  const headers = headerLine.split('|').map((c) => c.trim()).filter(Boolean);
  const rows: string[][] = [];
  for (let i = start + 2; i < lines.length; i += 1) {
    const ln = lines[i];
    if (!ln.startsWith('|')) break;
    const cols = ln.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length) rows.push(cols);
  }
  if (!headers.length || !rows.length) return null;
  return { headers, rows };
}

function buildKpisFromTable(table: ParsedTable): ParsedKpi[] {
  const kpis: ParsedKpi[] = [];
  for (let c = 0; c < table.headers.length; c += 1) {
    const nums = table.rows.map((r) => parseNumber(r[c] || '')).filter((n): n is number => n !== null);
    if (!nums.length) continue;
    const total = nums.reduce((a, b) => a + b, 0);
    kpis.push({ label: table.headers[c], value: total });
  }
  return kpis.slice(0, 3);
}

function buildSeriesFromTable(table: ParsedTable): ParsedMetric[] {
  if (table.headers.length < 2) return [];
  const labelIndex = 0;
  const numericIndex = table.rows[0].findIndex((_, idx) => parseNumber(table.rows[0][idx] || '') !== null);
  if (numericIndex < 0) return [];
  return table.rows
    .map((row) => ({
      label: row[labelIndex] || 'N/D',
      value: parseNumber(row[numericIndex] || '') || 0,
    }))
    .filter((x) => Number.isFinite(x.value))
    .slice(0, 8);
}

function cleanChartArtifacts(text: string): string {
  const boxCharsRegex = /[│┃┆┇┊┋║╎╏╵╷╹╻╽╿┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋─━│┃┄┅┈┉┌┐└┘]/g;
  const barsRegex = /[█▇▆▅▄▃▂▁]+/g;

  return text
    .split('\n')
    .map((line) => line.replace(boxCharsRegex, ' ').replace(barsRegex, ' '))
    .map((line) => line.replace(/\s{2,}/g, ' ').trimEnd())
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^[=._\-:]{4,}$/.test(trimmed)) return false;
      if (/^[|:]{3,}$/.test(trimmed)) return false;
      if (/^[0-9.,\s%\-]+$/.test(trimmed) && trimmed.length < 8) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractAssistantText(payload: any): string {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload.content === 'string') return payload.content;
  if (typeof payload.text === 'string') return payload.text;
  if (typeof payload.response === 'string') return payload.response;
  if (payload.data) {
    const nested = extractAssistantText(payload.data);
    if (nested) return nested;
  }
  return '';
}

export function ChatScreen() {
  const theme = useTheme();
  const {
    messages,
    isStreaming,
    currentStreamText,
    mode,
    addMessage,
    setStreaming,
    appendStreamText,
    finalizeStream,
    setMode,
    clearChat,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 || currentStreamText) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, currentStreamText]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const preparedQuestion = mode === 'presentacion'
      ? `Genera una presentación ejecutiva clara para dirección.\n\n${trimmed}`
      : trimmed;

    const userMsg: ChatMessage = {
      role: 'user',
      content: preparedQuestion,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);

    try {
      // SSE streaming via fetch
      const url = apiClient.getChatStreamUrl();
      const apiMessages = [
        ...messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: preparedQuestion,
        },
      ];
      const body = JSON.stringify({
        messages: apiMessages,
        mode,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client': 'mobile',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // SSE streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: isDone } = await reader.read();
          done = isDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            // Parse SSE data lines
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(data);
                  const chunkText =
                    extractAssistantText(parsed) ||
                    parsed.delta ||
                    '';
                  if (chunkText) appendStreamText(chunkText);
                } catch {
                  // If it's not JSON, it's plain text
                  if (data.trim()) {
                    appendStreamText(data);
                  }
                }
              }
            }
          }
        }
      } else {
        // JSON response (non-streaming fallback)
        const json = await response.json();
        const content = extractAssistantText(json) || JSON.stringify(json);
        appendStreamText(content);
      }
    } catch (err: any) {
      appendStreamText(`\n\n❌ Error: ${err?.message || 'Error desconocido'}`);
    } finally {
      finalizeStream();
    }
  };

  const handleExportPresentation = async () => {
    if (isExporting || isStreaming) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content.trim());
    if (!lastAssistant) {
      Alert.alert('Exportación', 'Primero genera una respuesta en el chat para poder exportarla.');
      return;
    }

    try {
      setIsExporting(true);
      const result = await apiClient.exportPresentation(
        lastAssistant.content,
        'Presentación IA móvil',
        ['html']
      );
      if (!result.ok || !result.artifact) {
        throw new Error(result.error || 'No se pudo exportar la presentación');
      }

      const files = result.artifact.files || {};
      const preferred = files.html?.public_url || files.html?.url;
      const target = preferred
        ? (preferred.startsWith('http') ? preferred : `${apiClient.getBaseUrl()}${preferred}`)
        : null;

      if (target) {
        Alert.alert('Exportación lista', 'Se generó la presentación. Se abrirá el archivo.');
        await Linking.openURL(target);
      } else {
        Alert.alert('Exportación lista', 'Presentación generada, pero sin URL de archivo disponible.');
      }
    } catch (err: any) {
      Alert.alert('Error exportando', err?.message || 'Error desconocido');
    } finally {
      setIsExporting(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    const content = isUser ? item.content : formatForMobile(item.content);
    const table = isUser ? null : parseMarkdownTable(content);
    const tableKpis = table ? buildKpisFromTable(table) : [];
    const metrics = isUser ? [] : (table ? buildSeriesFromTable(table) : parseMetrics(content));
    const metricMax = metrics.length ? Math.max(...metrics.map((m) => m.value), 1) : 1;
    const cleanedContent = isUser ? content : cleanChartArtifacts(content);
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          {
            backgroundColor: isUser
              ? theme.colors.chatBubbleUser
              : theme.colors.chatBubbleAI,
            ...(isUser ? {} : { borderWidth: 1, borderColor: theme.colors.border }),
          },
        ]}
      >
        {!isUser && (
          <Text style={[styles.messageRole, { color: theme.colors.accentBlue }]}>
            🤖 Invia AI
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            {
              color: isUser
                ? theme.colors.chatTextUser
                : theme.colors.chatTextAI,
            },
          ]}
          selectable
        >
          {cleanedContent}
        </Text>
        {!isUser && metrics.length >= 2 && (
          <View style={styles.metricWrap}>
            {metrics.slice(0, 8).map((metric, metricIndex) => (
              <View key={`${metric.label}-${metricIndex}`} style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: theme.colors.textPrimary }]}>
                  {metric.label}
                </Text>
                <View
                  style={[
                    styles.metricBarBg,
                    { backgroundColor: theme.colors.bgSecondary, borderColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        backgroundColor: theme.colors.accentBlue,
                        width: `${Math.max(4, (metric.value / metricMax) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.metricValue, { color: theme.colors.textMuted }]}>
                  {Number.isInteger(metric.value) ? metric.value : metric.value.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        )}
        {!isUser && tableKpis.length > 0 && (
          <View style={styles.kpiWrap}>
            {tableKpis.map((kpi, kpiIdx) => (
              <View
                key={`${kpi.label}-${kpiIdx}`}
                style={[
                  styles.kpiCard,
                  { backgroundColor: theme.colors.bgSecondary, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>{kpi.label}</Text>
                <Text style={[styles.kpiValue, { color: theme.colors.textPrimary }]}>
                  {Number.isInteger(kpi.value) ? kpi.value : kpi.value.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        )}
        {!isUser && table && (
          <View style={[styles.tableWrap, { borderColor: theme.colors.border }]}>
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.colors.bgSecondary }]}>
              {table.headers.slice(0, 4).map((h, i) => (
                <Text key={`h-${i}`} style={[styles.tableCell, styles.tableHeadText, { color: theme.colors.textPrimary }]}>
                  {h}
                </Text>
              ))}
            </View>
            {table.rows.slice(0, 6).map((r, ridx) => (
              <View key={`r-${ridx}`} style={[styles.tableRow, ridx % 2 === 1 && { backgroundColor: theme.colors.bgSecondary }]}>
                {r.slice(0, 4).map((c, cidx) => (
                  <Text key={`c-${ridx}-${cidx}`} style={[styles.tableCell, { color: theme.colors.textPrimary }]}>
                    {c}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
        {item.timestamp && (
          <Text
            style={[
              styles.messageTime,
              {
                color: isUser
                  ? 'rgba(255,255,255,0.6)'
                  : theme.colors.textMuted,
              },
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    );
  };

  // Build data including streaming message
  const displayMessages = [
    ...messages,
    ...(isStreaming && currentStreamText
      ? [
          {
            role: 'assistant' as const,
            content: currentStreamText + ' ▌',
            timestamp: Date.now(),
          },
        ]
      : []),
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Mode Selector */}
      <View
        style={[
          styles.modeBar,
          {
            backgroundColor: theme.colors.bgSecondary,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === 'pro' && {
              backgroundColor: theme.colors.accentBlue,
            },
          ]}
          onPress={() => setMode('pro')}
        >
          <Text
            style={[
              styles.modeBtnText,
              { color: mode === 'pro' ? '#fff' : theme.colors.textMuted },
            ]}
          >
            🧠 PRO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === 'rapido' && {
              backgroundColor: theme.colors.accentGreen,
            },
          ]}
          onPress={() => setMode('rapido')}
        >
          <Text
            style={[
              styles.modeBtnText,
              {
                color: mode === 'rapido' ? '#fff' : theme.colors.textMuted,
              },
            ]}
          >
            ⚡ Rápido
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            mode === 'presentacion' && {
              backgroundColor: theme.colors.accentPurple,
            },
          ]}
          onPress={() => setMode('presentacion')}
        >
          <Text
            style={[
              styles.modeBtnText,
              {
                color: mode === 'presentacion' ? '#fff' : theme.colors.textMuted,
              },
            ]}
          >
            📽️ Presentación
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleExportPresentation}
          style={styles.clearBtn}
          disabled={isExporting || isStreaming}
        >
          <Text style={[styles.clearBtnText, { color: theme.colors.textMuted }]}>
            {isExporting ? '⏳' : '⬇️'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Text style={[styles.clearBtnText, { color: theme.colors.textMuted }]}>
            🗑️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={displayMessages}
        renderItem={renderMessage}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[styles.emptyChatEmoji]}>💬</Text>
            <Text
              style={[styles.emptyChatTitle, { color: theme.colors.textPrimary }]}
            >
              Chat IA Invia
            </Text>
            <Text
              style={[styles.emptyChatSubtitle, { color: theme.colors.textMuted }]}
            >
              Pregunta sobre datos de ventas, clima, tendencias y más.{'\n'}
              La IA tiene acceso a todo el pipeline.
            </Text>
          </View>
        }
      />

      {/* Streaming Indicator */}
      {isStreaming && !currentStreamText && (
        <View style={styles.streamingIndicator}>
          <ActivityIndicator size="small" color={theme.colors.accentBlue} />
          <Text style={[styles.streamingText, { color: theme.colors.textMuted }]}>
            Pensando...
          </Text>
        </View>
      )}

      {/* Input Bar */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.colors.bgCard,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.colors.inputBg,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.textPrimary,
            },
          ]}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={theme.colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!isStreaming}
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: isStreaming
                ? theme.colors.textMuted
                : theme.colors.accentBlue,
            },
          ]}
          onPress={handleSend}
          disabled={isStreaming || !input.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 8,
  },
  clearBtnText: {
    fontSize: 18,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '90%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageRole: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'left',
    flexShrink: 1,
    letterSpacing: 0.1,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  metricWrap: {
    marginTop: 10,
    gap: 8,
  },
  metricRow: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricBarBg: {
    height: 8,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  metricValue: {
    fontSize: 11,
    textAlign: 'right',
  },
  kpiWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  tableWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeadText: {
    fontWeight: '700',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  streamingText: {
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
