import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

export default function Stock() {
  const { peticion, cargando } = useApi()
  const { usuario } = useAuth()
  const [barcos, setBarcos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [colapsados, setColapsados] = useState({})
  const [formulario, setFormulario] = useState(null)
  const [nuevoItem, setNuevoItem] = useState({ codigo: '', nombre: '', cantidad: '', minimo: '', clase: 'B' })
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [actualizando, setActualizando] = useState(null)

  const cargar = async () => {
    try {
      const [vessels, items, dataAlertas] = await Promise.all([
        peticion('/vessels'),
        peticion('/stock'),
        peticion('/stock/alertas')
      ])

      const vesselsFiltrados = usuario?.role === 'MECANICO'
        ? vessels.filter(v => v.id === usuario.vesselId)
        : vessels

      const barcosConStock = vesselsFiltrados.map(barco => ({
        ...barco,
        items: items.filter(i => i.vesselId === barco.id)
      }))
      setBarcos(barcosConStock)
      setAlertas(dataAlertas.filter(a =>
        usuario?.role === 'MECANICO' ? a.vesselId === usuario.vesselId : true
      ))
    } catch (err) {
      setError('Error al cargar stock')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const toggleColapsar = (id) => {
    setColapsados(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCantidad = async (item, delta) => {
    const nuevaCantidad = item.cantidad + delta
    if (nuevaCantidad < 0) return
    setActualizando(item.id)
    try {
      await peticion(`/stock/${item.id}`, {
        method: 'put',
        data: {
          nombre: item.nombre,
          codigo: item.codigo,
          cantidad: nuevaCantidad,
          minimo: item.minimo,
          clase: item.clase,
          vesselId: item.vesselId
        }
      })
      await cargar()
    } catch (err) {
      setErrorMsg('Error al actualizar cantidad')
    } finally {
      setActualizando(null)
    }
  }

  const handleAñadir = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setMensajeOk('')
    try {
      await peticion('/stock', {
        method: 'post',
        data: {
          ...nuevoItem,
          cantidad: parseInt(nuevoItem.cantidad),
          minimo: parseInt(nuevoItem.minimo),
          vesselId: formulario
        }
      })
      setMensajeOk('Item añadido correctamente')
      setNuevoItem({ codigo: '', nombre: '', cantidad: '', minimo: '', clase: 'B' })
      setFormulario(null)
      cargar()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const handleChange = (e) => {
    setNuevoItem({ ...nuevoItem, [e.target.name]: e.target.value })
  }

  if (loading) return <div className="loading">Cargando stock...</div>
  if (error) return <div className="error">{error}</div>

  const totalItems = barcos.reduce((acc, b) => acc + b.items.length, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📦 Stock de Repuestos</h1>
        <span className="badge">{totalItems} items</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
      {errorMsg && <div className="error-msg">{errorMsg}</div>}

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
            <span className="badge">{barco.items.length} items</span>
            <span className="eq-sistema">{barco.matricula}</span>
          </div>

          {!colapsados[barco.id] && (
            <div>
              {barco.items.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 12 }}>Sin stock registrado</p>
              ) : (
                <table className="table" style={{ marginBottom: 12 }}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Cantidad</th>
                      <th>Mínimo</th>
                      <th>Clase</th>
                      <th>Estado</th>
                      <th>Actualizar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barco.items.map(item => (
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
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => handleCantidad(item, -1)}
                              disabled={actualizando === item.id || item.cantidad === 0}
                              style={{ width: 28, height: 28, background: '#2d1b1b', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                            >
                              −
                            </button>
                            <span style={{ minWidth: 24, textAlign: 'center' }}>
                              {actualizando === item.id ? '...' : item.cantidad}
                            </span>
                            <button
                              onClick={() => handleCantidad(item, +1)}
                              disabled={actualizando === item.id}
                              style={{ width: 28, height: 28, background: '#1b2d1b', border: '1px solid #22c55e', borderRadius: 6, color: '#22c55e', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {usuario?.role === 'ADMIN' && (
                formulario === barco.id ? (
                  <div className="equipment-card" style={{ maxWidth: 400 }}>
                    <form onSubmit={handleAñadir}>
                      <div className="form-group">
                        <label>Código</label>
                        <input name="codigo" value={nuevoItem.codigo} onChange={handleChange} required placeholder="Ej: FIL-001" />
                      </div>
                      <div className="form-group">
                        <label>Nombre</label>
                        <input name="nombre" value={nuevoItem.nombre} onChange={handleChange} required placeholder="Ej: Filtro de aceite MTU" />
                      </div>
                      <div className="form-group">
                        <label>Cantidad</label>
                        <input name="cantidad" type="number" min="0" value={nuevoItem.cantidad} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label>Mínimo</label>
                        <input name="minimo" type="number" min="0" value={nuevoItem.minimo} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label>Clase</label>
                        <select name="clase" value={nuevoItem.clase} onChange={handleChange}
                          style={{ width: '100%', padding: '10px 14px', background: '#0a1628', border: '1px solid #2d3f6b', borderRadius: 8, color: '#e2e8f0', fontSize: '1rem' }}>
                          <option value="A">A — Crítico</option>
                          <option value="B">B — Estándar</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="submit" disabled={cargando} style={{ flex: 1, padding: '8px', background: '#4a9eff', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                          {cargando ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button type="button" onClick={() => setFormulario(null)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #2d3f6b', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button
                    onClick={() => setFormulario(barco.id)}
                    style={{ marginTop: 8, padding: '8px 20px', background: 'transparent', border: '1px dashed #2d3f6b', borderRadius: 8, color: '#4a9eff', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    + Añadir repuesto
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}