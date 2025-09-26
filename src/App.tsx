import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { googleAuth, GoogleUser } from './googleAuth'

function App() {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize Google Auth
    const initAuth = async () => {
      try {
        await googleAuth.initialize()
        const currentUser = googleAuth.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error initializing Google Auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth events
    const handleAuthSuccess = (event: CustomEvent) => {
      setUser(event.detail.user)
    }

    const handleSignOut = () => {
      setUser(null)
    }

    window.addEventListener('googleAuthSuccess', handleAuthSuccess as EventListener)
    window.addEventListener('googleAuthSignOut', handleSignOut)

    return () => {
      window.removeEventListener('googleAuthSuccess', handleAuthSuccess as EventListener)
      window.removeEventListener('googleAuthSignOut', handleSignOut)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      // Render Google Sign-In button
      googleAuth.renderButton('google-signin-button')
    }
  }, [isLoading, user])

  const handleSignOut = () => {
    googleAuth.signOut()
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Cargando...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>
      
      <h1>OAuth Login con Google</h1>
      
      {user ? (
        <div className="user-profile">
          <div className="user-info">
            <img src={user.picture} alt="Profile" className="profile-picture" />
            <div className="user-details">
              <h2>¡Bienvenido, {user.name}!</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </div>
          </div>
          
          <div className="jwt-info">
            <h3>📋 Información completa del JWT Token</h3>
            <div className="jwt-details">
              <div className="jwt-section">
                <h4>👤 Información Personal</h4>
                <p><strong>Nombre completo:</strong> {user.name}</p>
                <p><strong>Nombre:</strong> {user.given_name}</p>
                <p><strong>Apellido:</strong> {user.family_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email verificado:</strong> {user.email_verified ? '✅ Sí' : '❌ No'}</p>
                <p><strong>ID de Google:</strong> {user.sub}</p>
                <p><strong>ID alternativo:</strong> {user.id}</p>
                {user.locale && <p><strong>Idioma:</strong> {user.locale}</p>}
                {user.hd && <p><strong>Dominio:</strong> {user.hd}</p>}
              </div>
              
              <div className="jwt-section">
                <h4>🔐 Información del Token</h4>
                <p><strong>Audiencia (aud):</strong> {user.aud}</p>
                <p><strong>Emisor (iss):</strong> {user.iss}</p>
                <p><strong>Emitido en (iat):</strong> {new Date(user.iat * 1000).toLocaleString()}</p>
                <p><strong>Expira en (exp):</strong> {new Date(user.exp * 1000).toLocaleString()}</p>
                <p><strong>Válido por:</strong> {Math.round((user.exp - user.iat) / 3600)} horas</p>
              </div>
              
              <div className="jwt-section">
                <h4>🔍 Todos los campos del JWT</h4>
                <div className="jwt-raw">
                  {Object.entries(user).map(([key, value]) => (
                    <div key={key} className="jwt-field">
                      <strong>{key}:</strong> 
                      <span className="jwt-value">
                        {typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                         typeof value === 'number' ? value : 
                         String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={handleSignOut} className="signout-button">
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div className="login-section">
          <div className="card">
            <h2>Iniciar Sesión con Google</h2>
            <p>Haz clic en el botón de abajo para autenticarte con tu cuenta de Google</p>
            <div id="google-signin-button"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
