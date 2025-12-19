'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { handleApiError } from '@/middleware/errorHandler'
import { useChatStore, ChatMessage } from '@/support/store/chat.store'
import { useAuthStore } from '@/customer/store/auth.store'
import { chatService } from '@/shared/services/chatService'

// Variable global fuera de React para evitar doble inicialización en Strict Mode
let globalInitialized = false

interface UseChatbotReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
  sendMessage: (_content: string) => Promise<void>
  clearChat: () => void
  sessionId: string | null
}

export const useChatbot = (): UseChatbotReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messageIdCounter = useRef(0)
  const streamingMessageRef = useRef<string>('')
  const currentMessageIdRef = useRef<string | null>(null)
  
  // Get store state and actions
  const { 
    messages, 
    sessionId, 
    addMessage, 
    updateMessage,
    setSessionId: setStoreSessionId,
    setConnectionStatus, 
    setFallback, 
    setTyping,
    clearMessages,
    setHasInitialized: setStoreHasInitialized
  } = useChatStore()
  
  // Get authentication state
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore()

  // Track previous auth state to detect login/logout
  const prevAuthRef = useRef<boolean | null>(null)
  const hasHandledAuthChange = useRef(false)

  // Initialize Socket.IO event handlers (solo una vez)
  useEffect(() => {
    // Setup Socket.IO event handlers
    chatService.setEventHandlers({
      onTyping: () => {
        setIsTyping(true)
        setTyping(true)
      },
      onChunk: (chunk: string, messageId: string) => {
        // Acumular chunks de streaming
        streamingMessageRef.current += chunk
        currentMessageIdRef.current = messageId
        
        // Usar getState() para evitar dependencia de messages
        const currentMessages = useChatStore.getState().messages
        if (currentMessages.find(m => m.id === messageId)) {
          updateMessage(messageId, {
            content: streamingMessageRef.current
          })
        } else {
          // Crear nuevo mensaje si no existe
          const streamingMessage: ChatMessage = {
            id: messageId,
            content: streamingMessageRef.current,
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(streamingMessage)
        }
      },
      onComplete: (fullMessage: string, messageId: string, products?: any[], usingFallback?: boolean) => {
        setIsTyping(false)
        setTyping(false)
        setIsLoading(false)
        setFallback(usingFallback || false)
        
        // Actualizar mensaje final
        updateMessage(messageId, {
          content: fullMessage,
          products: products
        })
        
        // Limpiar referencias
        streamingMessageRef.current = ''
        currentMessageIdRef.current = null
      },
      onError: async (error: string, messageId?: string) => {
        setIsTyping(false)
        setTyping(false)
        setIsLoading(false)
        
        // Si el error es "Sesión no encontrada", intentar reconectar SILENCIOSAMENTE
        if (error.includes('Sesión no encontrada')) {
          console.log('Sesión no encontrada, intentando crear nueva sesión silenciosamente...')
          setConnectionStatus('reconnecting')
          
          try {
            await connectToBackend()
            // NO mostrar mensaje - la reconexión es transparente para el usuario
            // El usuario simplemente puede enviar su mensaje de nuevo
          } catch (reconnectError) {
            setConnectionStatus('disconnected')
            
            // Solo mostrar error si la reconexión falla
            const errorMessage: ChatMessage = {
              id: messageId || generateMessageId(),
              content: 'No se pudo conectar con el servidor. Por favor, intenta de nuevo.',
              role: 'assistant',
              timestamp: new Date()
            }
            addMessage(errorMessage)
          }
        } else {
          setConnectionStatus('disconnected')
          
          // Mostrar mensaje de error para otros tipos de errores
          const errorMessage: ChatMessage = {
            id: messageId || generateMessageId(),
            content: `Error: ${error}. Por favor, intenta de nuevo.`,
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(errorMessage)
        }
        
        // Limpiar referencias
        streamingMessageRef.current = ''
        currentMessageIdRef.current = null
      },
      onConnectionChange: (status: 'connected' | 'disconnected' | 'reconnecting') => {
        console.log('[useChatbot] Estado de conexión:', status)
        setConnectionStatus(status)
      },
      onReconnectAttempt: (attemptNumber: number) => {
        console.log(`[useChatbot] Intento de reconexión #${attemptNumber}`)
        setConnectionStatus('reconnecting')
      },
      onReconnectFailed: () => {
        console.error('[useChatbot] Reconexión fallida')
        setConnectionStatus('disconnected')
        
        // Mostrar mensaje al usuario
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          content: 'No se pudo reconectar con el servidor. Por favor, recarga la página o intenta más tarde.',
          role: 'assistant',
          timestamp: new Date()
        }
        addMessage(errorMessage)
      }
    })
    
    // Cleanup on unmount
    return () => {
      chatService.clearEventHandlers()
    }
  }, [setIsTyping, setTyping, setFallback, setConnectionStatus, addMessage, updateMessage])

  // Initialize chat session only after auth state is loaded and only once
  useEffect(() => {
    // Use global variable to prevent double initialization in React Strict Mode
    if (!authLoading && !globalInitialized) {
      globalInitialized = true
      setStoreHasInitialized(true)
      prevAuthRef.current = isAuthenticated
      
      // Only initialize if there are no persisted messages
      if (messages.length === 0) {
        initializeSession()
      } else {
        // If we have persisted messages, just ensure we have a session and are connected
        if (!sessionId) {
          setStoreSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
        }
        setConnectionStatus('connected')
        setFallback(false)
      }
    }
  }, [authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update welcome message when user logs in or out (only once per change)
  useEffect(() => {
    if (authLoading || !globalInitialized) return
    
    // Detect auth state change (login or logout)
    if (prevAuthRef.current !== null && prevAuthRef.current !== isAuthenticated && !hasHandledAuthChange.current) {
      hasHandledAuthChange.current = true
      
      // Clear chat and add new welcome message
      clearMessages()
      
      // Mensaje de bienvenida personalizado si está autenticado, genérico si no
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}_welcome`,
        content: isAuthenticated && user?.firstName 
          ? `¡Hola ${user.firstName}! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?`
          : '¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?',
        role: 'assistant',
        timestamp: new Date()
      }
      
      // Small delay to ensure clearMessages completes
      setTimeout(() => {
        // Check if messages were already added
        const currentMsgs = useChatStore.getState().messages
        if (currentMsgs.length === 0) {
          addMessage(welcomeMessage)
        }
        hasHandledAuthChange.current = false
      }, 50)
    }
    
    prevAuthRef.current = isAuthenticated
  }, [isAuthenticated, authLoading, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSession = async () => {
    // SIEMPRE limpiar sessionId antiguo del store para forzar creación de nueva sesión
    // Esto previene el error "Sesión no encontrada" al recargar la página
    const currentSessionId = useChatStore.getState().sessionId
    if (currentSessionId) {
      console.log('Limpiando sessionId antiguo:', currentSessionId)
      setStoreSessionId(null)
    }
    
    // Don't initialize if we already have messages (from persistence)
    const currentMessages = useChatStore.getState().messages
    if (currentMessages.length > 0) {
      // Pero sí necesitamos conectar al backend y crear nueva sesión
      connectToBackend()
      return
    }
    
    // Add welcome message IMMEDIATELY (before connecting)
    // Mensaje personalizado si está autenticado, genérico si no
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      content: isAuthenticated && user?.firstName 
        ? `¡Hola ${user.firstName}! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?`
        : '¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?',
      role: 'assistant',
      timestamp: new Date()
    }
    
    // Check again before adding (in case of race condition)
    if (useChatStore.getState().messages.length === 0) {
      addMessage(welcomeMessage)
    }
    
    // Connect to backend in background (non-blocking)
    connectToBackend()
  }
  
  const connectToBackend = async () => {
    try {
      // Set connecting status (pero NO mostrar mensaje al usuario)
      setConnectionStatus('reconnecting')
      
      // Inicializar Socket.IO
      await chatService.initialize()
      
      // Crear sesión de chat
      const newSessionId = await chatService.createSession({
        userId: user?.id ? Number(user.id) : undefined,
        context: {}
      })
      
      setStoreSessionId(newSessionId)
      
      // Unirse a la sesión creada
      chatService.joinSession(newSessionId)
      
      // Conectado exitosamente - NO mostrar mensaje
      setConnectionStatus('connected')
      setFallback(false)
    } catch (error) {
      console.error('Error connecting to chatbot:', error)
      
      // Fallback: crear sesión local
      setStoreSessionId(`local_${Date.now()}`)
      setConnectionStatus('disconnected')
      setFallback(true)
    }
  }

  const generateMessageId = (): string => {
    messageIdCounter.current += 1
    return `msg_${Date.now()}_${messageIdCounter.current}`
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // Obtener sessionId actual del store
    const currentSessionId = useChatStore.getState().sessionId
    if (!currentSessionId) {
      console.error('No session ID available')
      return
    }

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date()
    }

    addMessage(userMessage)
    setIsLoading(true)
    
    // Limpiar mensaje de streaming anterior
    streamingMessageRef.current = ''
    currentMessageIdRef.current = null

    try {
      // Verificar conexión de Socket.IO
      if (!chatService.isConnected()) {
        console.log('Socket not connected, attempting to reconnect...')
        await chatService.initialize()
        
        // Si tenemos sessionId, unirse a la sesión
        if (currentSessionId) {
          chatService.joinSession(currentSessionId)
        }
      }
      
      // Obtener proveedor AI preferido del store
      const preferredProvider = useChatStore.getState().aiProvider
      
      // Enviar mensaje mediante Socket.IO con streaming
      chatService.sendMessage({
        sessionId: currentSessionId,
        message: content.trim(),
        context: {},
        aiProvider: preferredProvider
      })
      
      // Timeout de seguridad: si no hay respuesta en 30 segundos, mostrar error
      setTimeout(() => {
        if (isLoading && !currentMessageIdRef.current) {
          setIsLoading(false)
          setIsTyping(false)
          setTyping(false)
          
          const timeoutMessage: ChatMessage = {
            id: generateMessageId(),
            content: 'La respuesta está tardando más de lo esperado. Por favor, intenta de nuevo.',
            role: 'assistant',
            timestamp: new Date()
          }
          addMessage(timeoutMessage)
        }
      }, 30000)
      
    } catch (error) {
      const handledError = handleApiError(error)
      if (handledError) {
        console.error('Error sending message:', handledError)
      }
      
      // Connection error - update status
      setConnectionStatus('disconnected')
      setFallback(true)

      // Smart fallback responses based on user input
      let fallbackResponse = 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo o contacta con nuestro soporte.'

      const lowerContent = content.toLowerCase()

      if (lowerContent.includes('producto') || lowerContent.includes('buscar') || lowerContent.includes('encontrar')) {
        fallbackResponse = 'No puedo conectar con el sistema de búsqueda ahora mismo. Puedes navegar por nuestro catálogo directamente o intentar más tarde.'
      } else if (lowerContent.includes('pedido') || lowerContent.includes('orden') || lowerContent.includes('compra')) {
        fallbackResponse = 'Para consultas sobre pedidos, puedes revisar tu historial en el dashboard o contactar con soporte.'
      } else if (lowerContent.includes('precio') || lowerContent.includes('costo') || lowerContent.includes('€')) {
        fallbackResponse = 'Los precios se actualizan constantemente. Te recomiendo revisar directamente en la página del producto.'
      }

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        content: fallbackResponse,
        role: 'assistant',
        timestamp: new Date()
      }
      addMessage(errorMessage)
      
      setIsLoading(false)
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, setConnectionStatus, setFallback, addMessage, setIsTyping, setTyping])

  const clearChat = useCallback(() => {
    clearMessages()
    globalInitialized = false
    setStoreHasInitialized(false)
    initializeSession()
  }, [clearMessages, setStoreHasInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearChat,
    sessionId
  }
}