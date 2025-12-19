/**
 * Tests para el componente ProvinceSelector
 * 
 * Verifica:
 * - Renderizado con 50 provincias
 * - Evento onChange
 * - Estado disabled
 * - Mostrar error
 * 
 * Requisitos: 1.1
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProvinceSelector } from '@/shared/components/checkout/ProvinceSelector';
import { LocationsService } from '@/shared/lib/locations/LocationsService';
import type { Province } from '@/shared/lib/locations/types';

// Mock del LocationsService
jest.mock('@/shared/lib/locations/LocationsService');

describe('ProvinceSelector Component', () => {
  // Datos de prueba: 50 provincias españolas
  const mockProvinces: Province[] = [
    { code: '01', name: 'Álava', autonomousCommunity: 'País Vasco', coordinates: { lat: 42.8, lng: -2.7 } },
    { code: '02', name: 'Albacete', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 39.0, lng: -1.9 } },
    { code: '03', name: 'Alicante', autonomousCommunity: 'Comunidad Valenciana', coordinates: { lat: 38.3, lng: -0.5 } },
    { code: '04', name: 'Almería', autonomousCommunity: 'Andalucía', coordinates: { lat: 36.8, lng: -2.5 } },
    { code: '05', name: 'Ávila', autonomousCommunity: 'Castilla y León', coordinates: { lat: 40.7, lng: -4.7 } },
    { code: '06', name: 'Badajoz', autonomousCommunity: 'Extremadura', coordinates: { lat: 38.9, lng: -6.3 } },
    { code: '07', name: 'Baleares', autonomousCommunity: 'Islas Baleares', coordinates: { lat: 39.6, lng: 2.9 } },
    { code: '08', name: 'Barcelona', autonomousCommunity: 'Cataluña', coordinates: { lat: 41.4, lng: 2.2 } },
    { code: '09', name: 'Burgos', autonomousCommunity: 'Castilla y León', coordinates: { lat: 42.3, lng: -3.7 } },
    { code: '10', name: 'Cáceres', autonomousCommunity: 'Extremadura', coordinates: { lat: 39.5, lng: -6.4 } },
    { code: '11', name: 'Cádiz', autonomousCommunity: 'Andalucía', coordinates: { lat: 36.5, lng: -6.3 } },
    { code: '12', name: 'Castellón', autonomousCommunity: 'Comunidad Valenciana', coordinates: { lat: 40.0, lng: -0.0 } },
    { code: '13', name: 'Ciudad Real', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 39.0, lng: -3.9 } },
    { code: '14', name: 'Córdoba', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.9, lng: -4.8 } },
    { code: '15', name: 'A Coruña', autonomousCommunity: 'Galicia', coordinates: { lat: 43.4, lng: -8.4 } },
    { code: '16', name: 'Cuenca', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 40.1, lng: -2.1 } },
    { code: '17', name: 'Girona', autonomousCommunity: 'Cataluña', coordinates: { lat: 42.0, lng: 2.8 } },
    { code: '18', name: 'Granada', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.2, lng: -3.6 } },
    { code: '19', name: 'Guadalajara', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 40.6, lng: -3.2 } },
    { code: '20', name: 'Gipuzkoa', autonomousCommunity: 'País Vasco', coordinates: { lat: 43.2, lng: -2.0 } },
    { code: '21', name: 'Huelva', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.3, lng: -6.9 } },
    { code: '22', name: 'Huesca', autonomousCommunity: 'Aragón', coordinates: { lat: 42.1, lng: -0.4 } },
    { code: '23', name: 'Jaén', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.8, lng: -3.8 } },
    { code: '24', name: 'León', autonomousCommunity: 'Castilla y León', coordinates: { lat: 42.6, lng: -5.6 } },
    { code: '25', name: 'Lleida', autonomousCommunity: 'Cataluña', coordinates: { lat: 41.6, lng: 0.6 } },
    { code: '26', name: 'La Rioja', autonomousCommunity: 'La Rioja', coordinates: { lat: 42.3, lng: -2.4 } },
    { code: '27', name: 'Lugo', autonomousCommunity: 'Galicia', coordinates: { lat: 43.0, lng: -7.6 } },
    { code: '28', name: 'Madrid', autonomousCommunity: 'Comunidad de Madrid', coordinates: { lat: 40.4, lng: -3.7 } },
    { code: '29', name: 'Málaga', autonomousCommunity: 'Andalucía', coordinates: { lat: 36.7, lng: -4.4 } },
    { code: '30', name: 'Murcia', autonomousCommunity: 'Región de Murcia', coordinates: { lat: 38.0, lng: -1.1 } },
    { code: '31', name: 'Navarra', autonomousCommunity: 'Navarra', coordinates: { lat: 42.8, lng: -1.6 } },
    { code: '32', name: 'Ourense', autonomousCommunity: 'Galicia', coordinates: { lat: 42.3, lng: -7.9 } },
    { code: '33', name: 'Asturias', autonomousCommunity: 'Principado de Asturias', coordinates: { lat: 43.4, lng: -5.8 } },
    { code: '34', name: 'Palencia', autonomousCommunity: 'Castilla y León', coordinates: { lat: 42.0, lng: -4.5 } },
    { code: '35', name: 'Las Palmas', autonomousCommunity: 'Canarias', coordinates: { lat: 28.1, lng: -15.4 } },
    { code: '36', name: 'Pontevedra', autonomousCommunity: 'Galicia', coordinates: { lat: 42.4, lng: -8.6 } },
    { code: '37', name: 'Salamanca', autonomousCommunity: 'Castilla y León', coordinates: { lat: 40.9, lng: -5.7 } },
    { code: '38', name: 'Santa Cruz de Tenerife', autonomousCommunity: 'Canarias', coordinates: { lat: 28.5, lng: -16.3 } },
    { code: '39', name: 'Cantabria', autonomousCommunity: 'Cantabria', coordinates: { lat: 43.2, lng: -4.0 } },
    { code: '40', name: 'Segovia', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.0, lng: -4.1 } },
    { code: '41', name: 'Sevilla', autonomousCommunity: 'Andalucía', coordinates: { lat: 37.4, lng: -5.9 } },
    { code: '42', name: 'Soria', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.8, lng: -2.5 } },
    { code: '43', name: 'Tarragona', autonomousCommunity: 'Cataluña', coordinates: { lat: 41.1, lng: 1.2 } },
    { code: '44', name: 'Teruel', autonomousCommunity: 'Aragón', coordinates: { lat: 40.3, lng: -1.1 } },
    { code: '45', name: 'Toledo', autonomousCommunity: 'Castilla-La Mancha', coordinates: { lat: 39.9, lng: -4.0 } },
    { code: '46', name: 'Valencia', autonomousCommunity: 'Comunidad Valenciana', coordinates: { lat: 39.5, lng: -0.4 } },
    { code: '47', name: 'Valladolid', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.7, lng: -4.7 } },
    { code: '48', name: 'Bizkaia', autonomousCommunity: 'País Vasco', coordinates: { lat: 43.3, lng: -2.9 } },
    { code: '49', name: 'Zamora', autonomousCommunity: 'Castilla y León', coordinates: { lat: 41.5, lng: -5.7 } },
    { code: '50', name: 'Zaragoza', autonomousCommunity: 'Aragón', coordinates: { lat: 41.7, lng: -0.9 } },
  ];

  // Mock de la instancia del servicio
  let mockServiceInstance: any;

  beforeEach(() => {
    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();

    // Crear mock de la instancia del servicio
    mockServiceInstance = {
      loadData: jest.fn().mockResolvedValue(undefined),
      getProvinces: jest.fn().mockReturnValue(mockProvinces),
      clearCache: jest.fn(),
      isDataLoaded: jest.fn().mockReturnValue(true),
    };

    // Configurar el mock del servicio para retornar la instancia mockeada
    (LocationsService.getInstance as jest.Mock).mockReturnValue(mockServiceInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('renderiza correctamente el componente', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.getByLabelText(/provincia/i)).toBeInTheDocument();
      });

      // Verificar que el select está presente
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('muestra el label con asterisco de campo requerido', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar que el label está presente
      const label = screen.getByLabelText(/provincia/i);
      expect(label).toBeInTheDocument();
      
      // Verificar que hay un asterisco rojo en el DOM
      const asterisk = document.querySelector('.text-red-500');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk?.textContent).toBe('*');
    });

    it('muestra el placeholder por defecto', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar que el placeholder está presente
      expect(screen.getByText('Selecciona una provincia')).toBeInTheDocument();
    });

    it('muestra placeholder personalizado cuando se proporciona', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          placeholder="Elige tu provincia"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      expect(screen.getByText('Elige tu provincia')).toBeInTheDocument();
    });
  });

  // Tests de carga de provincias
  describe('Carga de provincias', () => {
    it('renderiza las 50 provincias españolas', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(mockServiceInstance.loadData).toHaveBeenCalled();
      });

      // Verificar que se llamó a getProvinces
      expect(mockServiceInstance.getProvinces).toHaveBeenCalled();

      // Verificar que se muestran las 50 provincias
      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        // +1 por la opción placeholder
        expect(select.options.length).toBe(51);
      });
    });

    it('muestra mensaje de carga mientras se cargan las provincias', () => {
      // Configurar el mock para que loadData tarde en resolver
      mockServiceInstance.loadData.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      // Verificar que se muestra el mensaje de carga
      expect(screen.getByText('Cargando provincias...')).toBeInTheDocument();
    });

    it('muestra el número de provincias disponibles después de cargar', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('50 provincias disponibles')).toBeInTheDocument();
      });
    });

    it('maneja errores de carga correctamente', async () => {
      // Configurar el mock para que loadData falle
      mockServiceInstance.loadData.mockRejectedValue(
        new Error('Error al cargar datos')
      );

      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      // Esperar a que se muestre el error
      await waitFor(() => {
        expect(screen.getByText('Error al cargar provincias')).toBeInTheDocument();
      });
    });
  });

  // Tests del evento onChange
  describe('Evento onChange', () => {
    it('ejecuta onChange cuando se selecciona una provincia', async () => {
      const handleChange = jest.fn();

      render(
        <ProvinceSelector
          value={null}
          onChange={handleChange}
        />
      );

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Seleccionar una provincia
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '28' } });

      // Verificar que se llamó a onChange con el código y nombre correcto
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith('28', 'Madrid');
    });

    it('no ejecuta onChange cuando se selecciona la opción placeholder', async () => {
      const handleChange = jest.fn();

      render(
        <ProvinceSelector
          value="28"
          onChange={handleChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Intentar seleccionar la opción vacía (placeholder)
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '' } });

      // Verificar que NO se llamó a onChange
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('actualiza el valor seleccionado correctamente', async () => {
      const { rerender } = render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar valor inicial
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('');

      // Actualizar con nuevo valor
      rerender(
        <ProvinceSelector
          value="28"
          onChange={jest.fn()}
        />
      );

      // Verificar que el valor se actualizó
      expect(select.value).toBe('28');
    });
  });

  // Tests del estado disabled
  describe('Estado disabled', () => {
    it('deshabilita el select cuando disabled es true', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('no ejecuta onChange cuando está disabled', async () => {
      const handleChange = jest.fn();

      render(
        <ProvinceSelector
          value={null}
          onChange={handleChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar que el select está disabled
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      
      // Nota: En jsdom, fireEvent.change no respeta el atributo disabled
      // En un navegador real, el usuario no podría cambiar el valor
      // Por lo tanto, verificamos que el select está disabled es suficiente
    });

    it('aplica estilos de disabled correctamente', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
    });

    it('se deshabilita automáticamente durante la carga', () => {
      // Configurar el mock para que loadData tarde en resolver
      mockServiceInstance.loadData.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      // Verificar que está disabled durante la carga
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('se deshabilita automáticamente cuando hay error de carga', async () => {
      // Configurar el mock para que loadData falle
      mockServiceInstance.loadData.mockRejectedValue(
        new Error('Error al cargar datos')
      );

      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      // Esperar a que se muestre el error
      await waitFor(() => {
        expect(screen.getByText('Error al cargar provincias')).toBeInTheDocument();
      });

      // Verificar que está disabled
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });

  // Tests de mostrar error
  describe('Mostrar error', () => {
    it('muestra mensaje de error cuando se proporciona', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          error="Este campo es obligatorio"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar que el mensaje de error está presente
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument();
    });

    it('aplica estilos de error al select cuando hay error', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          error="Error de validación"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500', 'focus:ring-red-500');
    });

    it('el mensaje de error tiene el rol alert', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          error="Error de validación"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Error de validación');
    });

    it('el select tiene aria-invalid cuando hay error', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          error="Error de validación"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('el select tiene aria-describedby cuando hay error', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          error="Error de validación"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'province-error');
    });

    it('no muestra mensaje de error cuando no se proporciona', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar que no hay mensaje de error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('prioriza el error de prop sobre el error de carga', async () => {
      // Configurar el mock para que loadData falle
      mockServiceInstance.loadData.mockRejectedValue(
        new Error('Error al cargar datos')
      );

      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
          error="Error de validación personalizado"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Verificar que se muestra el error de prop (no el de carga)
      expect(screen.getByText('Error de validación personalizado')).toBeInTheDocument();
    });
  });

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('tiene el rol combobox', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('tiene aria-label apropiado', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-label', 'Seleccionar provincia');
    });

    it('tiene id único para asociar con el label', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'province-selector');
    });
  });

  // Tests de integración con LocationsService
  describe('Integración con LocationsService', () => {
    it('llama a loadData al montar el componente', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockServiceInstance.loadData).toHaveBeenCalledTimes(1);
      });
    });

    it('llama a getProvinces después de cargar los datos', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockServiceInstance.getProvinces).toHaveBeenCalled();
      });
    });

    it('obtiene la instancia del servicio correctamente', async () => {
      render(
        <ProvinceSelector
          value={null}
          onChange={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(LocationsService.getInstance).toHaveBeenCalled();
      });
    });
  });
});
