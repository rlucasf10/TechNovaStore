// Error handler middleware for API calls
export const handleApiError = (error: unknown) => {
  const err = error as { message?: string; response?: { status?: number; data?: { error?: string } }; code?: string }
  
  // Suppress browser extension errors
  if (err.message?.includes('message channel closed') || 
      err.message?.includes('listener indicated an asynchronous response')) {
    // Browser extension error suppressed
    return null
  }

  // Handle CSRF token errors
  if (err.response?.status === 403 && err.response?.data?.error?.includes('CSRF')) {
    // CSRF token error, retrying...
    // Could implement retry logic here
    return error
  }

  // Handle network errors
  if (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK') {
    // Network error, service may be unavailable
    return error
  }

  return error
}

// Suppress console errors from browser extensions
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args[0]?.toString() || ''
  
  // Suppress known browser extension errors
  if (message.includes('message channel closed') ||
      message.includes('listener indicated an asynchronous response') ||
      message.includes('Unable to add filesystem')) {
    return
  }
  
  originalConsoleError.apply(console, args)
}