import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function Maintenance() {
  const { peticion } = useApi()
  const [barcos, setBarcos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [colapsados, setColapsados] = useState({})

  useEffect(() => {
    const cargar = async () => {
      try {
        const [vessels, tareas] = await Promise.all([
          peticion('/vessels'),
          peticion('/tasks')
        ])

        const barcosConTareas = vessels.map(barco => ({
          ...barco,
          tareas: tareas.filter(t => t.equipment?.vesselId === barco.id)
        }))

        setBarcos(barcosConTareas)
      } catch (err) {
        setError('Error al cargar tareas')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const toggleColapsar = (id) => {
    setColapsados(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) return <div className="loading">Cargando tareas...</div>
  if (error) return <div className="error">{error}</div>

  const totalTareas = barcos.reduce((acc, b) => acc + b.tareas.length, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔧 Plan de Mantenimiento</h1>
        <span className="badge">{totalTareas} tareas</span>
      </div>

      {barcos.map(barco => (
        <div key={barco.id} style={{ marginBottom: 24 }}>
          <div
            onClick={() => toggleColapsar(barco.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: colapsados[barco.id] ? 0 : 16, borderBottom: '1px solid #2d3f6b', paddingBottom: 10, cursor: 'pointer' }}
          >
            <span style={{ color: '#4a9eff', fontSize: '1rem' }}>
              {colapsados[barco.id] ? '▶' : '▼'}
            </span>
            <h2 style={{ color: '#4a9eff', fontSize: '1.1rem' }}>{barco.nombre}</h2>
            <span className="badge">{barco.tareas.length} tareas</span>
            <span className="eq-sistema">{barco.matricula}</span>
          </div>

          {!colapsados[barco.id] && (
            barco.tareas.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sin tareas registradas</p>
            ) : (
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
                  {barco.tareas.map(t => (
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
            )
          )}
        </div>
      ))}
    </div>
  )
}