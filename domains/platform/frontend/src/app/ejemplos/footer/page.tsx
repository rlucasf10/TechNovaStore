/**
 * Página de Ejemplo - Footer Component
 * 
 * Muestra el Footer component en acción con diferentes contextos.
 */

'use client';

import { Header, Footer } from '@/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui';

export default function FooterExamplePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Footer Component
            </h1>
            <p className="text-lg text-gray-600">
              Componente de pie de página completo con navegación, newsletter y más.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Características */}
            <Card>
              <CardHeader>
                <CardTitle>Características del Footer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      📋 Columnas de Navegación
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Empresa (Sobre Nosotros, Historia, Carreras, etc.)</li>
                      <li>• Ayuda (Centro de Ayuda, FAQ, Seguimiento, etc.)</li>
                      <li>• Legal (Términos, Privacidad, Cookies, etc.)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      📧 Newsletter Signup
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Formulario de suscripción funcional</li>
                      <li>• Validación de email en tiempo real</li>
                      <li>• Estados: idle, loading, success, error</li>
                      <li>• Feedback visual inmediato</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      📱 Redes Sociales
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Facebook, Twitter, Instagram</li>
                      <li>• LinkedIn, YouTube</li>
                      <li>• Iconos con hover effects</li>
                      <li>• Enlaces externos con target="_blank"</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      💳 Métodos de Pago
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Visa, Mastercard, American Express</li>
                      <li>• PayPal</li>
                      <li>• Transferencia bancaria</li>
                      <li>• Iconos visuales de cada método</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      📞 Información de Contacto
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Dirección física</li>
                      <li>• Número de teléfono</li>
                      <li>• Email de contacto</li>
                      <li>• Iconos descriptivos</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      📱 Responsive Design
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Desktop: 5 columnas</li>
                      <li>• Tablet: 2 columnas</li>
                      <li>• Mobile: 1 columna (stack)</li>
                      <li>• Adaptación automática</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instrucciones de Uso */}
            <Card>
              <CardHeader>
                <CardTitle>Cómo Usar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Importación
                    </h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { Footer } from '@/layout';
// o
import { Footer } from '@/ui'; // backward compatibility`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Uso Básico
                    </h3>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`export default function Page() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Contenido */}
      </main>
      <Footer />
    </div>
  );
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prueba del Newsletter */}
            <Card>
              <CardHeader>
                <CardTitle>Prueba el Newsletter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Desplázate hacia abajo hasta el footer y prueba el formulario de suscripción al newsletter.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      💡 Características del Newsletter:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Validación de email en tiempo real</li>
                      <li>• Botón con estados (normal, loading, success)</li>
                      <li>• Mensajes de feedback claros</li>
                      <li>• Animación de confirmación</li>
                      <li>• Auto-reset después de 3 segundos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contenido de Relleno */}
            <div className="py-12">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-4">
                  ⬇️ Desplázate hacia abajo para ver el Footer ⬇️
                </p>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-6xl">👇</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
