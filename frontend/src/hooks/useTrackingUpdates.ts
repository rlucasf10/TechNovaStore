import { useEffect } from 'react'

interface TrackingUpdate {
  id: string
  order_id: number
  status: string
  description: string
  location?: string
  timestamp: string
  is_delivered: boolean
}

// eslint-disable-next-line no-unused-vars
export function useTrackingUpdates(onUpdate: (update: TrackingUpdate) => void) {
  useEffect(() => {
    // Set up WebSocket connection for real-time tracking updates
    const setupTrackingUpdates = () => {
      const eventSource = new EventSource('/api/tracking/stream')
      
      eventSource.onmessage = (event) => {
        const trackingUpdate = JSON.parse(event.data)
        onUpdate(trackingUpdate)
      }

      eventSource.onerror = (_error) => {
        console.error('Tracking stream error:', _error)
        eventSource.close()
        
        // Retry connection after 10 seconds
        setTimeout(setupTrackingUpdates, 10000)
      }

      return eventSource
    }

    const eventSource = setupTrackingUpdates()

    return () => {
      eventSource.close()
    }
  }, [onUpdate])
}