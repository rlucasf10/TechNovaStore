'use client'

import { useEffect, useState } from 'react'
import { campaignService } from '@/shared/services'
import type { Campaign } from '@/shared/types'

/**
 * PromoBanner - Banner promocional superior dinámico
 * 
 * Banner que se adapta automáticamente según la campaña activa
 * Inspirado en PcComponentes
 */
export function PromoBanner() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  // const [loading, setLoading] = useState(true) // TODO: Usar para mostrar skeleton

  useEffect(() => {
    // Cargar campaña activa (silencioso si no hay campaña)
    campaignService.getActiveCampaign()
      .then(setCampaign)
      .catch(() => {
        // Silenciar error: es normal que no haya campaña activa
        setCampaign(null)
      })
      // .finally(() => setLoading(false))
  }, [])

  // Si no hay campaña, mostrar banner por defecto
  if (!campaign) {
    return (
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8 text-sm font-medium overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-lg">🎁</span>
              <span>Envío gratis en pedidos superiores a 50€</span>
            </div>
            <span className="opacity-50">|</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-lg">🔄</span>
              <span>Devoluciones gratis hasta 30 días</span>
            </div>
            <span className="opacity-50">|</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-lg">⚡</span>
              <span>Entrega en 24-48 horas</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { messages, backgroundColor } = campaign.frontendConfig.promoBanner

  return (
    <div className={`bg-gradient-to-r ${backgroundColor || 'from-primary-600 to-primary-700'} text-white py-2 px-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-8 text-sm font-medium overflow-x-auto">
          {messages.map((promo, index) => (
            <div key={index} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-lg">{promo.icon}</span>
              <span>{promo.text}</span>
              {index < messages.length - 1 && (
                <span className="ml-8 opacity-50">|</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
