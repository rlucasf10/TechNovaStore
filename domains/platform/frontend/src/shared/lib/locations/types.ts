/**
 * Tipos TypeScript para el Sistema de Localidades Españolas (INE)
 * 
 * Este archivo define las interfaces para provincias, municipios y datos de localidades
 * utilizados en el sistema de selección de ubicación durante el checkout.
 */

/**
 * Representa una provincia española
 */
export interface Province {
  /** Código INE de la provincia (ej: "28" para Madrid) */
  code: string;
  
  /** Nombre de la provincia (ej: "Madrid") */
  name: string;
  
  /** Comunidad autónoma a la que pertenece */
  autonomousCommunity: string;
  
  /** Coordenadas geográficas aproximadas del centro de la provincia */
  coordinates: {
    /** Latitud */
    lat: number;
    /** Longitud */
    lng: number;
  };
}

/**
 * Representa un municipio español
 */
export interface Municipality {
  /** Código INE del municipio (ej: "28079" para Madrid) */
  code: string;
  
  /** Nombre del municipio (ej: "Madrid") */
  name: string;
  
  /** Código de la provincia a la que pertenece */
  provinceCode: string;
  
  /** Array de códigos postales asociados al municipio */
  postalCodes: string[];
  
  /** Indica si es capital de provincia */
  isCapital: boolean;
}

/**
 * Estructura completa de datos de localidades españolas
 */
export interface SpainLocationsData {
  /** Versión de los datos (ej: "2025.1") */
  version: string;
  
  /** Timestamp de generación de los datos */
  generatedAt: string;
  
  /** Fuente de los datos (ej: "INE - Instituto Nacional de Estadística") */
  source?: string;
  
  /** Array de todas las provincias (50 provincias) */
  provinces: Province[];
  
  /** Array de todos los municipios (8,131 municipios) */
  municipalities: Municipality[];
}

/**
 * Estimación de tiempo de entrega basada en ubicación
 */
export interface DeliveryEstimate {
  /** Descripción del tiempo de entrega (ej: "24-48 horas", "2-3 días laborables") */
  days: string;
  
  /** Número mínimo de días de entrega */
  daysMin: number;
  
  /** Número máximo de días de entrega */
  daysMax: number;
  
  /** Zona de entrega */
  zone: 'madrid' | 'peninsula' | 'balearic' | 'canary' | 'ceuta-melilla';
}

/**
 * Resultado de validación de código postal
 */
export interface PostalCodeValidationResult {
  /** Indica si el código postal es válido */
  isValid: boolean;
  
  /** Mensaje de error descriptivo (solo presente si isValid es false) */
  errorMessage?: string;
}
