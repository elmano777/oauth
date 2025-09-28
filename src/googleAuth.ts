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
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleAuthResponse) => void;
          }) => void;
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

  private async handleCredentialResponse(
    response: GoogleAuthResponse,
  ): Promise<void> {
    try {
      // 1. Decodificar JWT de Google (como ya lo haces)
      const userInfo = this.decodeJWT(response.credential);
      console.log("🔑 Google JWT decodificado:", userInfo);

      // 2. ¡NUEVO! Enviar token al backend
      const backendResponse = await this.sendTokenToBackend(
        response.credential,
      );

      // 3. Guardar información
      localStorage.setItem("googleUser", JSON.stringify(userInfo));
      localStorage.setItem("googleToken", response.credential);
      localStorage.setItem("appToken", backendResponse.access_token); // Tu JWT propio

      // 4. Notificar a componentes
      window.dispatchEvent(
        new CustomEvent("googleAuthSuccess", {
          detail: {
            user: userInfo,
            token: response.credential,
            backendResponse: backendResponse,
          },
        }),
      );
    } catch (error) {
      console.error("❌ Error en proceso de autenticación:", error);
      // Manejar error - quizás mostrar mensaje al usuario
    }
  }

  private decodeJWT(token: string): GoogleUser {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      throw new Error("Failed to decode JWT token");
    }
  }

  renderButton(elementId: string): void {
    if (!this.isInitialized) {
      console.error("Google Auth not initialized");
      return;
    }

    window.google.accounts.id.renderButton(document.getElementById(elementId), {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "rectangular",
      text: "signin_with",
      logo_alignment: "left",
    });
  }

  signOut(): void {
    localStorage.removeItem("googleUser");
    localStorage.removeItem("googleToken");
    window.dispatchEvent(new CustomEvent("googleAuthSignOut"));
  }

  getCurrentUser(): GoogleUser | null {
    const userStr = localStorage.getItem("googleUser");
    return userStr ? JSON.parse(userStr) : null;
  }

  isSignedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  async sendTokenToBackend(token: string): Promise<any> {
    try {
      console.log("🚀 Enviando token al backend FastAPI...");

      const response = await fetch("http://localhost:8000/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      console.log("📡 Respuesta del backend:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error del backend:", errorData);
        throw new Error(errorData.detail || "Error del servidor");
      }

      const data = await response.json();
      console.log("✅ Login exitoso en backend:", data);

      // Guardar el token JWT propio (no el de Google)
      localStorage.setItem("appToken", data.access_token);

      return data;
    } catch (error) {
      console.error("💥 Error enviando token al backend:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService(
  "1065699173764-rne2gf7jkhld882fl3ag1248cdhf3sck.apps.googleusercontent.com",
);
