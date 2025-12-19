/**
 * Tests para MunicipalitySelector
 * 
 * Verifica el comportamiento del componente, incluyendo:
 * - Renderizado básico
 * - Detección de virtualización (>100 municipios)
 * - Funcionalidad de búsqueda
 * - Comportamiento disabled sin provincia
 * - Filtrado por provincia
 * - Búsqueda con debounce
 * 
 * Requisitos: 1.2, 6.2, 6.3, 6.4
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MunicipalitySelector } from '@/shared/components/checkout/MunicipalitySelector';
import { LocationsService } from '@/shared/lib/locations/LocationsService';
import type { Municipality } from '@/shared/lib/locations/types';

// Mock del LocationsService
jest.mock('@/shared/lib/locations/LocationsService');

describe('MunicipalitySelector', () => {
  const mockOnChange = jest.fn();
  
  // Datos de prueba
  const mockMunicipalities: Municipality[] = Array.from({ length: 150 }, (_, i) => ({
    code: `28${String(i).padStart(3, '0')}`,
    name: `Municipio ${i}`,
    provinceCode: '28',
    postalCodes: [`28${String(i).padStart(3, '0')}`],
    isCapital: i === 0
  }));

  const mockMunicipalitiesSmall: Municipality[] = Array.from({ length: 50 }, (_, i) => ({
    code: `08${String(i).padStart(3, '0')}`,
    name: `Municipio ${i}`,
    provinceCode: '08',
    postalCodes: [`08${String(i).padStart(3, '0')}`],
    isCapital: i === 0
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de getInstance
    (LocationsService.getInstance as jest.Mock).mockReturnValue({
      loadData: jest.fn().mockResolvedValue(undefined),
      getMunicipalitiesByProvince: jest.fn((provinceCode: string) => {
        if (provinceCode === '28') {
          return mockMunicipalities; // >100 municipios
        }
        return mockMunicipalitiesSmall; // ≤100 municipios
      }),
      searchMunicipalities: jest.fn().mockResolvedValue(mockMunicipalitiesSmall)
    });
  });

  describe('Virtualización', () => {
    it('debe detectar cuando hay más de 100 municipios', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      // Esperar a que se carguen los municipios
      await waitFor(() => {
        expect(screen.getByText(/150 municipios disponibles/i)).toBeInTheDocument();
      });

      // Verificar que se muestra el mensaje de virtualización
      expect(screen.getByText(/usando virtualización para mejor rendimiento/i)).toBeInTheDocument();
    });

    it('NO debe usar virtualización cuando hay 100 o menos municipios', async () => {
      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
        />
      );

      // Esperar a que se carguen los municipios
      await waitFor(() => {
        expect(screen.getByText(/50 municipios disponibles/i)).toBeInTheDocument();
      });

      // Verificar que NO se muestra el mensaje de virtualización
      expect(screen.queryByText(/usando virtualización para mejor rendimiento/i)).not.toBeInTheDocument();
    });

    it('debe renderizar un select nativo cuando hay ≤100 municipios', async () => {
      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select.tagName).toBe('SELECT');
      });
    });

    it('debe renderizar un dropdown personalizado cuando hay >100 municipios', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        // Buscar el botón del dropdown (no un select)
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      });
    });
  });

  describe('Renderizado básico', () => {
    it('debe estar deshabilitado cuando no hay provincia seleccionada', () => {
      render(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(screen.getByText(/primero selecciona una provincia/i)).toBeInTheDocument();
    });

    it('debe mostrar el placeholder correcto', () => {
      render(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
          placeholder="Selecciona tu municipio"
        />
      );

      expect(screen.getByText(/primero selecciona una provincia/i)).toBeInTheDocument();
    });

    it('debe mostrar mensaje de error cuando se proporciona', async () => {
      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          error="Este campo es requerido"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/este campo es requerido/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tarea 9.4: Unit Tests - Comportamiento disabled sin provincia', () => {
    it('debe estar deshabilitado cuando provinceCode es null', () => {
      render(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('debe mostrar mensaje indicando que se debe seleccionar provincia primero', () => {
      render(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/primero selecciona una provincia/i)).toBeInTheDocument();
    });

    it('debe permanecer deshabilitado incluso si disabled=false pero no hay provincia', () => {
      render(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('NO debe cargar municipios cuando provinceCode es null', async () => {
      const mockGetMunicipalities = jest.fn();
      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: mockGetMunicipalities,
        searchMunicipalities: jest.fn().mockResolvedValue([])
      });

      render(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
        />
      );

      // Esperar un momento para asegurar que no se llama
      await waitFor(() => {
        expect(mockGetMunicipalities).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Tarea 9.4: Unit Tests - Filtrado por provincia', () => {
    it('debe cargar municipios de la provincia seleccionada', async () => {
      const mockGetMunicipalities = jest.fn().mockReturnValue(mockMunicipalitiesSmall);
      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: mockGetMunicipalities,
        searchMunicipalities: jest.fn().mockResolvedValue([])
      });

      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(mockGetMunicipalities).toHaveBeenCalledWith('08');
      });
    });

    it('debe mostrar solo municipios de la provincia seleccionada', async () => {
      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/50 municipios disponibles/i)).toBeInTheDocument();
      });

      // Verificar que se muestran los municipios correctos
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.options).filter(opt => opt.value !== '');
      
      expect(options).toHaveLength(50);
      options.forEach(option => {
        expect(option.value).toMatch(/^08/); // Todos deben empezar con código de provincia 08
      });
    });

    it('debe recargar municipios cuando cambia la provincia', async () => {
      const mockGetMunicipalities = jest.fn()
        .mockReturnValueOnce(mockMunicipalitiesSmall) // Primera llamada con provincia 08
        .mockReturnValueOnce(mockMunicipalities);     // Segunda llamada con provincia 28

      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: mockGetMunicipalities,
        searchMunicipalities: jest.fn().mockResolvedValue([])
      });

      const { rerender } = render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(mockGetMunicipalities).toHaveBeenCalledWith('08');
      });

      // Cambiar provincia
      rerender(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(mockGetMunicipalities).toHaveBeenCalledWith('28');
        expect(mockGetMunicipalities).toHaveBeenCalledTimes(2);
      });
    });

    it('debe limpiar municipios cuando se quita la provincia', async () => {
      const { rerender } = render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/50 municipios disponibles/i)).toBeInTheDocument();
      });

      // Quitar provincia
      rerender(
        <MunicipalitySelector
          provinceCode={null}
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/municipios disponibles/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Tarea 9.4: Unit Tests - Búsqueda con debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('debe mostrar campo de búsqueda cuando searchable=true', async () => {
      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          searchable={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar municipio/i)).toBeInTheDocument();
      });
    });

    it('NO debe mostrar campo de búsqueda cuando searchable=false', async () => {
      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          searchable={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/buscar municipio/i)).not.toBeInTheDocument();
      });
    });

    it('debe aplicar debounce de 300ms a la búsqueda', async () => {
      const mockSearchMunicipalities = jest.fn().mockResolvedValue(mockMunicipalitiesSmall);
      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: jest.fn().mockReturnValue(mockMunicipalitiesSmall),
        searchMunicipalities: mockSearchMunicipalities
      });

      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          searchable={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar municipio/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar municipio/i);

      // Escribir en el campo de búsqueda
      fireEvent.change(searchInput, { target: { value: 'Barcelona' } });

      // No debe llamar inmediatamente
      expect(mockSearchMunicipalities).not.toHaveBeenCalled();

      // Avanzar 200ms (menos de 300ms)
      jest.advanceTimersByTime(200);
      expect(mockSearchMunicipalities).not.toHaveBeenCalled();

      // Avanzar otros 100ms (total 300ms)
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockSearchMunicipalities).toHaveBeenCalledWith('Barcelona', '08');
      });
    });

    it('debe cancelar búsqueda anterior si el usuario sigue escribiendo', async () => {
      const mockSearchMunicipalities = jest.fn().mockResolvedValue(mockMunicipalitiesSmall);
      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: jest.fn().mockReturnValue(mockMunicipalitiesSmall),
        searchMunicipalities: mockSearchMunicipalities
      });

      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          searchable={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar municipio/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar municipio/i);

      // Primera escritura
      fireEvent.change(searchInput, { target: { value: 'Bar' } });
      jest.advanceTimersByTime(200);

      // Segunda escritura antes de que se complete el debounce
      fireEvent.change(searchInput, { target: { value: 'Barcelona' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        // Solo debe llamarse una vez con el texto final
        expect(mockSearchMunicipalities).toHaveBeenCalledTimes(1);
        expect(mockSearchMunicipalities).toHaveBeenCalledWith('Barcelona', '08');
      });
    });

    it('debe buscar en tiempo real después del debounce', async () => {
      const mockSearchMunicipalities = jest.fn().mockResolvedValue([
        {
          code: '08019',
          name: 'Barcelona',
          provinceCode: '08',
          postalCodes: ['08001'],
          isCapital: true
        }
      ]);

      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: jest.fn().mockReturnValue(mockMunicipalitiesSmall),
        searchMunicipalities: mockSearchMunicipalities
      });

      render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          searchable={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar municipio/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar municipio/i);

      // Escribir búsqueda
      fireEvent.change(searchInput, { target: { value: 'Barcelona' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockSearchMunicipalities).toHaveBeenCalledWith('Barcelona', '08');
        expect(screen.getByText(/1 municipio disponible/i)).toBeInTheDocument();
      });
    });

    it('debe limpiar búsqueda cuando cambia la provincia', async () => {
      const mockSearchMunicipalities = jest.fn().mockResolvedValue(mockMunicipalitiesSmall);
      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: jest.fn().mockReturnValue(mockMunicipalitiesSmall),
        searchMunicipalities: mockSearchMunicipalities
      });

      const { rerender } = render(
        <MunicipalitySelector
          provinceCode="08"
          value={null}
          onChange={mockOnChange}
          searchable={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar municipio/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar municipio/i) as HTMLInputElement;

      // Escribir búsqueda
      fireEvent.change(searchInput, { target: { value: 'Barcelona' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(searchInput.value).toBe('Barcelona');
      });

      // Cambiar provincia
      rerender(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
          searchable={true}
        />
      );

      await waitFor(() => {
        const newSearchInput = screen.getByPlaceholderText(/buscar municipio/i) as HTMLInputElement;
        expect(newSearchInput.value).toBe('');
      });
    });
  });

  describe('Tarea 9.4: Unit Tests - Virtualización con >100 opciones', () => {
    it('debe usar virtualización cuando hay más de 100 municipios', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/150 municipios disponibles/i)).toBeInTheDocument();
        expect(screen.getByText(/usando virtualización para mejor rendimiento/i)).toBeInTheDocument();
      });
    });

    it('debe renderizar dropdown personalizado en lugar de select nativo con >100 opciones', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        // Debe haber un botón en lugar de select
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      });

      // No debe haber un select nativo
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('debe abrir dropdown virtualizado al hacer clic', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');

      // Dropdown debe estar cerrado inicialmente
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      // Hacer clic para abrir
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('debe cerrar dropdown al seleccionar una opción', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');

      // Abrir dropdown
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Seleccionar primera opción
      const options = screen.getAllByRole('option');
      fireEvent.click(options[0]);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('28000', 'Municipio 0', ['28000']);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('debe mostrar todas las opciones en el dropdown virtualizado', async () => {
      render(
        <MunicipalitySelector
          provinceCode="28"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });

      // Abrir dropdown
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(150);
      });
    });

    it('NO debe usar virtualización cuando hay exactamente 100 municipios', async () => {
      const exactly100Municipalities: Municipality[] = Array.from({ length: 100 }, (_, i) => ({
        code: `10${String(i).padStart(3, '0')}`,
        name: `Municipio ${i}`,
        provinceCode: '10',
        postalCodes: [`10${String(i).padStart(3, '0')}`],
        isCapital: i === 0
      }));

      (LocationsService.getInstance as jest.Mock).mockReturnValue({
        loadData: jest.fn().mockResolvedValue(undefined),
        getMunicipalitiesByProvince: jest.fn().mockReturnValue(exactly100Municipalities),
        searchMunicipalities: jest.fn().mockResolvedValue([])
      });

      render(
        <MunicipalitySelector
          provinceCode="10"
          value={null}
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/100 municipios disponibles/i)).toBeInTheDocument();
      });

      // NO debe mostrar mensaje de virtualización
      expect(screen.queryByText(/usando virtualización/i)).not.toBeInTheDocument();

      // Debe usar select nativo
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
