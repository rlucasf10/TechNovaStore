/**
 * Suppress browser extension errors that appear in the console
 * These errors are caused by browser extensions trying to communicate with the page
 * and are not actual application errors
 */
export function suppressExtensionErrors() {
  if (typeof window === 'undefined') return

  // Suppress the "message channel closed" error from browser extensions
  const originalError = console.error
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || ''
    
    // Filter out known extension-related errors
    const extensionErrors = [
      'message channel closed',
      'Extension context invalidated',
      'Could not establish connection',
      'Receiving end does not exist',
    ]
    
    const isExtensionError = extensionErrors.some(msg => 
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    )
    
    if (!isExtensionError) {
      originalError.apply(console, args)
    }
  }
}
