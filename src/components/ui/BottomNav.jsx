import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">📊</span>
        <span className="nav-label">Dashboard</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">Settings</span>
      </NavLink>
    </nav>
  )
}
