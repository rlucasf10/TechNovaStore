/**
 * Footer Component
 * 
 * Componente de pie de página principal de la aplicación.
 * 
 * Características:
 * - Columnas: Empresa, Ayuda, Legal, Redes Sociales
 * - Formulario de newsletter signup
 * - Métodos de pago aceptados
 * - Copyright y enlaces legales
 * - Responsive design
 * 
 * Requisitos: 4.1
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

// ============================================================================
// Tipos
// ============================================================================

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

// ============================================================================
// Configuración del Footer
// ============================================================================

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
      { label: 'Nuestra Historia', href: '/historia' },
      { label: 'Trabaja con Nosotros', href: '/carreras' },
      { label: 'Prensa', href: '/prensa' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Centro de Ayuda', href: '/ayuda' },
      { label: 'Preguntas Frecuentes', href: '/faq' },
      { label: 'Seguimiento de Pedidos', href: '/seguimiento' },
      { label: 'Devoluciones', href: '/devoluciones' },
      { label: 'Garantías', href: '/garantias' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y Condiciones', href: '/terminos' },
      { label: 'Política de Privacidad', href: '/privacidad' },
      { label: 'Política de Cookies', href: '/cookies' },
      { label: 'Aviso Legal', href: '/aviso-legal' },
      { label: 'Protección de Datos', href: '/proteccion-datos' },
    ],
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/technovastore',
    icon: <Facebook className="w-5 h-5" />,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/technovastore',
    icon: <Twitter className="w-5 h-5" />,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/technovastore',
    icon: <Instagram className="w-5 h-5" />,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/technovastore',
    icon: <Linkedin className="w-5 h-5" />,
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/technovastore',
    icon: <Youtube className="w-5 h-5" />,
  },
];

const PAYMENT_METHODS = [
  { name: 'Visa', logo: '💳' },
  { name: 'Mastercard', logo: '💳' },
  { name: 'American Express', logo: '💳' },
  { name: 'PayPal', logo: '🅿️' },
  { name: 'Transferencia', logo: '🏦' },
];

// ============================================================================
// Componente Footer
// ============================================================================

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setSubscriptionStatus('error');
      return;
    }

    setIsSubscribing(true);
    
    try {
      // TODO: Integrar con servicio de newsletter
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubscriptionStatus('success');
      setEmail('');
      
      // Reset status después de 3 segundos
      setTimeout(() => {
        setSubscriptionStatus('idle');
      }, 3000);
    } catch (error) {
      setSubscriptionStatus('error');
    } finally {
      setIsSubscribing(false);
    }
  };

  const currentYear = new Date().getFullYear();

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <footer className="bg-gray-900 text-gray-300">
      
      {/* ============================================================ */}
      {/* Sección Principal del Footer */}
      {/* ============================================================ */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* ============================================================ */}
          {/* Columna: Sobre TechNovaStore */}
          {/* ============================================================ */}
          
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Link
                href="/"
                className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors"
              >
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="32" height="32" rx="6" fill="currentColor" />
                  <path
                    d="M8 12h16M8 16h16M8 20h10"
                    stroke="#1f2937"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xl font-bold">TechNovaStore</span>
              </Link>
            </div>
            
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Tu tienda especializada en tecnología e informática. 
              Ofrecemos los mejores productos con precios competitivos, 
              envío rápido y atención personalizada.
            </p>

            {/* Información de Contacto */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  Calle Tecnología 123, 28001 Madrid, España
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a
                  href="tel:+34900123456"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  +34 900 123 456
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a
                  href="mailto:info@technovastore.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  info@technovastore.com
                </a>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="mt-6">
              <h3 className="text-white font-semibold mb-3">Síguenos</h3>
              <div className="flex space-x-3">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      w-10 h-10 rounded-full bg-gray-800 
                      flex items-center justify-center
                      text-gray-400 hover:text-white hover:bg-primary-600
                      transition-all duration-300
                    "
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Columnas de Enlaces */}
          {/* ============================================================ */}
          
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="
                        text-sm text-gray-400 hover:text-white 
                        transition-colors duration-200
                        inline-block
                      "
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* Newsletter Signup */}
        {/* ============================================================ */}
        
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md mx-auto lg:mx-0">
            <h3 className="text-white font-semibold mb-2">
              Suscríbete a nuestro newsletter
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Recibe ofertas exclusivas, novedades y consejos tecnológicos.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing || subscriptionStatus === 'success'}
                  className="
                    w-full px-4 py-2.5 rounded-lg
                    bg-gray-800 border border-gray-700
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                  "
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubscribing || subscriptionStatus === 'success'}
                className="
                  px-6 py-2.5 rounded-lg font-medium
                  bg-primary-600 hover:bg-primary-700
                  text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center space-x-2
                  whitespace-nowrap
                "
              >
                {subscriptionStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>¡Suscrito!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>{isSubscribing ? 'Suscribiendo...' : 'Suscribirse'}</span>
                  </>
                )}
              </button>
            </form>
            
            {subscriptionStatus === 'error' && (
              <p className="mt-2 text-sm text-error">
                Por favor, ingresa un email válido.
              </p>
            )}
            
            {subscriptionStatus === 'success' && (
              <p className="mt-2 text-sm text-success">
                ¡Gracias por suscribirte! Revisa tu email para confirmar.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Sección de Métodos de Pago y Copyright */}
      {/* ============================================================ */}
      
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Métodos de Pago */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Métodos de pago aceptados:</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {PAYMENT_METHODS.map((method) => (
                <div
                  key={method.name}
                  className="
                    px-3 py-2 rounded bg-gray-800 
                    flex items-center justify-center
                    text-2xl
                  "
                  title={method.name}
                >
                  {method.logo}
                </div>
              ))}
            </div>
          </div>

          {/* Copyright y Enlaces Legales */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              © {currentYear} TechNovaStore. Todos los derechos reservados.
            </p>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/terminos"
                className="hover:text-white transition-colors"
              >
                Términos
              </Link>
              <span>•</span>
              <Link
                href="/privacidad"
                className="hover:text-white transition-colors"
              >
                Privacidad
              </Link>
              <span>•</span>
              <Link
                href="/cookies"
                className="hover:text-white transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
