/**
 * Script para verificar el contraste de colores según WCAG 2.1 AA
 * 
 * Requisitos:
 * - Texto normal: mínimo 4.5:1
 * - Texto grande (18px+ o 14px+ bold): mínimo 3:1
 * 
 * Uso: node scripts/check-contrast.js
 */

// Función para convertir hex a RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Función para calcular luminancia relativa
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Función para calcular ratio de contraste
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Función para verificar si cumple WCAG
function checkWCAG(ratio, level = 'AA', size = 'normal') {
  const requirements = {
    'AA': { normal: 4.5, large: 3.0 },
    'AAA': { normal: 7.0, large: 4.5 }
  };
  
  const required = requirements[level][size];
  const passes = ratio >= required;
  
  return {
    ratio: ratio.toFixed(2),
    required: required.toFixed(1),
    passes,
    level,
    size
  };
}

// Colores del sistema
const colors = {
  // Fondos
  backgrounds: {
    'bg-white': '#ffffff',
    'bg-gray-50': '#f9fafb',
    'bg-gray-100': '#f3f4f6',
    'bg-gray-900': '#111827',
    'bg-primary-600': '#2563eb',
    'bg-dark-primary': '#0f172a',
    'bg-dark-secondary': '#1e293b',
  },
  
  // Textos
  texts: {
    'text-gray-900': '#111827',
    'text-gray-800': '#1f2937',
    'text-gray-700': '#374151',
    'text-gray-600': '#4b5563',
    'text-gray-500': '#6b7280',
    'text-gray-400': '#9ca3af',
    'text-white': '#ffffff',
    'text-primary-600': '#2563eb',
    'text-primary-700': '#1d4ed8',
    'text-success': '#047857',  // Verde oscuro - Contraste 4.77:1 ✅
    'text-error': '#dc2626',    // Rojo - Contraste 4.83:1 ✅
    'text-warning': '#b45309',  // Naranja oscuro - Contraste 4.58:1 ✅
  }
};

console.log('='.repeat(80));
console.log('VERIFICACIÓN DE CONTRASTE DE COLORES - WCAG 2.1 AA');
console.log('='.repeat(80));
console.log('');

// Combinaciones comunes a verificar
const combinations = [
  // Texto sobre fondos claros
  { bg: 'bg-white', text: 'text-gray-900', context: 'Texto principal sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-gray-800', context: 'Texto secundario sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-gray-700', context: 'Texto terciario sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-gray-600', context: 'Texto muted sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-gray-500', context: 'Texto placeholder sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-primary-600', context: 'Enlaces sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-success', context: 'Texto success sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-error', context: 'Texto error sobre fondo blanco' },
  { bg: 'bg-white', text: 'text-warning', context: 'Texto warning sobre fondo blanco' },
  
  { bg: 'bg-gray-50', text: 'text-gray-900', context: 'Texto principal sobre fondo gris claro' },
  { bg: 'bg-gray-50', text: 'text-gray-600', context: 'Texto secundario sobre fondo gris claro' },
  
  { bg: 'bg-gray-100', text: 'text-gray-900', context: 'Texto sobre fondo gris 100' },
  { bg: 'bg-gray-100', text: 'text-gray-700', context: 'Texto secundario sobre fondo gris 100' },
  
  // Texto sobre fondos oscuros
  { bg: 'bg-gray-900', text: 'text-white', context: 'Texto blanco sobre fondo oscuro' },
  { bg: 'bg-gray-900', text: 'text-gray-400', context: 'Texto secundario sobre fondo oscuro' },
  
  { bg: 'bg-dark-primary', text: 'text-white', context: 'Texto blanco sobre dark-primary' },
  { bg: 'bg-dark-secondary', text: 'text-white', context: 'Texto blanco sobre dark-secondary' },
  
  // Botones
  { bg: 'bg-primary-600', text: 'text-white', context: 'Botón primario' },
  
  // Casos especiales del chatbot
  { bg: 'bg-white', text: 'text-gray-600', context: 'Mensajes del chatbot' },
  { bg: 'bg-primary-600', text: 'text-white', context: 'Header del chatbot' },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

console.log('COMBINACIONES DE TEXTO Y FONDO:\n');

combinations.forEach(({ bg, text, context }) => {
  const bgColor = colors.backgrounds[bg];
  const textColor = colors.texts[text];
  
  if (!bgColor || !textColor) {
    console.log(`⚠️  Color no encontrado: ${bg} o ${text}`);
    return;
  }
  
  const ratio = getContrastRatio(bgColor, textColor);
  const normalCheck = checkWCAG(ratio, 'AA', 'normal');
  const largeCheck = checkWCAG(ratio, 'AA', 'large');
  
  totalTests++;
  
  const normalIcon = normalCheck.passes ? '✅' : '❌';
  const largeIcon = largeCheck.passes ? '✅' : '❌';
  
  if (normalCheck.passes) {
    passedTests++;
  } else {
    failedTests++;
  }
  
  console.log(`${context}`);
  console.log(`  ${bg} + ${text}`);
  console.log(`  Ratio: ${normalCheck.ratio}:1`);
  console.log(`  ${normalIcon} Texto normal (≥4.5:1): ${normalCheck.passes ? 'PASA' : 'FALLA'}`);
  console.log(`  ${largeIcon} Texto grande (≥3.0:1): ${largeCheck.passes ? 'PASA' : 'FALLA'}`);
  
  if (!normalCheck.passes) {
    console.log(`  ⚠️  ACCIÓN REQUERIDA: Ajustar colores para cumplir WCAG AA`);
  }
  
  console.log('');
});

console.log('='.repeat(80));
console.log('RESUMEN:');
console.log(`Total de pruebas: ${totalTests}`);
console.log(`✅ Pasadas: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`❌ Fallidas: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
console.log('='.repeat(80));

if (failedTests > 0) {
  console.log('\n⚠️  ADVERTENCIA: Algunas combinaciones no cumplen con WCAG 2.1 AA');
  console.log('Revisa los colores marcados con ❌ y ajústalos para mejorar la accesibilidad.\n');
  process.exit(1);
} else {
  console.log('\n✅ ¡Excelente! Todas las combinaciones cumplen con WCAG 2.1 AA\n');
  process.exit(0);
}
