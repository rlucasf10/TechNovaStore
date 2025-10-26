import React from 'react'
import { ChatMessage as ChatMessageType } from '@/types'

interface ChatMessageProps {
  message: ChatMessageType
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user'
  const isBot = message.sender === 'bot'

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-white text-gray-800 border border-gray-200'
      }`}>
        {/* Bot Avatar */}
        {isBot && (
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm leading-relaxed">
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(message.timestamp)}
                {message.metadata?.confidence && (
                  <span className="ml-2">
                    Confianza: {Math.round(message.metadata.confidence * 100)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Message */}
        {isUser && (
          <div>
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>
            <div className="text-xs text-blue-200 mt-1 text-right">
              {formatTime(message.timestamp)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}