import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function Maintenance() {
  const { peticion } = useApi()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarTareas = async () => {
      try {
        const data = await peticion('/tasks')
        setTareas(data)
      } catch (err) {
        setError('Error al cargar tareas')
      } finally {
        setLoading(false)
      }
    }
    cargarTareas()
  }, [])

  if (loading) return <div className="loading">Cargando tareas...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔧 Plan de Mantenimiento</h1>
        <span className="badge">{tareas.length} tareas</span>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Equipo</th>
            <th>Descripción</th>
            <th>Frecuencia</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map(t => (
            <tr key={t.id}>
              <td><span className="eq-codigo">{t.codigo}</span></td>
              <td>{t.equipment?.nombre}</td>
              <td>{t.descripcion}</td>
              <td><span className="badge">{t.frecuencia}</span></td>
              <td>{t.accion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}