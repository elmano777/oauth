// Google OAuth Service
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  // Campos adicionales del JWT
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  sub: string;
  email_verified: boolean;
  locale?: string;
  hd?: string;
  [key: string]: any; // Para campos adicionales
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleAuthResponse) => void }) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
        };
      };
    };
  }
}

export class GoogleAuthService {
  private clientId: string;
  private isInitialized: boolean = false;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: this.handleCredentialResponse.bind(this),
        });
        this.isInitialized = true;
        resolve();
      } else {
        // Wait for Google script to load
        const checkGoogle = () => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: this.clientId,
              callback: this.handleyResponse.bind(this),
            });
            this.isInitialized = true;
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      }
    });
  }

  private handleCredentialResponse(response: GoogleAuthResponse): void {
    // Decode the JWT token to get user info
    const userInfo = this.decodeJWT(response.credential);
    console.log('Google Auth Response:', userInfo);
    
    // Store user info in localStorage
    localStorage.setItem('googleUser', JSON.stringify(userInfo));
    localStorage.setItem('googleToken', response.credential);
    
    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('googleAuthSuccess', { 
      detail: { user: userInfo, token: response.credential } 
    }));
  }

  private decodeJWT(token: string): GoogleUser {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Failed to decode JWT token');
    }
  }

  renderButton(elementId: string): void {
    if (!this.isInitialized) {
      console.error('Google Auth not initialized');
      return;
    }

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
      }
    );
  }

  signOut(): void {
    localStorage.removeItem('googleUser');
    localStorage.removeItem('googleToken');
    window.dispatchEvent(new CustomEvent('googleAuthSignOut'));
  }

  getCurrentUser(): GoogleUser | null {
    const userStr = localStorage.getItem('googleUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isSignedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService('224887003309-8eoo3t7q2dei8hs52fn13r7t2sesge42.apps.googleusercontent.com');
