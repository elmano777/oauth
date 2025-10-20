export interface GoogleUser {
  usuario_id: number | null;
  google_id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  is_teacher: boolean;
  is_student: boolean;
  fecha_creacion: string;
  rol_determinado: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_profile: GoogleUser;
  is_new_user: boolean;
  message: string;
}

export interface GoogleClassroom {
  id: string;
  name: string;
  section: string | null;
  description: string | null;
  room: string | null;
  enrollment_code: string | null;
}

export class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private baseUrl: string;

  constructor(
    clientId: string,
    redirectUri: string,
    baseUrl: string = "http://localhost:8000",
  ) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.baseUrl = baseUrl;
  }

  async signIn(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/google/login`);
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error("Error obteniendo URL de login:", error);
      throw error;
    }
  }

  // 🆕 MÉTODO ACTUALIZADO - Ahora captura también el google_token
  handleCallbackToken(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const googleToken = urlParams.get("google_token");
    const error = urlParams.get("error");

    if (error) {
      const message = urlParams.get("message");
      console.error("Error de autenticación:", error, message);
      throw new Error(`Error de autenticación: ${message || error}`);
    }

    if (token) {
      console.log("✅ Token de app guardado");
      localStorage.setItem("appToken", token);

      // 🆕 Guardar también el google_token si existe
      if (googleToken) {
        console.log("✅ Token de Google guardado");
        localStorage.setItem("googleToken", googleToken);
      }

      // Limpiar la URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return token;
    }

    return null;
  }

  async getUserInfo(token?: string): Promise<GoogleUser | null> {
    const authToken = token || this.getCurrentToken();

    if (!authToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.signOut();
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error obteniendo info del usuario:", error);
      return null;
    }
  }

  // 🆕 NUEVO MÉTODO - Obtener cursos de Google Classroom
  async getGoogleClassrooms(): Promise<GoogleClassroom[]> {
    const appToken = this.getCurrentToken();
    const googleToken = this.getGoogleToken();

    if (!appToken) {
      throw new Error("No hay token de autenticación de la app");
    }

    if (!googleToken) {
      throw new Error("No hay token de Google. Vuelve a iniciar sesión.");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/classrooms/google/courses`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${appToken}`,
            google_access_token: googleToken,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Token expirado. Vuelve a iniciar sesión.");
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.classrooms || [];
    } catch (error) {
      console.error("Error obteniendo cursos de Google Classroom:", error);
      throw error;
    }
  }

  async determineUserRole(
    userId: number,
    googleAccessToken?: string,
  ): Promise<any> {
    const token = this.getCurrentToken();

    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/determine-role`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: userId,
          google_access_token: googleAccessToken || null,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error determinando rol del usuario:", error);
      return null;
    }
  }

  async testProtectedEndpoint(): Promise<any> {
    const token = this.getCurrentToken();

    if (!token) {
      throw new Error("No hay token de autenticación");
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error en endpoint protegido:", error);
      return null;
    }
  }

  // 🆕 MÉTODO ACTUALIZADO - Ahora limpia ambos tokens
  signOut(): void {
    localStorage.removeItem("appToken");
    localStorage.removeItem("googleToken");
    window.location.href = "/";
  }

  getCurrentToken(): string | null {
    return localStorage.getItem("appToken");
  }

  // 🆕 NUEVO MÉTODO - Obtener el token de Google
  getGoogleToken(): string | null {
    return localStorage.getItem("googleToken");
  }

  isSignedIn(): boolean {
    return this.getCurrentToken() !== null;
  }

  // 🆕 NUEVO MÉTODO - Verificar si tiene token de Google
  hasGoogleToken(): boolean {
    return this.getGoogleToken() !== null;
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService(
  "1065699173764-rne2gf7jkhld882fl3ag1248cdhf3sck.apps.googleusercontent.com",
  "http://localhost:8000/auth/google/callback",
  "http://localhost:8000",
);