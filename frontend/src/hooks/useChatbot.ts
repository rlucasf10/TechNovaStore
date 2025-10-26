import { useState, useCallback, useRef, useEffect } from 'react'
import { ChatMessage, ChatbotResponse } from '@/types'
import api from '@/lib/api'
import axios from 'axios'
import { handleApiError } from '@/middleware/errorHandler'

interface UseChatbotReturn {
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
  sendMessage: (_content: string) => Promise<void>
  clearChat: () => void
  sessionId: string | null
}

export const useChatbot = (): UseChatbotReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messageIdCounter = useRef(0)

  // Initialize chat session
  useEffect(() => {
    initializeSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const initializeSession = async () => {
    try {
      // Use the configured api instance that handles CSRF tokens
      const chatApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000',
        timeout: 30000, // Increased to 30 seconds
        withCredentials: true,
      })

      // Get CSRF token first
      const sessionIdTemp = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const csrfResponse = await chatApi.get('/api/csrf-token', {
        headers: {
          'X-Session-ID': sessionIdTemp,
        },
      })

      const csrfToken = csrfResponse.data.csrfToken || csrfResponse.data.token

      // Now make the session request with CSRF token
      const response = await chatApi.post('/api/chat/session', {}, {
        headers: {
          'X-CSRF-Token': csrfToken,
          'X-Session-ID': sessionIdTemp,
        },
      })
      setSessionId(response.data.session_id)

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: generateMessageId(),
        content: '¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          quick_replies: [
            'Ver productos populares',
            'Buscar por categoría',
            'Ayuda con mi pedido',
            'Recomendaciones personalizadas'
          ]
        }
      }
      setMessages([welcomeMessage])
    } catch (error) {
      const handledError = handleApiError(error)
      if (handledError) {
        console.error('Error initializing chat session:', handledError)
      }
      // Fallback to local session with welcome message
      setSessionId(`local_${Date.now()}`)

      const welcomeMessage: ChatMessage = {
        id: generateMessageId(),
        content: '¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy? (Modo offline)',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          quick_replies: [
            'Ver productos populares',
            'Buscar por categoría',
            'Ayuda con mi pedido',
            'Recomendaciones personalizadas'
          ]
        }
      }
      setMessages([welcomeMessage])
    }
  }

  const generateMessageId = (): string => {
    messageIdCounter.current += 1
    return `msg_${Date.now()}_${messageIdCounter.current}`
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await api.post('/chat/chat', {
        message: content.trim(),
        sessionId: sessionId,
        userId: undefined,
        context: {
          last_messages: messages.slice(-5) // Send last 5 messages for context
        }
      })

      const botResponse: ChatbotResponse = response.data

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

      const botMessage: ChatMessage = {
        id: generateMessageId(),
        content: botResponse.message,
        sender: 'bot',
        timestamp: new Date(),
        type: botResponse.type,
        metadata: {
          products: botResponse.products?.map(rec => rec.product),
          quick_replies: botResponse.quick_replies,
          intent: botResponse.intent,
          confidence: botResponse.confidence
        }
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const handledError = handleApiError(error)
      if (handledError) {
        console.error('Error sending message:', handledError)
      }

      // Smart fallback responses based on user input
      let fallbackResponse = 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo o contacta con nuestro soporte.'
      let fallbackType: 'text' | 'quick_reply' = 'text'
      let fallbackQuickReplies: string[] = []

      const lowerContent = content.toLowerCase()

      if (lowerContent.includes('producto') || lowerContent.includes('buscar') || lowerContent.includes('encontrar')) {
        fallbackResponse = 'No puedo conectar con el sistema de búsqueda ahora mismo. Puedes navegar por nuestro catálogo directamente o intentar más tarde.'
        fallbackType = 'quick_reply'
        fallbackQuickReplies = ['Ver catálogo', 'Categorías', 'Ofertas']
      } else if (lowerContent.includes('pedido') || lowerContent.includes('orden') || lowerContent.includes('compra')) {
        fallbackResponse = 'Para consultas sobre pedidos, puedes revisar tu historial en el dashboard o contactar con soporte.'
        fallbackType = 'quick_reply'
        fallbackQuickReplies = ['Mi dashboard', 'Contactar soporte']
      } else if (lowerContent.includes('precio') || lowerContent.includes('costo') || lowerContent.includes('€')) {
        fallbackResponse = 'Los precios se actualizan constantemente. Te recomiendo revisar directamente en la página del producto.'
        fallbackType = 'quick_reply'
        fallbackQuickReplies = ['Ver productos', 'Ofertas especiales']
      }

      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        content: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: fallbackType,
        metadata: fallbackQuickReplies.length > 0 ? { quick_replies: fallbackQuickReplies } : undefined
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }, [sessionId, messages, isLoading])

  const clearChat = useCallback(() => {
    setMessages([])
    initializeSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearChat,
    sessionId
  }
}