import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

export default function Vessels() {
  const { peticion } = useApi()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [buques, setbuques] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await peticion('/vessels')
        const buquesFiltrados = usuario?.role === 'MECANICO'
          ? data.filter(v => v.id === usuario.vesselId)
          : data
        setbuques(buquesFiltrados)
      } catch (err) {
        setError('Error al cargar buques')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  if (loading) return <div className="loading">Cargando buques...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Buques</h1>
        <span className="badge">{buques.length} registradas</span>
      </div>

      <div className="equipment-grid">
        {buques.map(buque => (
          <div key={buque.id} className="equipment-card">
            <div className="eq-header">
              <span className="eq-codigo">{buque.matricula}</span>
              <span className="eq-sistema">{buque.anio}</span>
            </div>
            <h3>{buque.nombre}</h3>
            <p className="eq-tipo">{buque.tipo}</p>
            {buque.descripcion && (
              <p className="eq-tipo" style={{ marginTop: 6, fontSize: '0.8rem' }}>{buque.descripcion}</p>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate(`/equipment?vesselId=${buque.id}`)}
                style={{ flex: 1, padding: '8px', background: '#4a9eff', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Ver equipos
              </button>
              <button
                onClick={() => navigate(`/maintenance?vesselId=${buque.id}`)}
                style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #2d3f6b', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Ver tareas
              </button>
            </div>
          </div>
        ))}
      </div>

      {usuario?.role === 'ADMIN' && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate('/vessels/new')}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #4a9eff', borderRadius: 8, color: '#4a9eff', cursor: 'pointer' }}
          >
            + Añadir buque
          </button>
        </div>
      )}
    </div>
  )
}