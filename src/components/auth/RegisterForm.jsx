import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function RegisterForm() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) {
      if (error.message?.toLowerCase().includes('already')) {
        setError('An account with this email already exists. Try signing in.')
      } else if (error.message?.toLowerCase().includes('password')) {
        setError('Password must be at least 8 characters.')
      } else {
        setError(error.message)
      }
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="auth-success">
        <p>✅ Account created! Check your email to confirm your address before signing in.</p>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="form-group">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Min 8 characters"
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}
