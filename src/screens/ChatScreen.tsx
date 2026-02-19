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
} from 'react-native';
import { useTheme } from '../theme';
import { useChatStore } from '../store/chatStore';
import { apiClient, type ChatMessage } from '../api/client';

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

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput('');
    setStreaming(true);

    try {
      // SSE streaming via fetch
      const url = apiClient.getChatStreamUrl();
      const body = JSON.stringify({
        message: trimmed,
        mode,
        history: messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                  if (parsed.content || parsed.delta || parsed.text) {
                    appendStreamText(parsed.content || parsed.delta || parsed.text);
                  }
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
        const content = json.response || json.content || JSON.stringify(json);
        appendStreamText(content);
      }
    } catch (err: any) {
      appendStreamText(`\n\n❌ Error: ${err?.message || 'Error desconocido'}`);
    } finally {
      finalizeStream();
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
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
          {item.content}
        </Text>
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
        <View style={{ flex: 1 }} />
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
    gap: 8,
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeBtnText: {
    fontSize: 13,
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
    maxWidth: '82%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
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
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
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
