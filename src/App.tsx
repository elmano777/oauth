// App.tsx - VERSIÓN CORREGIDA
import { useState, useEffect } from "react";
import { googleAuth, GoogleUser } from "./googleAuth";
import "./App.css";

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Intentar capturar token del callback
        const callbackToken = googleAuth.handleCallbackToken();

        if (callbackToken) {
          console.log("✅ Token recibido del callback");
        }

        // 2. Verificar si hay un token en localStorage
        const token = googleAuth.getCurrentToken();

        if (token) {
          console.log("🔑 Token encontrado en localStorage");

          // 3. Obtener información del usuario
          const userInfo = await googleAuth.getUserInfo(token);

          if (userInfo) {
            console.log("✅ Usuario autenticado:", userInfo);
            setUser(userInfo);
          } else {
            console.error("❌ No se pudo obtener info del usuario");
            setError("No se pudo obtener información del usuario");
          }
        }
      } catch (error: any) {
        console.error("❌ Error inicializando auth:", error);
        setError(error.message || "Error de autenticación");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleSignIn = () => {
    googleAuth.signIn();
  };

  const handleSignOut = () => {
    googleAuth.signOut();
  };

  const handleGetClassrooms = async () => {
    try {
      const classrooms = await googleAuth.getGoogleClassrooms();
      console.log("📚 Cursos de Google Classroom:", classrooms);

      if (classrooms.length === 0) {
        alert("No se encontraron cursos de Google Classroom");
      } else {
        const classroomsList = classrooms
          .map((c, i) => `${i + 1}. ${c.name} (${c.section || "Sin sección"})`)
          .join("\n");
        alert(
          `Cursos encontrados (${classrooms.length}):\n\n${classroomsList}`,
        );
      }
    } catch (error: any) {
      console.error("Error obteniendo classrooms:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleTestProtected = async () => {
    try {
      const result = await googleAuth.testProtectedEndpoint();
      console.log("Resultado endpoint protegido:", result);
      alert(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>🎓 TutorAI - OAuth con Google Classroom</h1>

      {error && (
        <div className="error-message">
          <p>❌ Error: {error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      {user ? (
        <div className="user-profile">
          <div className="user-info">
            <h2>¡Bienvenido, {user.nombre_completo}!</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>📧 Email:</strong>
                <span>{user.email}</span>
              </div>
              <div className="info-item">
                <strong>🆔 ID:</strong>
                <span>{user.usuario_id}</span>
              </div>
              <div className="info-item">
                <strong>🔑 Google ID:</strong>
                <span>{user.google_id}</span>
              </div>
            </div>
          </div>

          <div className="role-info">
            <h3>🎭 Información del Rol</h3>
            <div className="role-badge">
              <span className={`badge ${user.rol}`}>
                {user.rol.toUpperCase()}
              </span>
            </div>
            <div className="role-details">
              <p>
                <strong>👨‍🏫 ¿Es Profesor?</strong>{" "}
                <span className={user.is_teacher ? "yes" : "no"}>
                  {user.is_teacher ? "✅ Sí" : "❌ No"}
                </span>
              </p>
              <p>
                <strong>👨‍🎓 ¿Es Alumno?</strong>{" "}
                <span className={user.is_student ? "yes" : "no"}>
                  {user.is_student ? "✅ Sí" : "❌ No"}
                </span>
              </p>
              <p>
                <strong>📅 Fecha de registro:</strong>{" "}
                {new Date(user.fecha_creacion).toLocaleDateString("es-ES")}
              </p>
              {user.rol_determinado && (
                <p>
                  <strong>🎯 Rol determinado el:</strong>{" "}
                  {new Date(user.rol_determinado).toLocaleDateString("es-ES")}
                </p>
              )}
            </div>
          </div>

          <div className="actions">
            <button onClick={handleTestProtected} className="test-button">
              🧪 Probar Endpoint Protegido
            </button>
            <button onClick={handleGetClassrooms} className="test-button">
              📚 Ver Mis Cursos de Google Classroom
            </button>
            <button onClick={handleSignOut} className="signout-button">
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="login-section">
          <div className="card">
            <h2>🔐 Iniciar Sesión</h2>
            <p>
              Autentícate con tu cuenta de Google (@feyalegria43.edu.pe) para
              acceder al sistema
            </p>
            <p className="info-text">
              ℹ️ El sistema determinará automáticamente si eres profesor o
              alumno consultando Google Classroom
            </p>
            <button onClick={handleSignIn} className="signin-button">
              <span>🔐</span> Iniciar Sesión con Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;