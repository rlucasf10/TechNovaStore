/**
 * Contexto para compartir el estado del sidebar del admin
 * entre componentes que no están en la misma jerarquía.
 */

'use client';

import React, { createContext, useContext, useState } from 'react';

interface AdminSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | null>(null);

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AdminSidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  // Si no hay contexto, devolver valores por defecto (no estamos en admin)
  if (!context) {
    return { isCollapsed: false, setIsCollapsed: () => {} };
  }
  return context;
}
