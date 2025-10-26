'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ChatContextType {
  isChatEnabled: boolean
  setChatEnabled: (_enabled: boolean) => void
  unreadCount: number
  setUnreadCount: (_count: number) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isChatEnabled, setChatEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const value = {
    isChatEnabled,
    setChatEnabled,
    unreadCount,
    setUnreadCount
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}