import React from 'react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  name: string
  description: string
}

interface CheckoutStepsProps {
  steps: Step[]
  currentStep: number
}

export function CheckoutSteps({ steps, currentStep }: CheckoutStepsProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
              'relative'
            )}
          >
            {step.id < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 hover:bg-primary-900">
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
                </div>
                <div className="ml-4 min-w-0 flex flex-col">
                  <span className="text-sm font-medium text-primary-600">{step.name}</span>
                  <span className="text-sm text-gray-500">{step.description}</span>
                </div>
              </>
            ) : step.id === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-600 bg-white"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-600" aria-hidden="true" />
                </div>
                <div className="ml-4 min-w-0 flex flex-col">
                  <span className="text-sm font-medium text-primary-600">{step.name}</span>
                  <span className="text-sm text-gray-500">{step.description}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-4 min-w-0 flex flex-col">
                  <span className="text-sm font-medium text-gray-500">{step.name}</span>
                  <span className="text-sm text-gray-500">{step.description}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}