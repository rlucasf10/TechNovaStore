/**
 * Ejemplos de uso del componente ErrorMessage
 * Estos ejemplos muestran diferentes casos de uso y variantes
 */

'use client'

import { useState } from 'react';
import { ErrorMessage, FormFieldError, AlertBox } from './ErrorMessage';
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function ErrorMessageExamples() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">ErrorMessage - Ejemplos</h1>

      {/* ErrorMessage Básico */}
      <Card>
        <CardHeader>
          <CardTitle>ErrorMessage Básico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Error simple</h3>
            <ErrorMessage message="El email es requerido" />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Error sin icono</h3>
            <ErrorMessage 
              message="Este campo no puede estar vacío" 
              showIcon={false}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Error con acción</h3>
            <ErrorMessage 
              message="Este email ya está registrado" 
              action={{
                label: 'Iniciar sesión',
                onClick: () => alert('Redirigiendo a login...')
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Variantes */}
      <Card>
        <CardHeader>
          <CardTitle>Variantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Error</h3>
            <ErrorMessage 
              message="Email o contraseña incorrectos" 
              variant="error"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Advertencia</h3>
            <ErrorMessage 
              message="Tu sesión expirará en 5 minutos" 
              variant="warning"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Información</h3>
            <ErrorMessage 
              message="Revisa tu email para confirmar tu cuenta" 
              variant="info"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tamaños */}
      <Card>
        <CardHeader>
          <CardTitle>Tamaños</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Pequeño (sm)</h3>
            <ErrorMessage 
              message="Error de validación" 
              size="sm"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Mediano (md)</h3>
            <ErrorMessage 
              message="Error de validación" 
              size="md"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Grande (lg)</h3>
            <ErrorMessage 
              message="Error de validación" 
              size="lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* FormFieldError */}
      <Card>
        <CardHeader>
          <CardTitle>FormFieldError - Errores de Campo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input 
              id="email-example"
              label="Email"
              type="email"
              placeholder="tu@email.com"
            />
            <FormFieldError 
              error="El email ingresado no es válido" 
              fieldId="email-example"
            />
          </div>

          <div>
            <Input 
              id="password-example"
              label="Contraseña"
              variant="password"
            />
            <FormFieldError 
              error="La contraseña debe tener al menos 8 caracteres" 
              fieldId="password-example"
            />
          </div>
        </CardContent>
      </Card>

      {/* AlertBox */}
      <Card>
        <CardHeader>
          <CardTitle>AlertBox - Alertas Destacadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Error</h3>
            <AlertBox 
              title="Error de autenticación"
              message="Tus credenciales son incorrectas. Verifica tu email y contraseña e intenta de nuevo."
              variant="error"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Advertencia</h3>
            <AlertBox 
              title="Sesión por expirar"
              message="Tu sesión expirará en 5 minutos. Guarda tu trabajo para no perder cambios."
              variant="warning"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Información</h3>
            <AlertBox 
              title="Verifica tu email"
              message="Hemos enviado un email de verificación a tu dirección. Revisa tu bandeja de entrada."
              variant="info"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Éxito</h3>
            <AlertBox 
              title="Cuenta creada"
              message="Tu cuenta ha sido creada exitosamente. ¡Bienvenido a TechNovaStore!"
              variant="success"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Con acción</h3>
            <AlertBox 
              title="Email ya registrado"
              message="Este email ya está registrado en nuestro sistema."
              variant="error"
              action={{
                label: 'Iniciar sesión',
                onClick: () => alert('Redirigiendo a login...')
              }}
            />
          </div>

          {showAlert && (
            <div>
              <h3 className="text-sm font-medium mb-2">Dismissible</h3>
              <AlertBox 
                title="Notificación"
                message="Esta alerta puede cerrarse haciendo clic en la X."
                variant="info"
                dismissible
                onDismiss={() => setShowAlert(false)}
              />
            </div>
          )}

          {!showAlert && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowAlert(true)}
            >
              Mostrar alerta dismissible
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Ejemplo de Formulario Completo */}
      <Card>
        <CardHeader>
          <CardTitle>Ejemplo de Formulario con Errores</CardTitle>
        </CardHeader>
        <CardContent>
          <FormExample />
        </CardContent>
      </Card>

      {/* Casos de Uso Reales */}
      <Card>
        <CardHeader>
          <CardTitle>Casos de Uso Reales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Login fallido</h3>
            <AlertBox 
              message="Email o contraseña incorrectos. Verifica tus credenciales e intenta de nuevo."
              variant="error"
              action={{
                label: '¿Olvidaste tu contraseña?',
                onClick: () => alert('Redirigiendo a recuperación...')
              }}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Email ya registrado</h3>
            <AlertBox 
              title="Email ya en uso"
              message="Este email ya está registrado. ¿Quieres iniciar sesión en su lugar?"
              variant="error"
              action={{
                label: 'Ir a login',
                onClick: () => alert('Redirigiendo a login...')
              }}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Token expirado</h3>
            <AlertBox 
              title="Link expirado"
              message="El link de recuperación ha expirado. Los links son válidos por 1 hora por seguridad."
              variant="warning"
              action={{
                label: 'Solicitar nuevo link',
                onClick: () => alert('Solicitando nuevo link...')
              }}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Rate limit excedido</h3>
            <AlertBox 
              title="Demasiados intentos"
              message="Has excedido el número máximo de intentos. Por favor, espera 15 minutos antes de intentar de nuevo."
              variant="error"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Registro exitoso</h3>
            <AlertBox 
              title="¡Cuenta creada!"
              message="Tu cuenta ha sido creada exitosamente. Hemos enviado un email de verificación a tu dirección."
              variant="success"
              action={{
                label: 'Ir al dashboard',
                onClick: () => alert('Redirigiendo al dashboard...')
              }}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Contraseña restablecida</h3>
            <AlertBox 
              title="Contraseña actualizada"
              message="Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña."
              variant="success"
              action={{
                label: 'Iniciar sesión',
                onClick: () => alert('Redirigiendo a login...')
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de ejemplo de formulario
function FormExample() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGeneralError, setShowGeneralError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simular validación
    const newErrors: Record<string, string> = {};
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!email.includes('@')) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Simular error de API
      setShowGeneralError(true);
    } else {
      setShowGeneralError(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showGeneralError && (
        <AlertBox 
          message="Email o contraseña incorrectos. Verifica tus credenciales."
          variant="error"
          dismissible
          onDismiss={() => setShowGeneralError(false)}
        />
      )}

      <div>
        <Input 
          id="form-email"
          name="email"
          label="Email"
          type="email"
          placeholder="tu@email.com"
        />
        <FormFieldError 
          error={errors.email} 
          fieldId="form-email"
        />
      </div>

      <div>
        <Input 
          id="form-password"
          name="password"
          label="Contraseña"
          variant="password"
        />
        <FormFieldError 
          error={errors.password} 
          fieldId="form-password"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Iniciar Sesión
      </Button>
    </form>
  );
}
