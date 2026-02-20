// ─────────────────────────────────────────────────
// Login Page — Email + Password authentication
// Design system: paper bg, accent buttons, DM fonts
// ─────────────────────────────────────────────────

import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const { user, loading, login, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')

  // Already authenticated — redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta de nuevo en unos minutos.')
      } else if (code === 'auth/invalid-email') {
        setError('Formato de email inválido.')
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email.')
      } else if (code === 'auth/invalid-email') {
        setError('Formato de email inválido.')
      } else {
        setError('Error al enviar email. Intenta de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading text-2xl text-ink">FyF Public Relations</h1>
          <p className="text-muted text-sm mt-1">Management Center</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="tu@empresa.com"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                    placeholder:text-muted/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Ingrese su contraseña"
                    className="w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                      placeholder:text-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red text-sm bg-red/5 border border-red/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium
                  hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode('reset'); setError(''); setResetSent(false) }}
                className="w-full text-sm text-muted hover:text-accent transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="font-medium text-ink">Restablecer contraseña</h2>
                <p className="text-sm text-muted mt-1">
                  Ingresa tu email y te enviaremos un link para restablecer tu contraseña.
                </p>
              </div>

              {resetSent ? (
                <div className="text-center space-y-3">
                  <div className="bg-green-net/5 border border-green-net/20 rounded-lg px-3 py-3">
                    <p className="text-sm text-green-net">
                      Email enviado. Revisa tu bandeja de entrada.
                    </p>
                  </div>
                  <button
                    onClick={() => { setMode('login'); setResetSent(false); setError('') }}
                    className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    Volver al login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="tu@empresa.com"
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-white
                        focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                        placeholder:text-muted/50"
                    />
                  </div>

                  {error && (
                    <p className="text-red text-sm bg-red/5 border border-red/20 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium
                      hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperación'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError('') }}
                    className="w-full text-sm text-muted hover:text-accent transition-colors"
                  >
                    Volver al login
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted/60 mt-6">
          Management Center v1.0
        </p>
      </div>
    </div>
  )
}
