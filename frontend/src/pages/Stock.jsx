import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function Stock() {
  const { peticion } = useApi()
  const [items, setItems] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarStock = async () => {
      try {
        const [dataItems, dataAlertas] = await Promise.all([
          peticion('/stock'),
          peticion('/stock/alertas')
        ])
        setItems(dataItems)
        setAlertas(dataAlertas)
      } catch (err) {
        setError('Error al cargar stock')
      } finally {
        setLoading(false)
      }
    }
    cargarStock()
  }, [])

  if (loading) return <div className="loading">Cargando stock...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📦 Stock de Repuestos</h1>
        <span className="badge">{items.length} items</span>
      </div>

      {alertas.length > 0 && (
        <div className="alertas-box">
          <h3>⚠️ Stock bajo mínimos ({alertas.length})</h3>
          {alertas.map(a => (
            <div key={a.id} className="alerta-item">
              <span>{a.nombre}</span>
              <span className="alerta-qty">{a.cantidad} / mín. {a.minimo}</span>
            </div>
          ))}
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Mínimo</th>
            <th>Clase</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td><span className="eq-codigo">{item.codigo}</span></td>
              <td>{item.nombre}</td>
              <td>{item.cantidad}</td>
              <td>{item.minimo}</td>
              <td><span className="badge">{item.clase}</span></td>
              <td>
                {item.cantidad <= item.minimo
                  ? <span className="estado-alerta">⚠️ Bajo</span>
                  : <span className="estado-ok">✓ OK</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}