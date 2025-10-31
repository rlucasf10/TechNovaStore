/**
 * Ejemplos de uso del componente Input
 * 
 * Este archivo muestra diferentes casos de uso del componente Input
 * con todas sus variantes, estados y características.
 */

import { Input } from './Input'

export function InputExamples() {
  return (
    <div className="space-y-8 p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Componente Input - Ejemplos</h1>

      {/* Variantes básicas */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Variantes</h2>
        
        <div className="space-y-4">
          <Input
            label="Texto"
            variant="text"
            placeholder="Ingresa tu nombre"
            helperText="Este es un input de texto estándar"
          />

          <Input
            label="Email"
            variant="email"
            placeholder="correo@ejemplo.com"
            helperText="Ingresa un email válido"
          />

          <Input
            label="Contraseña"
            variant="password"
            placeholder="••••••••"
            helperText="Mínimo 8 caracteres"
          />

          <Input
            label="Número"
            variant="number"
            placeholder="0"
            helperText="Solo números permitidos"
          />
        </div>
      </section>

      {/* Estados */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Estados</h2>
        
        <div className="space-y-4">
          <Input
            label="Estado por defecto"
            placeholder="Escribe algo..."
          />

          <Input
            label="Con error"
            placeholder="Escribe algo..."
            error="Este campo es obligatorio"
          />

          <Input
            label="Deshabilitado"
            placeholder="No puedes editar esto"
            disabled
            value="Valor deshabilitado"
          />

          <Input
            label="Con validación exitosa"
            placeholder="Escribe algo..."
            value="usuario@ejemplo.com"
            showValidation
            isValid
          />

          <Input
            label="Con validación de error"
            placeholder="Escribe algo..."
            value="email-invalido"
            showValidation
            error="Email inválido"
          />
        </div>
      </section>

      {/* Labels flotantes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Labels Flotantes</h2>
        
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            floatingLabel
            placeholder=""
          />

          <Input
            label="Email"
            variant="email"
            floatingLabel
            placeholder=""
            value="usuario@ejemplo.com"
          />

          <Input
            label="Contraseña"
            variant="password"
            floatingLabel
            placeholder=""
          />

          <Input
            label="Con error"
            floatingLabel
            placeholder=""
            error="Este campo es obligatorio"
          />
        </div>
      </section>

      {/* Iconos */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Con Iconos</h2>
        
        <div className="space-y-4">
          <Input
            label="Buscar"
            placeholder="Buscar productos..."
            iconLeft={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          <Input
            label="Email"
            variant="email"
            placeholder="correo@ejemplo.com"
            iconLeft={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <Input
            label="Usuario"
            placeholder="nombre_usuario"
            iconLeft={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <Input
            label="Ubicación"
            placeholder="Ciudad, País"
            iconRight={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Validación inline */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Validación Inline</h2>
        
        <div className="space-y-4">
          <Input
            label="Email válido"
            variant="email"
            placeholder="correo@ejemplo.com"
            value="usuario@ejemplo.com"
            showValidation
            isValid
          />

          <Input
            label="Email inválido"
            variant="email"
            placeholder="correo@ejemplo.com"
            value="email-invalido"
            showValidation
            error="Formato de email inválido"
          />

          <Input
            label="Contraseña fuerte"
            variant="password"
            value="MiContraseña123!"
            showValidation
            isValid
            helperText="Contraseña segura"
          />

          <Input
            label="Contraseña débil"
            variant="password"
            value="123"
            showValidation
            error="La contraseña debe tener al menos 8 caracteres"
          />
        </div>
      </section>

      {/* Casos de uso reales */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Casos de Uso Reales</h2>
        
        <div className="space-y-4">
          {/* Formulario de login */}
          <div className="p-6 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Formulario de Login</h3>
            
            <Input
              label="Email"
              variant="email"
              placeholder="correo@ejemplo.com"
              floatingLabel
              iconLeft={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <Input
              label="Contraseña"
              variant="password"
              placeholder="••••••••"
              floatingLabel
            />
          </div>

          {/* Formulario de registro */}
          <div className="p-6 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Formulario de Registro</h3>
            
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              floatingLabel
            />

            <Input
              label="Email"
              variant="email"
              placeholder="correo@ejemplo.com"
              floatingLabel
              showValidation
              isValid
              value="usuario@ejemplo.com"
            />

            <Input
              label="Contraseña"
              variant="password"
              placeholder="••••••••"
              floatingLabel
              helperText="Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números"
            />

            <Input
              label="Confirmar contraseña"
              variant="password"
              placeholder="••••••••"
              floatingLabel
            />
          </div>

          {/* Búsqueda */}
          <div className="p-6 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Búsqueda de Productos</h3>
            
            <Input
              placeholder="Buscar laptops, componentes, periféricos..."
              iconLeft={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Checkout */}
          <div className="p-6 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Información de Envío</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Juan"
                floatingLabel
              />

              <Input
                label="Apellido"
                placeholder="Pérez"
                floatingLabel
              />
            </div>

            <Input
              label="Dirección"
              placeholder="Calle Principal 123"
              floatingLabel
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                placeholder="Madrid"
                floatingLabel
              />

              <Input
                label="Código Postal"
                placeholder="28001"
                floatingLabel
              />
            </div>

            <Input
              label="Teléfono"
              type="tel"
              placeholder="+34 600 000 000"
              floatingLabel
              iconLeft={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default InputExamples
