import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>NavalMaint</h1>
        <div className="header-right">
          <span>Hola, {usuario?.nombre}</span>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Dashboard</h2>
        <p>Bienvenido al sistema de gestión de mantenimiento del Guardamar Talía.</p>

        <div className="cards-grid">
          <div className="card">
            <h3>🔧 Mantenimiento</h3>
            <p>Tareas del día pendientes</p>
          </div>
          <div className="card">
            <h3>📋 Historial</h3>
            <p>Logs de mantenimiento</p>
          </div>
          <div className="card">
            <h3>📦 Stock</h3>
            <p>Piezas de repuesto</p>
          </div>
          <div className="card">
            <h3>⚙️ Equipos</h3>
            <p>Equipos del buque</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard