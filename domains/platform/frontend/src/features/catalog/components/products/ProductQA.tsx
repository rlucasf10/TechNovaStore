'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatbot } from '@/support'
import { Product } from '@/types'
import { 
  ChatMessage, 
  ChatInput, 
  ChatRecommendationCard, 
  ChatTypingIndicator
} from '@/support'
import { Button } from '@/ui'

interface ProductQAProps {
  product: Product
  className?: string
}

/**
 * Componente de Preguntas y Respuestas embebido para la página de detalle de producto.
 * Integra el chatbot con contexto pre-cargado del producto actual.
 */
export function ProductQA({ product, className = '' }: ProductQAProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [contextInitialized, setContextInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, isTyping, sendMessage, sessionId } = useChatbot()

  // Preparar contexto del producto cuando se expande por primera vez
  useEffect(() => {
    if (isExpanded && !contextInitialized && sessionId) {
      // Marcar como inicializado
      setContextInitialized(true)
      
      // NOTA: En una implementación completa, aquí se enviaría el contexto del producto
      // al backend mediante un endpoint específico (ej: POST /api/chat/context)
      // El contexto incluiría: productId, name, sku, brand, category, price, description, specifications
      // Por ahora, el contexto se puede incluir en los mensajes del usuario cuando sea relevante
    }
  }, [isExpanded, contextInitialized, sessionId])

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current && isExpanded && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isExpanded])

  // Función para manejar preguntas sugeridas
  const handleSuggestedQuestion = (question: string) => {
    setIsExpanded(true)
    sendMessage(question)
  }

  const handleAskQuestion = () => {
    setIsExpanded(true)
  }

  // Preguntas frecuentes sugeridas basadas en el producto
  const suggestedQuestions = [
    `¿Cuáles son las especificaciones técnicas de ${product.name}?`,
    `¿Este producto es compatible con otros dispositivos?`,
    `¿Cuál es el tiempo de entrega?`,
    `¿Tiene garantía este producto?`
  ]

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Preguntas y Respuestas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ¿Tienes dudas sobre este producto? Nuestro asistente virtual está aquí para ayudarte
                </p>
              </div>
            </div>
          </div>
          
          {!isExpanded && (
            <Button
              onClick={handleAskQuestion}
              variant="primary"
              size="md"
              iconLeft={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              Hacer una pregunta
            </Button>
          )}
        </div>

        {/* Preguntas sugeridas (solo si el chat no está expandido) */}
        {!isExpanded && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preguntas frecuentes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{question}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Area (solo visible cuando está expandido) */}
      {isExpanded && (
        <div className="flex flex-col">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-slate-900/50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  ¡Hola! Estoy aquí para ayudarte
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Puedo responder preguntas sobre {product.name}, sus especificaciones técnicas, 
                  compatibilidad, garantía y más. ¿En qué puedo ayudarte?
                </p>
              </div>
            )}

            {messages.map((message) => {
              // Adaptar el mensaje del store al formato esperado por ChatMessage
              const adaptedMessage = {
                id: message.id,
                content: message.content,
                sender: message.role === 'user' ? 'user' as const : 'bot' as const,
                timestamp: message.timestamp,
                type: 'text' as const,
                metadata: {
                  isStreaming: message.isStreaming
                }
              }
              
              return (
                <div key={message.id}>
                  <ChatMessage message={adaptedMessage} />
                  
                  {/* Product Recommendations */}
                  {message.products && message.products.length > 0 && (
                    <ChatRecommendationCard 
                      products={message.products as unknown as Product[]}
                      title="Te recomendamos"
                      className="mt-2"
                    />
                  )}
                </div>
              )
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <ChatTypingIndicator />
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            <ChatInput
              onSendMessage={sendMessage}
              disabled={isLoading}
              placeholder={`Pregunta sobre ${product.name}...`}
            />
            
            {/* Información adicional */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Asistente virtual activo</span>
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Minimizar chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
