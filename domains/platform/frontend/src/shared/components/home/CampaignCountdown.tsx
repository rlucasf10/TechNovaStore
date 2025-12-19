'use client'

// import { useEffect, useState } from 'react'
// import { campaignService } from '@/shared/services'
// import type { Campaign } from '@/shared/types'

/**
 * CampaignCountdown - Contador regresivo para próxima campaña
 * 
 * Muestra un banner con countdown para generar expectativa
 * 
 * TODO: Implementar endpoint en Campaign Manager Service para obtener próximas campañas
 * Por ahora, este componente está deshabilitado hasta que se implemente la funcionalidad completa
 */
export function CampaignCountdown() {
  // Componente deshabilitado temporalmente
  // Se habilitará cuando se implemente el endpoint de próximas campañas en el backend
  return null

  /* Código original comentado para referencia futura
  const [nextCampaign, setNextCampaign] = useState<Campaign | null>(null)
  const [daysLeft, setDaysLeft] = useState<number>(0)

  useEffect(() => {
    // TODO: Implementar campaignService.getUpcomingCampaigns()
    // const loadNextCampaign = async () => {
    //   try {
    //     const campaigns = await campaignService.getUpcomingCampaigns()
    //     if (campaigns.length > 0) {
    //       const next = campaigns[0]
    //       const now = new Date()
    //       const start = new Date(next.startDate)
    //       const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    //       
    //       if (days <= 7) {
    //         setNextCampaign(next)
    //         setDaysLeft(days)
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error loading next campaign:', error)
    //   }
    // }
    // 
    // loadNextCampaign()
    // const interval = setInterval(loadNextCampaign, 1000 * 60 * 60) // 1 hora
    // return () => clearInterval(interval)
  }, [])

  if (!nextCampaign || daysLeft > 7) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-4 text-sm md:text-base font-medium">
          <span className="text-2xl">⏰</span>
          <span>
            <strong>{nextCampaign.name}</strong> comienza en{' '}
            <strong className="text-yellow-300">{daysLeft} {daysLeft === 1 ? 'día' : 'días'}</strong>
          </span>
          <span className="hidden md:inline">¡Prepárate para las mejores ofertas!</span>
        </div>
      </div>
    </div>
  )
  */
}
