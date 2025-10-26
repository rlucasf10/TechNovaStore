'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/ui'

export default function RegistroPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        aceptaTerminos: false,
        aceptaNewsletter: false
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
        }
        if (!formData.aceptaTerminos) {
            alert('Debes aceptar los términos y condiciones')
            return
        }
        console.log('Registro:', formData)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Header />

            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl w-full space-y-8 animate-fade-in">
                    {/* Logo y Título */}
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                            <span className="text-3xl font-bold text-white">T</span>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Crea tu cuenta
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Únete a TechNovaStore y disfruta de ofertas exclusivas
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Nombre y Apellidos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                                        Nombre *
                                    </label>
                                    <input
                                        id="nombre"
                                        name="nombre"
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        placeholder="Juan"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700">
                                        Apellidos *
                                    </label>
                                    <input
                                        id="apellidos"
                                        name="apellidos"
                                        type="text"
                                        required
                                        value={formData.apellidos}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        placeholder="Pérez García"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Correo electrónico *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Teléfono */}
                            <div className="space-y-2">
                                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                                    Teléfono (opcional)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="telefono"
                                        name="telefono"
                                        type="tel"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        placeholder="+34 600 000 000"
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Contraseña *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número
                                </p>
                            </div>

                            {/* Confirmar Contraseña */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirmar contraseña *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        placeholder="Repite tu contraseña"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Términos y Newsletter */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-start">
                                    <input
                                        id="aceptaTerminos"
                                        name="aceptaTerminos"
                                        type="checkbox"
                                        checked={formData.aceptaTerminos}
                                        onChange={handleChange}
                                        className="h-4 w-4 mt-0.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="aceptaTerminos" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                                        Acepto los{' '}
                                        <Link href="/terminos" className="text-primary-600 hover:text-primary-500 font-medium">
                                            términos y condiciones
                                        </Link>
                                        {' '}y la{' '}
                                        <Link href="/privacidad" className="text-primary-600 hover:text-primary-500 font-medium">
                                            política de privacidad
                                        </Link>
                                        {' *'}
                                    </label>
                                </div>

                                <div className="flex items-start">
                                    <input
                                        id="aceptaNewsletter"
                                        name="aceptaNewsletter"
                                        type="checkbox"
                                        checked={formData.aceptaNewsletter}
                                        onChange={handleChange}
                                        className="h-4 w-4 mt-0.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="aceptaNewsletter" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                                        Quiero recibir ofertas y novedades por email
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Crear cuenta
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">O regístrate con</span>
                            </div>
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </button>
                            <button type="button" className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </button>
                        </div>
                    </div>

                    {/* Login link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 space-x-4">
                        <Link href="/terminos" className="hover:text-gray-700 transition-colors">Términos</Link>
                        <span>•</span>
                        <Link href="/privacidad" className="hover:text-gray-700 transition-colors">Privacidad</Link>
                        <span>•</span>
                        <Link href="/ayuda" className="hover:text-gray-700 transition-colors">Ayuda</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
