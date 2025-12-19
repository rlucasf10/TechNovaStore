/**
 * Ejemplo de Validación de Formularios
 * 
 * Este componente demuestra las mejores prácticas de validación
 * usando Zod y React Hook Form
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, Button } from '@/ui'
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
} from '@/shared/lib/form-schemas'

// Esquema de ejemplo con validación compleja
const exampleSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  age: z.number()
    .int('La edad debe ser un número entero')
    .min(18, 'Debes ser mayor de 18 años')
    .max(120, 'Edad inválida'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type ExampleFormData = z.infer<typeof exampleSchema>

export function ValidationExample() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
  } = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      age: 18,
      acceptTerms: false,
    },
    mode: 'onChange', // Validar mientras escribe
  })

  const password = watch('password')

  const onSubmit = async (data: ExampleFormData) => {
    console.log('✅ Formulario válido:', data)
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    alert('Formulario enviado correctamente')
    reset()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ejemplo de Validación
        </h2>
        <p className="text-gray-600 mb-6">
          Este formulario demuestra validación en tiempo real con Zod
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('firstName')}
              label="Nombre *"
              placeholder="Juan"
              error={errors.firstName?.message}
              autoComplete="given-name"
            />
            
            <Input
              {...register('lastName')}
              label="Apellido *"
              placeholder="Pérez"
              error={errors.lastName?.message}
              autoComplete="family-name"
            />
          </div>

          {/* Email */}
          <Input
            {...register('email')}
            label="Email *"
            type="email"
            placeholder="juan@ejemplo.com"
            error={errors.email?.message}
            autoComplete="email"
            showValidation
            isValid={!errors.email && watch('email') !== ''}
          />

          {/* Teléfono (opcional) */}
          <Input
            {...register('phone')}
            label="Teléfono (opcional)"
            type="tel"
            placeholder="+34 600 123 456"
            error={errors.phone?.message}
            autoComplete="tel"
            helperText="Formato: +34 600 123 456"
          />

          {/* Edad */}
          <Input
            {...register('age', { valueAsNumber: true })}
            label="Edad *"
            type="number"
            min={18}
            max={120}
            error={errors.age?.message}
          />

          {/* Contraseña */}
          <Input
            {...register('password')}
            label="Contraseña *"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            autoComplete="new-password"
          />

          {/* Indicador de fortaleza de contraseña */}
          {password && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Fortaleza de la contraseña:
              </div>
              <div className="space-y-1">
                <div className={`text-xs ${password.length >= 8 ? 'text-success' : 'text-gray-500'}`}>
                  {password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                </div>
                <div className={`text-xs ${/[A-Z]/.test(password) ? 'text-success' : 'text-gray-500'}`}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} Una mayúscula
                </div>
                <div className={`text-xs ${/[a-z]/.test(password) ? 'text-success' : 'text-gray-500'}`}>
                  {/[a-z]/.test(password) ? '✓' : '○'} Una minúscula
                </div>
                <div className={`text-xs ${/[0-9]/.test(password) ? 'text-success' : 'text-gray-500'}`}>
                  {/[0-9]/.test(password) ? '✓' : '○'} Un número
                </div>
                <div className={`text-xs ${/[^A-Za-z0-9]/.test(password) ? 'text-success' : 'text-gray-500'}`}>
                  {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Un carácter especial
                </div>
              </div>
            </div>
          )}

          {/* Confirmar Contraseña */}
          <Input
            {...register('confirmPassword')}
            label="Confirmar Contraseña *"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          {/* Términos y Condiciones */}
          <div>
            <div className="flex items-start">
              <input
                {...register('acceptTerms')}
                id="acceptTerms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                Acepto los términos y condiciones *
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-error mt-1">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Estado del formulario */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="font-medium text-gray-900">Estado del formulario:</div>
            <div className="space-y-1 text-gray-600">
              <div>• Modificado: {isDirty ? '✓ Sí' : '○ No'}</div>
              <div>• Válido: {isValid ? '✓ Sí' : '○ No'}</div>
              <div>• Enviando: {isSubmitting ? '✓ Sí' : '○ No'}</div>
              <div>• Errores: {Object.keys(errors).length}</div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="flex-1"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Formulario'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset()}
              disabled={!isDirty}
            >
              Limpiar
            </Button>
          </div>
        </form>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            💡 Características de este ejemplo:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Validación en tiempo real (onChange)</li>
            <li>• Mensajes de error claros y específicos</li>
            <li>• Indicador visual de fortaleza de contraseña</li>
            <li>• Validación de coincidencia de contraseñas</li>
            <li>• Campos opcionales y requeridos</li>
            <li>• Validación de tipos (número, email, teléfono)</li>
            <li>• Estado del formulario visible</li>
            <li>• Botón deshabilitado si hay errores</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
