// Error handler middleware for API calls
export const handleApiError = (error: any) => {
  // Suppress browser extension errors
  if (error.message?.includes('message channel closed') || 
      error.message?.includes('listener indicated an asynchronous response')) {
    console.debug('Browser extension error suppressed:', error.message)
    return null
  }

  // Handle CSRF token errors
  if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
    console.warn('CSRF token error, retrying...')
    // Could implement retry logic here
    return error
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
    console.warn('Network error, service may be unavailable')
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