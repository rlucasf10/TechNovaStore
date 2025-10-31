/**
 * Exportaciones del Sistema de Tema
 * 
 * Este archivo centraliza las exportaciones relacionadas con el tema
 * para facilitar su importación en otros componentes.
 * 
 * Requisitos: 21.1, 21.2, 21.3, 21.4
 */

export {
  themeConfig,
  getThemeValue,
  isDarkMode,
  toggleDarkMode,
  initializeTheme,
  type ThemeConfig,
  type ColorScale,
  type SemanticColor,
  type Breakpoint,
  type Spacing,
} from './theme.config';

import { themeConfig } from './theme.config';
export default themeConfig;
