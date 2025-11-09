import axios from 'axios'

// Determine API URL based on environment
const getApiBaseUrl = () => {
  // If running in browser (client-side)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  }

  // If running on server (Docker container)
  return process.env.INTERNAL_API_URL || 'http://api-gateway:3000/api'
}

const API_BASE_URL = getApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for chatbot responses
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for CSRF
})

// CSRF token management
let csrfToken: string | null = null
let sessionId: string | null = null

// Function to get CSRF token
const getCSRFToken = async (): Promise<{ token: string; sessionId: string }> => {
  if (csrfToken && sessionId) {
    return { token: csrfToken, sessionId }
  }

  try {
    // Generate a session ID if we don't have one
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Use appropriate base URL for CSRF token endpoint
    const csrfBaseUrl = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')
      : (process.env.INTERNAL_API_URL?.replace('/api', '') || 'http://api-gateway:3000')

    const response = await axios.get(`${csrfBaseUrl}/api/csrf-token`, {
      headers: {
        'X-Session-ID': sessionId,
      },
      withCredentials: true,
    })

    csrfToken = response.data.csrfToken || response.data.token
    return { token: csrfToken!, sessionId: sessionId! }
  } catch (error) {
    console.error('Error getting CSRF token:', error)
    throw error
  }
}

// Request interceptor for auth token and CSRF
api.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for non-GET requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      try {
        const { token: csrf, sessionId: sid } = await getCSRFToken()
        config.headers['X-CSRF-Token'] = csrf
        config.headers['X-Session-ID'] = sid
      } catch (error) {
        console.warn('Failed to get CSRF token, continuing without it')
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
