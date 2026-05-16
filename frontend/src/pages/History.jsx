import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

export default function History() {
  const { peticion } = useApi()
  const { usuario } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mensajeOk, setMensajeOk] = useState('')
  const [eliminando, setEliminando] = useState(null)

  const cargarLogs = async () => {
    try {
      const data = await peticion('/logs')
      const logsFiltrados = usuario?.role === 'MECANICO'
        ? data.filter(log => log.task?.equipment?.vesselId === usuario.vesselId)
        : data
      setLogs(logsFiltrados)
    } catch (err) {
      setError('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLogs()
  }, [])

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return
    setEliminando(id)
    try {
      await peticion(`/logs/${id}`, { method: 'delete' })
      setMensajeOk('Registro eliminado correctamente')
      setTimeout(() => setMensajeOk(''), 3000)
      await cargarLogs()
    } catch (err) {
      setError('Error al eliminar el registro')
    } finally {
      setEliminando(null)
    }
  }

  if (loading) return <div className="loading">Cargando historial...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Historial de Mantenimiento</h1>
        <span className="badge">{logs.length} registros</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}

      {logs.length === 0 ? (
        <div className="empty">No hay registros todavía</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tarea</th>
              <th>Equipo</th>
              <th>Estado</th>
              <th>Mecánico</th>
              <th>Observaciones</th>
              {usuario?.role === 'ADMIN' && <th></th>}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
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
                <td>{log.observaciones || '—'}</td>
                {usuario?.role === 'ADMIN' && (
                  <td>
                    <button
                      onClick={() => handleEliminar(log.id)}
                      disabled={eliminando === log.id}
                      style={{
                        padding: '4px 10px',
                        background: 'transparent',
                        border: '1px solid #c0392b',
                        borderRadius: 6,
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {eliminando === log.id ? '...' : '🗑 Eliminar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}