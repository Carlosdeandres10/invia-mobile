/**
 * Chat Store — Manages chat messages and streaming state
 */
import { create } from 'zustand';
import { type ChatMessage } from '../api/client';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamText: string;
  mode: 'pro' | 'rapido' | 'presentacion';

  addMessage: (msg: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamText: (text: string) => void;
  finalizeStream: () => void;
  setMode: (mode: 'pro' | 'rapido' | 'presentacion') => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentStreamText: '',
  mode: 'pro',

  addMessage: (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
  },

  appendStreamText: (text) => {
    set((state) => ({ currentStreamText: state.currentStreamText + text }));
  },

  finalizeStream: () => {
    const { currentStreamText, messages } = get();
    if (currentStreamText.trim()) {
      set({
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: currentStreamText,
            timestamp: Date.now(),
          },
        ],
        currentStreamText: '',
        isStreaming: false,
      });
    } else {
      set({ currentStreamText: '', isStreaming: false });
    }
  },

  setMode: (mode) => set({ mode }),

  clearChat: () => set({ messages: [], currentStreamText: '', isStreaming: false }),
}));
