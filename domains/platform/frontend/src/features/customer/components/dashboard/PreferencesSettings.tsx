'use client'

import { useState } from 'react'
import { Globe, DollarSign, Bell, Mail, Check, Loader2 } from 'lucide-react'

interface PreferencesSettingsProps {
  currentLanguage?: string
  currentCurrency?: string
  emailNotifications?: {
    orderUpdates: boolean
    promotions: boolean
    newsletter: boolean
    productRecommendations: boolean
  }
  onUpdate?: (preferences: any) => Promise<void>
}

export function PreferencesSettings({
  currentLanguage = 'es',
  currentCurrency = 'EUR',
  emailNotifications = {
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    productRecommendations: true,
  },
  onUpdate,
}: PreferencesSettingsProps) {
  const [language, setLanguage] = useState(currentLanguage)
  const [currency, setCurrency] = useState(currentCurrency)
  const [notifications, setNotifications] = useState(emailNotifications)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ]

  const currencies = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
  ]

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    setHasChanges(true)
  }

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency)
    setHasChanges(true)
  }

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (onUpdate) {
        await onUpdate({
          language,
          currency,
          emailNotifications: notifications,
        })
      }
      setHasChanges(false)
      alert('Preferencias actualizadas exitosamente')
    } catch (error) {
      console.error('Error updating preferences:', error)
      alert('Error al actualizar las preferencias')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setLanguage(currentLanguage)
    setCurrency(currentCurrency)
    setNotifications(emailNotifications)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Idioma */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Idioma</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona tu idioma preferido</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  language === lang.code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{lang.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lang.code.toUpperCase()}</p>
                </div>
                {language === lang.code && (
                  <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Moneda */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Moneda</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona tu moneda preferida</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  currency === curr.code
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">{curr.symbol}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{curr.code}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{curr.name}</p>
                </div>
                {currency === curr.code && (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notificaciones por Email */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificaciones por Email</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona qué emails quieres recibir</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Actualizaciones de Pedidos */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Actualizaciones de Pedidos</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recibe notificaciones sobre el estado de tus pedidos
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle('orderUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.orderUpdates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Promociones */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Promociones y Ofertas</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recibe ofertas especiales y descuentos exclusivos
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle('promotions')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.promotions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.promotions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Newsletter */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Newsletter</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recibe noticias, novedades y contenido exclusivo
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle('newsletter')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.newsletter ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.newsletter ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Recomendaciones de Productos */}
            <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Recomendaciones de Productos</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recibe sugerencias personalizadas basadas en tus intereses
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle('productRecommendations')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.productRecommendations ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.productRecommendations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      {hasChanges && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tienes cambios sin guardar
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
