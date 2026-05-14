import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function History() {
  const { peticion } = useApi()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarLogs = async () => {
      try {
        const data = await peticion('/logs')
        setLogs(data)
      } catch (err) {
        setError('Error al cargar historial')
      } finally {
        setLoading(false)
      }
    }
    cargarLogs()
  }, [])

  if (loading) return <div className="loading">Cargando historial...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Historial de Mantenimiento</h1>
        <span className="badge">{logs.length} registros</span>
      </div>

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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}