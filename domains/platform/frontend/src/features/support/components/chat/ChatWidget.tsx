'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useChatbot } from '@/support'
import { useChatStore } from '@/support/store/chat.store'
import { 
  ChatMessage, 
  ChatInput, 
  ChatTypingIndicator,
  ConnectionStatusIndicator,
  FallbackModeBadge,
  AIProviderToggle,
  ReconnectionBanner
} from './index'
import styles from './ChatWidget.module.css'

interface ChatWidgetProps {
  className?: string
}

// Tamaños por defecto
const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 600
const MIN_WIDTH = 320
const MIN_HEIGHT = 400
const MAX_WIDTH = 800
const MAX_HEIGHT = 900

export const ChatWidget: React.FC<ChatWidgetProps> = ({ className = '' }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, isTyping, sendMessage } = useChatbot()
  
  // Get state from store
  const { 
    isOpen, 
    isMinimized, 
    connectionStatus, 
    usingFallback,
    aiProvider,
    setOpen,
    setMinimized,
    unreadCount
  } = useChatStore()
  
  // Estado para redimensionamiento
  const [chatSize, setChatSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleToggle = () => {
    setOpen(!isOpen)
    if (!isOpen) {
      setMinimized(false)
    }
  }

  const handleMinimize = () => {
    setMinimized(!isMinimized)
  }

  // Manejo de redimensionamiento
  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    if (isMobile) return // No permitir redimensionar en móvil
    
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
  }

  useEffect(() => {
    if (!isResizing) {
      document.body.classList.remove('resizing')
      return
    }

    // Agregar clase al body para prevenir selección de texto
    document.body.classList.add('resizing')

    let animationFrameId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      // Cancelar frame anterior si existe
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      // Usar requestAnimationFrame para suavizar el redimensionamiento
      animationFrameId = requestAnimationFrame(() => {
        if (!chatWindowRef.current) return

        const rect = chatWindowRef.current.getBoundingClientRect()
        let newWidth = chatSize.width
        let newHeight = chatSize.height

        // Calcular nuevo tamaño según la dirección
        if (resizeDirection.includes('left')) {
          newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, rect.right - e.clientX))
        } else if (resizeDirection.includes('right')) {
          newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - rect.left))
        }

        if (resizeDirection.includes('top')) {
          newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, rect.bottom - e.clientY))
        } else if (resizeDirection.includes('bottom')) {
          newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, e.clientY - rect.top))
        }

        // Solo actualizar si hay cambio significativo (reduce re-renders)
        if (Math.abs(newWidth - chatSize.width) > 1 || Math.abs(newHeight - chatSize.height) > 1) {
          setChatSize({ width: newWidth, height: newHeight })
        }
      })
    }

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      setIsResizing(false)
      setResizeDirection('')
      document.body.classList.remove('resizing')
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.classList.remove('resizing')
    }
  }, [isResizing, resizeDirection, chatSize])

  // unreadCount viene del store

  return (
    <div className={`fixed z-50 ${className} ${isMobile && isOpen && !isMinimized ? 'inset-0' : 'bottom-4 right-4'}`}>
      {/* Chat Button - Botón flotante con animación de pulso */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105"
          aria-label="Abrir chat"
          style={{
            animation: 'pulse-subtle 3s ease-in-out infinite'
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          
          {/* Badge de notificación */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window - Redimensionable en desktop, fullscreen en móvil */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className={`bg-white flex flex-col relative ${
            isMinimized 
              ? 'h-14 w-96 max-w-[calc(100vw-2rem)] rounded-lg shadow-2xl border border-gray-200 transition-all duration-300' 
              : isMobile
                ? 'w-full h-full rounded-none border-0 shadow-none'
                : 'rounded-lg shadow-2xl border border-gray-200'
          } ${isResizing ? 'select-none' : ''}`}
          style={!isMinimized && !isMobile ? {
            width: `${chatSize.width}px`,
            height: `${chatSize.height}px`,
            maxWidth: '90vw',
            maxHeight: '90vh',
            willChange: isResizing ? 'width, height' : 'auto'
          } : isMobile && !isMinimized ? {
            width: '100%',
            height: '100%'
          } : undefined}
        >
          {/* Resize Handles - Solo en desktop */}
          {!isMinimized && !isMobile && (
            <>
              {/* Esquinas - Área de agarre más grande */}
              <div
                className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-300 transition-colors z-10 rounded-tl-lg"
                onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                title="Redimensionar"
              />
              
              <div
                className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-300 transition-colors z-10 rounded-tr-lg"
                onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                title="Redimensionar"
              />
              
              <div
                className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-300 transition-colors z-10 rounded-bl-lg"
                onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                title="Redimensionar"
              />
              
              {/* Esquina inferior derecha con icono visible */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-300 transition-colors z-10 rounded-br-lg group"
                onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                title="Redimensionar"
              >
                {/* Icono de redimensionamiento - Siempre visible */}
                <svg 
                  className="w-3 h-3 text-gray-400 group-hover:text-blue-600 absolute bottom-0.5 right-0.5 transition-colors" 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                >
                  <path d="M9 14l1-1 3 3-1 1-3-3zm5-5l-3-3 1-1 3 3-1 1z" transform="scale(0.8)"/>
                  <path d="M14.5 14.5l-1-1m-2-2l-1-1m-2-2l-1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              
              {/* Bordes laterales - Área de agarre de 2px */}
              <div
                className="absolute top-0 left-0 w-0.5 h-full cursor-w-resize hover:bg-blue-300 hover:w-1 transition-all"
                onMouseDown={(e) => handleMouseDown(e, 'left')}
              />
              <div
                className="absolute top-0 right-0 w-0.5 h-full cursor-e-resize hover:bg-blue-300 hover:w-1 transition-all"
                onMouseDown={(e) => handleMouseDown(e, 'right')}
              />
              <div
                className="absolute top-0 left-0 w-full h-0.5 cursor-n-resize hover:bg-blue-300 hover:h-1 transition-all"
                onMouseDown={(e) => handleMouseDown(e, 'top')}
              />
              <div
                className="absolute bottom-0 left-0 w-full h-0.5 cursor-s-resize hover:bg-blue-300 hover:h-1 transition-all"
                onMouseDown={(e) => handleMouseDown(e, 'bottom')}
              />
            </>
          )}
          
          {/* Indicador visual cuando está redimensionando */}
          {isResizing && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-20 pointer-events-none z-20 rounded-lg border-2 border-blue-400 border-dashed" />
          )}
          {/* Header */}
          <div className={`bg-blue-600 text-white p-4 flex-shrink-0 ${isMobile ? 'rounded-none' : 'rounded-t-lg'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Asistente Virtual</h3>
                  <p className="text-xs text-white opacity-90">
                    {isTyping ? 'Escribiendo...' : 'En línea'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMinimize}
                  className="text-white hover:bg-blue-700 rounded p-1"
                  aria-label={isMinimized ? "Restaurar chat" : "Minimizar chat"}
                >
                  {isMinimized ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleToggle}
                  className="text-white hover:bg-blue-700 rounded p-1"
                  aria-label="Cerrar chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Connection Status, AI Provider Toggle, and Fallback Mode Indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ConnectionStatusIndicator status={connectionStatus} />
                {(usingFallback || aiProvider === 'fallback') && (
                  <FallbackModeBadge />
                )}
              </div>
              
              <AIProviderToggle />
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages Area - Responsivo con altura dinámica usando flex */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0 ${styles['chat-messages']}`}>
                {/* Reconnection Banner */}
                <ReconnectionBanner status={connectionStatus} />
                {messages.map((message) => {
                  // Adaptar el mensaje del store al formato esperado por ChatMessage
                  const adaptedMessage = {
                    id: message.id,
                    content: message.content,
                    sender: message.role === 'user' ? 'user' as const : 'bot' as const,
                    timestamp: message.timestamp,
                    type: 'text' as const,
                    metadata: {
                      isStreaming: message.isStreaming,
                      products: message.products // Ya tiene el tipo correcto con price
                    }
                  }
                  
                  return (
                    <div key={message.id}>
                      <ChatMessage message={adaptedMessage} />
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
              <div className="border-t border-gray-200 p-3 flex-shrink-0">
                <ChatInput
                  onSendMessage={sendMessage}
                  disabled={isLoading}
                  placeholder="Escribe tu mensaje..."
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}