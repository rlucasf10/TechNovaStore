'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSendMessage: (_message: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Escribe tu mensaje...'
}) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ajustar altura del textarea automáticamente según el contenido
  useEffect(() => {
    if (textareaRef.current) {
      // Resetear altura para calcular correctamente
      textareaRef.current.style.height = 'auto'
      // Calcular nueva altura (máximo 120px para ~5 líneas)
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      textareaRef.current?.focus()
    }
  }

  // Manejar teclas: Enter envía, Shift+Enter hace salto de línea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter sin Shift: enviar mensaje
      e.preventDefault()
      handleSubmit(e)
    }
    // Shift+Enter: comportamiento por defecto del textarea (nueva línea)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          id="chat-message-input"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none overflow-y-auto"
          maxLength={2000}
          autoComplete="off"
          rows={1}
          style={{ minHeight: '38px', maxHeight: '120px' }}
        />
        
        {/* Contador de caracteres */}
        {message.length > 1800 && (
          <div className="absolute -top-6 right-0 text-xs text-gray-500">
            {message.length}/2000
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors duration-200"
        aria-label="Enviar mensaje"
      >
        {disabled ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </form>
  )
}