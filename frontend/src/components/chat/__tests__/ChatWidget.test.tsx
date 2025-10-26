import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatWidget } from '../ChatWidget'
import { ChatProvider } from '../../../contexts/ChatContext'

// Mock the useChatbot hook
jest.mock('../../../hooks/useChatbot', () => ({
  useChatbot: () => ({
    messages: [
      {
        id: '1',
        content: '¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          quick_replies: [
            'Ver productos populares',
            'Buscar por categoría',
            'Ayuda con mi pedido'
          ]
        }
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
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    await waitFor(() => {
      expect(screen.getByText('Asistente Virtual')).toBeInTheDocument()
    })
  })

  it('displays welcome message when opened', async () => {
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    await waitFor(() => {
      expect(screen.getByText('¡Hola! Soy tu asistente virtual de TechNovaStore. ¿En qué puedo ayudarte hoy?')).toBeInTheDocument()
    })
  })

  it('displays quick reply buttons', async () => {
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    await waitFor(() => {
      expect(screen.getByText('Ver productos populares')).toBeInTheDocument()
      expect(screen.getByText('Buscar por categoría')).toBeInTheDocument()
      expect(screen.getByText('Ayuda con mi pedido')).toBeInTheDocument()
    })
  })

  it('has message input field', async () => {
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    await waitFor(() => {
      const messageInput = screen.getByPlaceholderText('Escribe tu mensaje...')
      expect(messageInput).toBeInTheDocument()
    })
  })

  it('can be minimized', async () => {
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    await waitFor(() => {
      const minimizeButton = screen.getByLabelText('Minimizar chat')
      fireEvent.click(minimizeButton)

      // Should not show the message input when minimized
      expect(screen.queryByPlaceholderText('Escribe tu mensaje...')).not.toBeInTheDocument()
    })
  })

  it('can be closed', async () => {
    render(
      <TestWrapper>
        <ChatWidget />
      </TestWrapper>
    )

    const chatButton = screen.getByLabelText('Abrir chat')
    fireEvent.click(chatButton)

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Cerrar chat')
      fireEvent.click(closeButton)

      // Should show the chat button again
      expect(screen.getByLabelText('Abrir chat')).toBeInTheDocument()
    })
  })
})