import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

export default function Dashboard() {
  const { usuario } = useAuth()
  const { peticion } = useApi()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    barcos: 0,
    equipos: 0,
    tareas: 0,
    alertas: 0
  })
  const [ultimosLogs, setUltimosLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [vessels, alertas, logs] = await Promise.all([
          peticion('/vessels'),
          peticion('/stock/alertas'),
          peticion('/logs')
        ])

        const equiposPorBarco = await Promise.all(
          vessels.map(b => peticion(`/equipment/vessel/${b.id}`))
        )
        const totalEquipos = equiposPorBarco.reduce((acc, eq) => acc + eq.length, 0)
        const tareas = await peticion('/tasks')

        setStats({
          barcos: vessels.length,
          equipos: totalEquipos,
          tareas: tareas.length,
          alertas: alertas.length
        })
        setUltimosLogs(logs.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Bienvenido, {usuario?.nombre}</span>
      </div>

      {/* MÉTRICAS */}
      <div className="cards-grid" style={{ marginBottom: 32 }}>
        <div className="card" onClick={() => navigate('/vessels')} style={{ cursor: 'pointer' }}>
          <h3 style={{ color: '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>{loading ? '—' : stats.barcos}</h3>
          <p>🚢 Embarcaciones</p>
        </div>
        <div className="card" onClick={() => navigate('/equipment')} style={{ cursor: 'pointer' }}>
          <h3 style={{ color: '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>{loading ? '—' : stats.equipos}</h3>
          <p>⚙️ Equipos</p>
        </div>
        <div className="card" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>
          <h3 style={{ color: '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>{loading ? '—' : stats.tareas}</h3>
          <p>🔧 Tareas de mantenimiento</p>
        </div>
        <div className="card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer' }}
          style={{ cursor: 'pointer', borderColor: stats.alertas > 0 ? '#ef4444' : undefined }}>
          <h3 style={{ color: stats.alertas > 0 ? '#ef4444' : '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>
            {loading ? '—' : stats.alertas}
          </h3>
          <p>⚠️ Alertas de stock</p>
        </div>
      </div>

      {/* ÚLTIMAS INCIDENCIAS */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#4a9eff', fontSize: '1.1rem', marginBottom: 16 }}>Últimos registros</h2>
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Cargando...</p>
        ) : ultimosLogs.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Sin registros todavía</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tarea</th>
                <th>Equipo</th>
                <th>Estado</th>
                <th>Mecánico</th>
              </tr>
            </thead>
            <tbody>
              {ultimosLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.fecha).toLocaleDateString('es-ES')}</td>
                  <td>{log.task?.codigo}</td>
                  <td>{log.task?.equipment?.nombre}</td>
                  <td>
                    <span className={`estado-${log.estado.toLowerCase()}`}>
                      {log.estado === 'OK' && '✓ OK'}
                      {log.estado === 'INCIDENCIA' && '⚠️ Incidencia'}
                      {log.estado === 'PENDIENTE' && '⏳ Pendiente'}
                    </span>
                  </td>
                  <td>{log.user?.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div>
        <h2 style={{ color: '#4a9eff', fontSize: '1.1rem', marginBottom: 16 }}>Accesos rápidos</h2>
        <div className="cards-grid">
          <div className="card" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>
            <h3>🔧 Mantenimiento</h3>
            <p>Registrar tarea o incidencia</p>
          </div>
          <div className="card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
            <h3>📋 Historial</h3>
            <p>Ver todos los registros</p>
          </div>
          <div className="card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer' }}>
            <h3>📦 Stock</h3>
            <p>Gestionar repuestos</p>
          </div>
          {usuario?.role === 'ADMIN' && (
            <div className="card" onClick={() => navigate('/vessels/new')} style={{ cursor: 'pointer' }}>
              <h3>🚢 Nueva embarcación</h3>
              <p>Dar de alta un barco</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}