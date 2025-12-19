import React from 'react'
import { render } from '@testing-library/react'
import * as TestingLibraryDom from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatWidget } from '@/support/components/chat/ChatWidget'
import { ChatProvider } from '@/support/contexts/ChatContext'

const { screen, fireEvent, waitFor } = TestingLibraryDom

// Mock del store de chat
const mockSetOpen = jest.fn()
const mockSetMinimized = jest.fn()

let mockIsOpen = false
let mockIsMinimized = false

jest.mock('@/support/store/chat.store', () => ({
  useChatStore: () => ({
    isOpen: mockIsOpen,
    isMinimized: mockIsMinimized,
    connectionStatus: 'connected',
    usingFallback: false,
    aiProvider: 'ollama',
    setOpen: (value: boolean) => {
      mockIsOpen = value
      mockSetOpen(value)
    },
    setMinimized: (value: boolean) => {
      mockIsMinimized = value
      mockSetMinimized(value)
    },
    unreadCount: 0
  })
}))

// Mock del store de auth
jest.mock('@/customer/store/auth.store', () => ({
  useAuthStore: () => ({
    isAuthenticated: true
  })
}))

// Mock del hook useChatbot
jest.mock('@/support/hooks/useChatbot', () => ({
  useChatbot: () => ({
    messages: [
      {
        id: '1',
        content: '¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: false,
        products: []
      }
    ],
    isLoading: false,
    isTyping: false,
    sendMessage: jest.fn(),
    clearChat: jest.fn(),
    sessionId: 'test-session'
  })
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        {children}
      </ChatProvider>
    </QueryClientProvider>
  )
}

describe('ChatWidget', () => {
  beforeEach(() => {
    // Resetear estado del mock antes de cada test
    mockIsOpen = false
    mockIsMinimized = false
    jest.clearAllMocks()
  })

  it('renders chat button when closed', () => {
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    expect(chatButton).toBeInTheDocument()
  })

  it('opens chat window when button is clicked', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    // Simular que el estado cambió
    mockIsOpen = true

    rerender(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Asistente Virtual')).toBeInTheDocument()
    })
  })

  it('displays welcome message when opened', async () => {
    // Iniciar con el chat abierto
    mockIsOpen = true

    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?')).toBeInTheDocument()
    })
  })

  it('has message input field', async () => {
    // Iniciar con el chat abierto
    mockIsOpen = true

    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    await waitFor(() => {
      const messageInput = screen.getByPlaceholderText('Escribe tu mensaje...')
      expect(messageInput).toBeInTheDocument()
    })
  })

  it('can be minimized', async () => {
    // Iniciar con el chat abierto
    mockIsOpen = true

    const { rerender } = render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    await waitFor(() => {
      const minimizeButton = screen.getByLabelText('Minimizar chat')
      expect(minimizeButton).toBeInTheDocument()
    })

    const minimizeButton = screen.getByLabelText('Minimizar chat')
    fireEvent.click(minimizeButton)

    // Simular que el estado cambió
    mockIsMinimized = true

    rerender(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    // Cuando está minimizado, no debería mostrar el input
    expect(screen.queryByPlaceholderText('Escribe tu mensaje...')).not.toBeInTheDocument()
  })

  it('can be closed', async () => {
    // Iniciar con el chat abierto
    mockIsOpen = true

    const { rerender } = render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Cerrar chat')
      expect(closeButton).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('Cerrar chat')
    fireEvent.click(closeButton)

    // Simular que el estado cambió
    mockIsOpen = false

    rerender(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    // Debería mostrar el botón de abrir chat nuevamente
    expect(screen.getByLabelText('Abrir chat')).toBeInTheDocument()
  })
})
