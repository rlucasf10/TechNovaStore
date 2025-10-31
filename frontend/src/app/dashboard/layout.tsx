/**
 * Layout del Dashboard de Usuario
 * 
 * Incluye header y footer de la tienda para mantener la navegación
 * y permitir que los usuarios sigan comprando mientras gestionan su cuenta.
 */

'use client';

import { Header, Footer } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}