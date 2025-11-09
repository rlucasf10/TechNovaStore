/**
 * Tests para el componente SocialLoginButtons
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocialLoginButtons } from '@/customer/components/auth/SocialLoginButtons';
import { authService } from '@/customer/services/auth.service';

// Jest automáticamente usa los mocks de __mocks__/

describe('SocialLoginButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks
    (authService.oauthLogin as jest.Mock).mockReset();
  });

  describe('Renderizado', () => {
    it('renderiza botones de Google y GitHub', () => {
      render(<SocialLoginButtons />);
      
      expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
      expect(screen.getByText('Continuar con GitHub')).toBeInTheDocument();
    });

    it('renderiza con clase CSS personalizada', () => {
      const { container } = render(<SocialLoginButtons className="custom-class" />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Interacción', () => {
    it('llama a authService.oauthLogin al hacer clic en Google', async () => {
      (authService.oauthLogin as jest.Mock).mockResolvedValueOnce(undefined);

      render(<SocialLoginButtons />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(authService.oauthLogin).toHaveBeenCalledWith('google', undefined);
      });
    });

    it('llama a authService.oauthLogin al hacer clic en GitHub', async () => {
      (authService.oauthLogin as jest.Mock).mockResolvedValueOnce(undefined);

      render(<SocialLoginButtons />);
      
      const githubButton = screen.getByText('Continuar con GitHub');
      fireEvent.click(githubButton);
      
      await waitFor(() => {
        expect(authService.oauthLogin).toHaveBeenCalledWith('github', undefined);
      });
    });

    it('pasa redirectTo al servicio de autenticación', async () => {
      (authService.oauthLogin as jest.Mock).mockResolvedValueOnce(undefined);

      render(<SocialLoginButtons redirectTo="/dashboard" />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(authService.oauthLogin).toHaveBeenCalledWith('google', '/dashboard');
      });
    });
  });

  describe('Callbacks', () => {
    it('llama a onOAuthStart cuando se inicia OAuth', async () => {
      (authService.oauthLogin as jest.Mock).mockResolvedValueOnce(undefined);
      const onOAuthStart = jest.fn();

      render(<SocialLoginButtons onOAuthStart={onOAuthStart} />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(onOAuthStart).toHaveBeenCalledWith('google');
      });
    });

    it('llama a onError cuando falla OAuth', async () => {
      const error = new Error('OAuth failed');
      (authService.oauthLogin as jest.Mock).mockRejectedValueOnce(error);
      const onError = jest.fn();

      render(<SocialLoginButtons onError={onError} />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Estado Deshabilitado', () => {
    it('deshabilita botones cuando disabled=true', () => {
      render(<SocialLoginButtons disabled />);
      
      const googleButton = screen.getByRole('button', { name: /Continuar con Google/i });
      const githubButton = screen.getByRole('button', { name: /Continuar con GitHub/i });
      
      expect(googleButton).toBeDisabled();
      expect(githubButton).toBeDisabled();
    });

    it('deshabilita todos los botones durante carga', async () => {
      // Simular una promesa que tarda en resolverse
      (authService.oauthLogin as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

      render(<SocialLoginButtons />);
      
      const googleButton = screen.getByRole('button', { name: /Continuar con Google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        const githubButton = screen.getByRole('button', { name: /Continuar con GitHub/i });
        expect(githubButton).toBeDisabled();
      });
    });
  });

  describe('Accesibilidad', () => {
    it('tiene ARIA labels apropiados', () => {
      render(<SocialLoginButtons />);
      
      const googleButton = screen.getByLabelText('Continuar con Google');
      const githubButton = screen.getByLabelText('Continuar con GitHub');
      
      expect(googleButton).toBeInTheDocument();
      expect(githubButton).toBeInTheDocument();
    });
  });
});
