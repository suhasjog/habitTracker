import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../App'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export default function AuthPage() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Habit Tracker</h1>
          <p>Build better habits, one day at a time.</p>
        </div>
        <div className="auth-tabs">
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            Create Account
          </button>
        </div>
        {tab === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  )
}
