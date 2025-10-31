/**
 * Layout del Dashboard de Administración
 * 
 * Protege todas las rutas bajo /admin con AdminRoute.
 * Solo los usuarios con rol de admin pueden acceder.
 */

'use client';

import { AdminRoute } from '@/components/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: '📊' },
        { name: 'Analíticas', href: '/admin/analytics', icon: '📈' },
        { name: 'Productos', href: '/admin/products', icon: '📦' },
        { name: 'Pedidos', href: '/admin/orders', icon: '🛒' },
        { name: 'Clientes', href: '/admin/customers', icon: '👥' },
        { name: 'Tickets', href: '/admin/tickets', icon: '💬' },
        { name: 'Servicios de IA', href: '/admin/ai-services', icon: '🤖' },
        { name: 'Automatización', href: '/admin/automation', icon: '⚡' },
        { name: 'Configuración', href: '/admin/settings', icon: '⚙️' },
    ];

    return (
        <AdminRoute>
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900 text-white">
                    <div className="p-6">
                        <h2 className="text-xl font-bold">Admin Panel</h2>
                        <p className="text-sm text-gray-400 mt-1">TechNovaStore</p>
                    </div>

                    <nav className="px-3 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }
                  `}
                                >
                                    <span className="text-xl mr-3">{item.icon}</span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer del sidebar */}
                    <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
                        <Link
                            href="/dashboard"
                            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            ← Volver al Dashboard de Usuario
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {/* Header */}
                    <header className="bg-white border-b border-gray-200 px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Panel de Administración
                            </h1>
                            <div className="flex items-center space-x-4">
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                                    Admin
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </AdminRoute>
    );
}
