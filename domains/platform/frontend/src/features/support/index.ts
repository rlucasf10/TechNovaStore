// Support Feature - Exports

// Components - Chat
export * from './components/chat/ChatWidget'
export { ChatMessage } from './components/chat/ChatMessage'
export * from './components/chat/ChatRecommendationCard'
export * from './components/chat/QuickReplies'
export * from './components/chat/ChatTypingIndicator'
export * from './components/chat/ChatInput'

// Hooks
export * from './hooks/useChatbot'
export * from './hooks/useTrackingUpdates'

// Contexts
export * from './contexts/ChatContext'

// Store (with explicit exports to avoid conflicts)
export {
  useChatStore,
  type ChatMessage as ChatMessageType
} from './store/chat.store'
