import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function Equipment() {
  const { peticion } = useApi()
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const data = await peticion('/equipment/vessel/1')
        setEquipos(data)
      } catch (err) {
        setError('Error al cargar equipos')
      } finally {
        setLoading(false)
      }
    }
    cargarEquipos()
  }, [])

  if (loading) return <div className="loading">Cargando equipos...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Equipos — Guardamar Talía</h1>
        <span className="badge">{equipos.length} equipos</span>
      </div>

      <div className="equipment-grid">
        {equipos.map(eq => (
          <div key={eq.id} className="equipment-card">
            <div className="eq-header">
              <span className="eq-codigo">{eq.codigo}</span>
              <span className="eq-sistema">{eq.sistema}</span>
            </div>
            <h3>{eq.nombre}</h3>
            <p className="eq-tipo">{eq.tipo}</p>
          </div>
        ))}
      </div>
    </div>
  )
}