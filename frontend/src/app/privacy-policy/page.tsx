import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | TechNovaStore',
  description: 'Política de privacidad y protección de datos de TechNovaStore. Cumplimiento GDPR y LOPD.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidad
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Información General
              </h2>
              <p className="text-gray-700 mb-4">
                TechNovaStore (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la empresa&quot;) se compromete a proteger 
                y respetar su privacidad. Esta política explica cuándo y por qué recopilamos 
                información personal, cómo la utilizamos y las condiciones bajo las cuales 
                podemos divulgarla a terceros.
              </p>
              <p className="text-gray-700">
                Esta política cumple con el Reglamento General de Protección de Datos (GDPR) 
                de la Unión Europea y la Ley Orgánica de Protección de Datos (LOPD) de España.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. Datos que Recopilamos
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Datos de Registro y Perfil
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Nombre y apellidos</li>
                    <li>Dirección de correo electrónico</li>
                    <li>Número de teléfono</li>
                    <li>Dirección postal</li>
                    <li>Información de facturación</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Datos de Navegación
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Dirección IP</li>
                    <li>Tipo de navegador y versión</li>
                    <li>Páginas visitadas y tiempo de permanencia</li>
                    <li>Referencia de origen</li>
                    <li>Cookies y tecnologías similares</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Datos de Transacciones
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Historial de pedidos</li>
                    <li>Información de pago (procesada de forma segura)</li>
                    <li>Direcciones de envío</li>
                    <li>Comunicaciones con atención al cliente</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Cómo Utilizamos sus Datos
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Procesar y gestionar sus pedidos</li>
                <li>Proporcionar atención al cliente</li>
                <li>Enviar comunicaciones relacionadas con el servicio</li>
                <li>Mejorar nuestros productos y servicios</li>
                <li>Personalizar su experiencia de compra</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Prevenir fraudes y garantizar la seguridad</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Base Legal para el Procesamiento
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Consentimiento
                  </h3>
                  <p className="text-gray-700">
                    Para marketing directo, cookies no esenciales y comunicaciones promocionales.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ejecución de Contrato
                  </h3>
                  <p className="text-gray-700">
                    Para procesar pedidos, proporcionar productos y servicios contratados.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Interés Legítimo
                  </h3>
                  <p className="text-gray-700">
                    Para mejorar nuestros servicios, prevenir fraudes y garantizar la seguridad.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Obligación Legal
                  </h3>
                  <p className="text-gray-700">
                    Para cumplir con requisitos fiscales, contables y de facturación.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Cookies y Tecnologías Similares
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia. 
                Puede gestionar sus preferencias de cookies a través de nuestro banner 
                de consentimiento o en la configuración de su cuenta.
              </p>
              
              <div className="space-y-3">
                <div>
                  <strong className="text-gray-900">Cookies Necesarias:</strong>
                  <span className="text-gray-700"> Esenciales para el funcionamiento del sitio web.</span>
                </div>
                <div>
                  <strong className="text-gray-900">Cookies de Análisis:</strong>
                  <span className="text-gray-700"> Nos ayudan a entender cómo usa nuestro sitio.</span>
                </div>
                <div>
                  <strong className="text-gray-900">Cookies de Marketing:</strong>
                  <span className="text-gray-700"> Para mostrar anuncios relevantes.</span>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Sus Derechos bajo GDPR y LOPD
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Derecho de Acceso:</strong> Solicitar una copia de sus datos personales</li>
                <li><strong>Derecho de Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Derecho de Supresión:</strong> Solicitar la eliminación de sus datos</li>
                <li><strong>Derecho de Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                <li><strong>Derecho de Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                <li><strong>Derecho de Limitación:</strong> Restringir el procesamiento de sus datos</li>
                <li><strong>Derecho a Retirar el Consentimiento:</strong> En cualquier momento</li>
              </ul>
              
              <p className="text-gray-700 mt-4">
                Para ejercer estos derechos, puede utilizar las herramientas en su panel 
                de usuario o contactarnos en privacy@technovastore.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Retención de Datos
              </h2>
              <p className="text-gray-700 mb-4">
                Conservamos sus datos personales solo durante el tiempo necesario para 
                los fines para los que fueron recopilados:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Datos de cuenta: Mientras mantenga su cuenta activa</li>
                <li>Datos de transacciones: 7 años (requisito fiscal)</li>
                <li>Datos de marketing: Hasta que retire su consentimiento</li>
                <li>Cookies: Según se especifica en nuestra política de cookies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                8. Seguridad de los Datos
              </h2>
              <p className="text-gray-700">
                Implementamos medidas técnicas y organizativas apropiadas para proteger 
                sus datos personales contra el acceso no autorizado, alteración, divulgación 
                o destrucción. Esto incluye encriptación, controles de acceso y monitoreo 
                regular de nuestros sistemas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                9. Transferencias Internacionales
              </h2>
              <p className="text-gray-700">
                Sus datos se procesan principalmente dentro del Espacio Económico Europeo (EEE). 
                Cualquier transferencia fuera del EEE se realiza con las salvaguardias adecuadas 
                según el GDPR.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                10. Contacto y Reclamaciones
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delegado de Protección de Datos
                  </h3>
                  <p className="text-gray-700">
                    Email: privacy@technovastore.com<br />
                    Dirección: [Dirección de la empresa]
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Autoridad de Control
                  </h3>
                  <p className="text-gray-700">
                    Tiene derecho a presentar una reclamación ante la Agencia Española 
                    de Protección de Datos (AEPD) si considera que el tratamiento de 
                    sus datos no cumple con la normativa.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                11. Cambios en esta Política
              </h2>
              <p className="text-gray-700">
                Podemos actualizar esta política ocasionalmente. Le notificaremos 
                cualquier cambio significativo por correo electrónico o mediante 
                un aviso prominente en nuestro sitio web.
              </p>
            </section>

            <div className="bg-gray-50 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                ¿Necesita Ayuda?
              </h3>
              <p className="text-gray-700 mb-4">
                Si tiene preguntas sobre esta política de privacidad o sobre cómo 
                manejamos sus datos personales, no dude en contactarnos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:privacy@technovastore.com"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Contactar Privacidad
                </a>
                <a
                  href="/dashboard/privacy"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Gestionar Mis Datos
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}