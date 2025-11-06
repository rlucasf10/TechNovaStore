/**
 * Tests para el componente SocialLoginButtons
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocialLoginButtons } from '../SocialLoginButtons';
import { authService } from '@/services/auth.service';

// Mock del servicio de autenticación
jest.mock('@/services/auth.service', () => ({
  authService: {
    oauthLogin: jest.fn(),
  },
}));

describe('SocialLoginButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      const mockOAuthLogin = authService.oauthLogin as jest.Mock;
      mockOAuthLogin.mockResolvedValue(undefined);

      render(<SocialLoginButtons />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockOAuthLogin).toHaveBeenCalledWith('google', undefined);
      });
    });

    it('llama a authService.oauthLogin al hacer clic en GitHub', async () => {
      const mockOAuthLogin = authService.oauthLogin as jest.Mock;
      mockOAuthLogin.mockResolvedValue(undefined);

      render(<SocialLoginButtons />);
      
      const githubButton = screen.getByText('Continuar con GitHub');
      fireEvent.click(githubButton);
      
      await waitFor(() => {
        expect(mockOAuthLogin).toHaveBeenCalledWith('github', undefined);
      });
    });

    it('pasa redirectTo al servicio de autenticación', async () => {
      const mockOAuthLogin = authService.oauthLogin as jest.Mock;
      mockOAuthLogin.mockResolvedValue(undefined);

      render(<SocialLoginButtons redirectTo="/dashboard" />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockOAuthLogin).toHaveBeenCalledWith('google', '/dashboard');
      });
    });
  });

  describe('Callbacks', () => {
    it('llama a onOAuthStart cuando se inicia OAuth', async () => {
      const mockOAuthLogin = authService.oauthLogin as jest.Mock;
      mockOAuthLogin.mockResolvedValue(undefined);
      const onOAuthStart = jest.fn();

      render(<SocialLoginButtons onOAuthStart={onOAuthStart} />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(onOAuthStart).toHaveBeenCalledWith('google');
      });
    });

    it('llama a onError cuando falla OAuth', async () => {
      const mockOAuthLogin = authService.oauthLogin as jest.Mock;
      const error = new Error('OAuth failed');
      mockOAuthLogin.mockRejectedValue(error);
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
      
      const googleButton = screen.getByText('Continuar con Google');
      const githubButton = screen.getByText('Continuar con GitHub');
      
      expect(googleButton).toBeDisabled();
      expect(githubButton).toBeDisabled();
    });

    it('deshabilita todos los botones durante carga', async () => {
      const mockOAuthLogin = authService.oauthLogin as jest.Mock;
      // Simular una promesa que nunca se resuelve (loading infinito)
      mockOAuthLogin.mockImplementation(() => new Promise(() => {}));

      render(<SocialLoginButtons />);
      
      const googleButton = screen.getByText('Continuar con Google');
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        const githubButton = screen.getByText('Continuar con GitHub');
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
