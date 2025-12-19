/**
 * Store del Chat Widget con Zustand
 * 
 * Maneja el estado del chat:
 * - Mensajes
 * - Estado de conexión
 * - Estado de escritura
 * - Modo fallback
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  isStreaming?: boolean;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type AIProvider = 'gemini' | 'fallback';

interface ChatState {
  // Estado
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  usingFallback: boolean;
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  unreadCount: number;
  aiProvider: AIProvider;
  hasInitialized: boolean;
  
  // Acciones
  setOpen: (isOpen: boolean) => void;
  setMinimized: (isMinimized: boolean) => void;
  toggleOpen: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> | ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setTyping: (isTyping: boolean) => void;
  setFallback: (usingFallback: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSessionId: (sessionId: string | null) => void;
  clearMessages: () => void;
  incrementUnread: () => void;
  resetUnread: () => void;
  setAIProvider: (provider: AIProvider) => void;
  toggleAIProvider: () => void;
  setHasInitialized: (hasInitialized: boolean) => void;
}

// Generar ID único para mensajes
const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
  // Estado inicial
  isOpen: false,
  isMinimized: false,
  messages: [],
  isTyping: false,
  usingFallback: false,
  connectionStatus: 'disconnected',
  sessionId: null,
  unreadCount: 0,
  aiProvider: 'gemini',
  hasInitialized: false,
  
  // Acciones
  setOpen: (isOpen: boolean) => {
    set({ isOpen });
    if (isOpen) {
      get().resetUnread();
    }
  },
  
  setMinimized: (isMinimized: boolean) => set({ isMinimized }),
  
  toggleOpen: () => {
    const newIsOpen = !get().isOpen;
    set({ isOpen: newIsOpen });
    if (newIsOpen) {
      get().resetUnread();
    }
  },
  
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> | ChatMessage) => {
    // Check if message already has id and timestamp (already formatted)
    const newMessage: ChatMessage = 'id' in message && 'timestamp' in message
      ? message as ChatMessage
      : {
          ...message,
          id: generateMessageId(),
          timestamp: new Date(),
        };
    
    set((state: ChatState) => ({
      messages: [...state.messages, newMessage],
    }));
    
    // Incrementar contador de no leídos si el chat está cerrado y es mensaje del bot
    if (!get().isOpen && message.role === 'assistant') {
      get().incrementUnread();
    }
  },
  
  updateMessage: (id: string, updates: Partial<ChatMessage>) => {
    set((state: ChatState) => ({
      messages: state.messages.map((msg: ChatMessage) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },
  
  setTyping: (isTyping: boolean) => set({ isTyping }),
  
  setFallback: (usingFallback: boolean) => set({ usingFallback }),
  
  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),
  
  setSessionId: (sessionId: string | null) => set({ sessionId }),
  
  clearMessages: () => set({ messages: [], unreadCount: 0 }),
  
  incrementUnread: () => set((state: ChatState) => ({ unreadCount: state.unreadCount + 1 })),
  
  resetUnread: () => set({ unreadCount: 0 }),
  
  setAIProvider: (provider: AIProvider) => set({ aiProvider: provider }),
  
  toggleAIProvider: () => {
    const current = get().aiProvider;
    const newProvider: AIProvider = current === 'gemini' ? 'fallback' : 'gemini';
    get().setAIProvider(newProvider);
  },
  
  setHasInitialized: (hasInitialized: boolean) => set({ hasInitialized }),
}),
    {
      name: 'chat-storage',
      // Persistir mensajes y sessionId
      partialize: (state: ChatState) => ({
        messages: state.messages,
        sessionId: state.sessionId,
        aiProvider: state.aiProvider,
        hasInitialized: state.hasInitialized,
      }),
    }
  )
);
