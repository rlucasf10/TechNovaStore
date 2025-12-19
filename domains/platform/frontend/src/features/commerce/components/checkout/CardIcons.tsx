/**
 * Iconos de tarjetas de crédito aceptadas
 */

interface CardIconProps {
  type: 'visa' | 'mastercard' | 'amex' | 'discover'
  className?: string
}

export function CardIcon({ type, className = 'w-10 h-6' }: CardIconProps) {
  const icons = {
    visa: (
      <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#1434CB"/>
        <path d="M20.5 11.5L18.5 20.5H16L18 11.5H20.5Z" fill="white"/>
        <path d="M27 11.5L24.5 20.5H22.5L23.5 16L22.5 11.5H24.5L25 14.5L26.5 11.5H28.5L27 14.5L28 20.5H26L27 11.5Z" fill="white"/>
        <path d="M32 11.5C33 11.5 33.5 12 33.5 13C33.5 14 33 14.5 32 14.5H31L31.5 11.5H32ZM29.5 20.5L31 11.5H33.5C35 11.5 36 12.5 36 14C36 15.5 35 16.5 33.5 16.5H32L31.5 20.5H29.5Z" fill="white"/>
        <path d="M13 11.5L10.5 20.5H8.5L10 14.5L8.5 11.5H10.5L11.5 15L13.5 11.5H15.5L13 15L14 20.5H12L13 11.5Z" fill="white"/>
      </svg>
    ),
    mastercard: (
      <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#EB001B"/>
        <circle cx="18" cy="16" r="10" fill="#FF5F00"/>
        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
        <path d="M24 8C22 10 21 13 21 16C21 19 22 22 24 24C26 22 27 19 27 16C27 13 26 10 24 8Z" fill="#FF5F00"/>
      </svg>
    ),
    amex: (
      <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#006FCF"/>
        <path d="M12 11L10 21H12.5L13 18H15L15.5 21H18L16 11H12ZM13.5 13.5L14.5 16H13L13.5 13.5Z" fill="white"/>
        <path d="M20 11L18.5 21H21L22 16L23 21H25.5L27 11H24.5L23.5 16L22.5 11H20Z" fill="white"/>
        <path d="M29 11L27 21H29.5L30 18H32L32.5 21H35L33 11H29ZM30.5 13.5L31.5 16H30L30.5 13.5Z" fill="white"/>
        <path d="M37 11L35.5 21H38L39 16L40 21H42.5L44 11H41.5L40.5 16L39.5 11H37Z" fill="white"/>
      </svg>
    ),
    discover: (
      <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#FF6000"/>
        <circle cx="38" cy="16" r="8" fill="#F79E1B"/>
        <path d="M10 13H12V19H10V13Z" fill="white"/>
        <path d="M14 13H16C17 13 18 14 18 15.5C18 17 17 18 16 18H14V13ZM15.5 14.5V16.5H16C16.5 16.5 17 16 17 15.5C17 15 16.5 14.5 16 14.5H15.5Z" fill="white"/>
        <path d="M20 13H22V19H20V13Z" fill="white"/>
        <path d="M24 13H26C27 13 27.5 13.5 27.5 14.5C27.5 15 27 15.5 26.5 15.5C27 15.5 27.5 16 27.5 16.5C27.5 17.5 27 18 26 18H24V13ZM25.5 14.5V15H26C26.5 15 26.5 14.5 26.5 14.5C26.5 14.5 26.5 14.5 26 14.5H25.5ZM25.5 16V17H26C26.5 17 27 17 27 16.5C27 16 26.5 16 26 16H25.5Z" fill="white"/>
      </svg>
    ),
  }

  return icons[type] || null
}

interface AcceptedCardsProps {
  className?: string
}

export function AcceptedCards({ className = '' }: AcceptedCardsProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 mr-2">Aceptamos:</span>
      <CardIcon type="visa" />
      <CardIcon type="mastercard" />
      <CardIcon type="amex" />
      <CardIcon type="discover" />
    </div>
  )
}

interface SecurityBadgesProps {
  className?: string
}

export function SecurityBadges({ className = '' }: SecurityBadgesProps) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* SSL Badge */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div className="text-left">
          <div className="text-xs font-semibold text-green-800">SSL Seguro</div>
          <div className="text-xs text-green-600">256-bit</div>
        </div>
      </div>

      {/* PCI DSS Badge */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div className="text-left">
          <div className="text-xs font-semibold text-blue-800">PCI DSS</div>
          <div className="text-xs text-blue-600">Certificado</div>
        </div>
      </div>

      {/* Secure Payment Badge */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <div className="text-left">
          <div className="text-xs font-semibold text-gray-800">Pago Seguro</div>
          <div className="text-xs text-gray-600">100% Protegido</div>
        </div>
      </div>
    </div>
  )
}
