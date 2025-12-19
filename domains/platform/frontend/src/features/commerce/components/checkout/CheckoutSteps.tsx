import { cn } from '@/lib/utils'

interface Step {
  id: number
  name: string
  description: string
}

interface CheckoutStepsProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepId: number) => void
  completedSteps?: number[]
}

/**
 * Componente de navegación de pasos para el proceso de Checkout
 * 
 * Características:
 * - Indicador visual de progreso con números circulares
 * - Navegación entre pasos (solo a pasos completados)
 * - Validación visual de pasos completados
 * - Diseño responsivo
 * 
 * @param steps - Array de pasos del checkout
 * @param currentStep - Paso actual (1-indexed)
 * @param onStepClick - Callback opcional para navegar a un paso específico
 * @param completedSteps - Array de IDs de pasos completados
 */
export function CheckoutSteps({ 
  steps, 
  currentStep, 
  onStepClick,
  completedSteps = []
}: CheckoutStepsProps) {
  const handleStepClick = (stepId: number) => {
    // Solo permitir navegación a pasos completados o al paso actual
    if (onStepClick && (completedSteps.includes(stepId) || stepId === currentStep)) {
      onStepClick(stepId)
    }
  }

  const isStepCompleted = (stepId: number) => completedSteps.includes(stepId)
  const isStepClickable = (stepId: number) => completedSteps.includes(stepId) || stepId === currentStep

  return (
    <nav aria-label="Progreso del Checkout" className="mb-8">
      {/* Versión Desktop */}
      <ol className="hidden sm:flex items-center justify-center">
        {steps.map((step, stepIdx) => {
          const isCompleted = isStepCompleted(step.id)
          const isCurrent = step.id === currentStep
          const isClickable = isStepClickable(step.id)
          
          return (
            <li
              key={step.id}
              className={cn(
                'relative flex items-center',
                stepIdx !== steps.length - 1 && 'flex-1'
              )}
            >
              {/* Línea conectora */}
              {stepIdx !== steps.length - 1 && (
                <div 
                  className={cn(
                    'absolute left-1/2 top-5 h-0.5 w-full',
                    isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Contenedor del paso */}
              <div className="relative flex flex-col items-center group">
                {/* Círculo con número o checkmark */}
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200',
                    isCompleted && 'bg-primary-600 border-primary-600 hover:bg-primary-700',
                    isCurrent && !isCompleted && 'border-primary-600 bg-white',
                    !isCurrent && !isCompleted && 'border-gray-300 bg-white',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-60'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${step.name}: ${step.description}`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent ? 'text-primary-600' : 'text-gray-500'
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </button>

                {/* Texto del paso */}
                <div className="mt-3 text-center">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      isCompleted && 'text-primary-600',
                      isCurrent && !isCompleted && 'text-primary-600',
                      !isCurrent && !isCompleted && 'text-gray-500'
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {step.description}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Versión Móvil */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-900">
            Paso {currentStep} de {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / steps.length) * 100)}% completado
          </span>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          />
        </div>

        {/* Paso actual */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {steps[currentStep - 1]?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>
    </nav>
  )
}