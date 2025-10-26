'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChatbot } from '@/hooks/useChatbot'
import { 
  ChatMessage, 
  ChatInput, 
  ChatRecommendationCard, 
  ChatTypingIndicator, 
  QuickReplies 
} from './index'

interface ChatWidgetProps {
  className?: string
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, isTyping, sendMessage } = useChatbot()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
  }

  const unreadCount = messages.filter(msg => 
    msg.sender === 'bot' && 
    msg.timestamp > new Date(Date.now() - 30000) // Last 30 seconds
  ).length

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105"
          aria-label="Abrir chat"
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
          
          {/* Unread indicator */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-96 w-80'
        }`}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Asistente Virtual</h3>
                <p className="text-xs opacity-90">
                  {isTyping ? 'Escribiendo...' : 'En línea'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMinimize}
                className="text-white hover:bg-blue-700 rounded p-1"
                aria-label="Minimizar chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
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

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((message) => (
                  <div key={message.id}>
                    <ChatMessage message={message} />
                    
                    {/* Product Recommendations */}
                    {message.metadata?.products && message.metadata.products.length > 0 && (
                      <ChatRecommendationCard 
                        products={message.metadata.products}
                        title={message.metadata.intent === 'product_search' ? 'Productos encontrados' : 'Te recomendamos'}
                        reason={message.metadata.intent ? `Basado en tu búsqueda` : undefined}
                        className="mt-2"
                      />
                    )}
                    
                    {/* Quick Replies */}
                    {message.metadata?.quick_replies && message.metadata.quick_replies.length > 0 && (
                      <QuickReplies
                        replies={message.metadata.quick_replies}
                        onReplyClick={handleQuickReply}
                        className="mt-2"
                      />
                    )}
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <ChatTypingIndicator />
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-3">
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