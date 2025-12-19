/**
 * Layout del Dashboard de Usuario
 * 
 * Incluye header y footer de la tienda para mantener la navegación
 * y permitir que los usuarios sigan comprando mientras gestionan su cuenta.
 */

'use client';

import { Header, Footer } from '@/layout';
import { ProtectedRoute } from '@/customer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 dark:bg-slate-900 pt-[72px]">
          {children}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}