/**
 * Tests para el componente PasswordStrengthIndicator
 * Verifica la barra de progreso, requisitos, checkmarks y niveles de fortaleza
 */

import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator from '@/customer/components/auth/PasswordStrengthIndicator';

describe('PasswordStrengthIndicator Component', () => {
  // Tests de renderizado básico
  describe('Renderizado básico', () => {
    it('no renderiza nada cuando la contraseña está vacía', () => {
      const { container } = render(<PasswordStrengthIndicator password="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renderiza el indicador cuando hay contraseña', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      expect(screen.getByText('Fortaleza de la contraseña:')).toBeInTheDocument();
    });

    it('renderiza la lista de requisitos', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      expect(screen.getByText('Requisitos:')).toBeInTheDocument();
      expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Al menos una letra mayúscula')).toBeInTheDocument();
      expect(screen.getByText('Al menos una letra minúscula')).toBeInTheDocument();
      expect(screen.getByText('Al menos un número')).toBeInTheDocument();
      expect(screen.getByText('Al menos un carácter especial')).toBeInTheDocument();
    });
  });

  // Tests de niveles de fortaleza
  describe('Niveles de fortaleza', () => {
    it('muestra "Muy Débil" para contraseña con 0-2 requisitos', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      expect(screen.getByText('Muy Débil')).toBeInTheDocument();
    });

    it('muestra "Débil" para contraseña con 3 requisitos', () => {
      render(<PasswordStrengthIndicator password="Abc123" />);
      expect(screen.getByText('Débil')).toBeInTheDocument();
    });

    it('muestra "Muy Fuerte" para contraseña con todos los requisitos', () => {
      render(<PasswordStrengthIndicator password="Abc123!@#" />);
      expect(screen.getByText('Muy Fuerte')).toBeInTheDocument();
    });
  });

  // Tests de validación de requisitos
  describe('Validación de requisitos', () => {
    it('valida mínimo 8 caracteres correctamente', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="abc" />);
      // Con menos de 8 caracteres, el requisito no se cumple
      let requirement = screen.getByText('Mínimo 8 caracteres').previousSibling;
      expect(requirement).toHaveClass('bg-gray-200');

      // Con 8 o más caracteres, el requisito se cumple
      rerender(<PasswordStrengthIndicator password="abcdefgh" />);
      requirement = screen.getByText('Mínimo 8 caracteres').previousSibling;
      expect(requirement).toHaveClass('bg-green-500');
    });

    it('valida letra mayúscula correctamente', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="abc" />);
      let requirement = screen.getByText('Al menos una letra mayúscula').previousSibling;
      expect(requirement).toHaveClass('bg-gray-200');

      rerender(<PasswordStrengthIndicator password="Abc" />);
      requirement = screen.getByText('Al menos una letra mayúscula').previousSibling;
      expect(requirement).toHaveClass('bg-green-500');
    });

    it('valida letra minúscula correctamente', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="ABC" />);
      let requirement = screen.getByText('Al menos una letra minúscula').previousSibling;
      expect(requirement).toHaveClass('bg-gray-200');

      rerender(<PasswordStrengthIndicator password="Abc" />);
      requirement = screen.getByText('Al menos una letra minúscula').previousSibling;
      expect(requirement).toHaveClass('bg-green-500');
    });

    it('valida número correctamente', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="Abc" />);
      let requirement = screen.getByText('Al menos un número').previousSibling;
      expect(requirement).toHaveClass('bg-gray-200');

      rerender(<PasswordStrengthIndicator password="Abc1" />);
      requirement = screen.getByText('Al menos un número').previousSibling;
      expect(requirement).toHaveClass('bg-green-500');
    });

    it('valida carácter especial correctamente', () => {
      const { rerender } = render(<PasswordStrengthIndicator password="Abc123" />);
      let requirement = screen.getByText('Al menos un carácter especial').previousSibling;
      expect(requirement).toHaveClass('bg-gray-200');

      rerender(<PasswordStrengthIndicator password="Abc123!" />);
      requirement = screen.getByText('Al menos un carácter especial').previousSibling;
      expect(requirement).toHaveClass('bg-green-500');
    });
  });

  // Tests de barra de progreso
  describe('Barra de progreso', () => {
    it('muestra barra roja para contraseña muy débil', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-red-600');
    });

    it('muestra barra amarilla para contraseña media', () => {
      render(<PasswordStrengthIndicator password="Abcd12" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-yellow-500');
    });

    it('muestra barra verde para contraseña muy fuerte', () => {
      render(<PasswordStrengthIndicator password="Abcdef123!@#$%^&*" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-green-500');
    });

    it('tiene atributos ARIA correctos', () => {
      render(<PasswordStrengthIndicator password="Abc123" />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label');
    });
  });

  // Tests de accesibilidad
  describe('Accesibilidad', () => {
    it('usa role="list" para la lista de requisitos', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThanOrEqual(1);
    });

    it('usa role="listitem" para cada requisito', () => {
      render(<PasswordStrengthIndicator password="abc" />);
      const listItems = screen.getAllByRole('listitem');
      // Hay 6 requisitos principales + items de sugerencias
      expect(listItems.length).toBeGreaterThanOrEqual(6);
    });

    it('incluye aria-label en los checkmarks', () => {
      render(<PasswordStrengthIndicator password="Abc" />);
      const checkmarks = screen.getAllByLabelText(/Cumplido|No cumplido/);
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  // Tests de casos extremos
  describe('Casos extremos', () => {
    it('maneja contraseña con solo espacios', () => {
      render(<PasswordStrengthIndicator password="        " />);
      // 8 espacios cumplen el requisito de longitud y caracteres especiales
      expect(screen.getByText('Débil')).toBeInTheDocument();
    });

    it('maneja contraseña muy larga', () => {
      const longPassword = 'Abc123!@#'.repeat(10);
      render(<PasswordStrengthIndicator password={longPassword} />);
      expect(screen.getByText('Muy Fuerte')).toBeInTheDocument();
    });

    it('maneja caracteres especiales Unicode', () => {
      render(<PasswordStrengthIndicator password="Abc123€" />);
      const requirement = screen.getByText('Al menos un carácter especial').previousSibling;
      expect(requirement).toHaveClass('bg-green-500');
    });
  });

  // Tests de className personalizado
  describe('Personalización', () => {
    it('aplica className personalizado', () => {
      const { container } = render(
        <PasswordStrengthIndicator password="abc" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
