'use client';

import React from 'react';

interface AuthDividerProps {
  text?: string;
}

/**
 * Divider con texto para separar secciones en formularios de autenticación
 * Comúnmente usado para separar login con email vs OAuth
 */
export default function AuthDivider({ text = 'o' }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500 uppercase tracking-wide">
          {text}
        </span>
      </div>
    </div>
  );
}
