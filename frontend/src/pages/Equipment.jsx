import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

export default function Equipment() {
  const { peticion } = useApi()
  const { usuario } = useAuth()
  const [barcos, setBarcos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formulario, setFormulario] = useState(null)
  const [nuevoEquipo, setNuevoEquipo] = useState({ codigo: '', nombre: '', sistema: '', tipo: '' })
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const cargar = async () => {
    try {
      const vessels = await peticion('/vessels')
      const vesselsFiltrados = usuario?.role === 'MECANICO'
        ? vessels.filter(v => v.id === usuario.vesselId)
        : vessels

      const barcosConEquipos = await Promise.all(
        vesselsFiltrados.map(async (barco) => {
          const equipos = await peticion(`/equipment/vessel/${barco.id}`)
          return { ...barco, equipos }
        })
      )
      setBarcos(barcosConEquipos)
    } catch (err) {
      setError('Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleChange = (e) => {
    setNuevoEquipo({ ...nuevoEquipo, [e.target.name]: e.target.value })
  }

  const handleAñadir = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setMensajeOk('')
    try {
      await peticion('/equipment', {
        method: 'post',
        data: { ...nuevoEquipo, vesselId: formulario }
      })
      setMensajeOk('Equipo añadido correctamente')
      setNuevoEquipo({ codigo: '', nombre: '', sistema: '', tipo: '' })
      setFormulario(null)
      cargar()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  if (loading) return <div className="loading">Cargando equipos...</div>
  if (error) return <div className="error">{error}</div>

  const totalEquipos = barcos.reduce((acc, b) => acc + b.equipos.length, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Equipos</h1>
        <span className="badge">{totalEquipos} equipos</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
      {errorMsg && <div className="error-msg">{errorMsg}</div>}

      {barcos.map(barco => (
        <div key={barco.id} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid #2d3f6b', paddingBottom: 10 }}>
            <h2 style={{ color: '#4a9eff', fontSize: '1.1rem' }}>{barco.nombre}</h2>
            <span className="badge">{barco.equipos.length} equipos</span>
            <span className="eq-sistema">{barco.matricula}</span>
          </div>

          <div className="equipment-grid">
            {barco.equipos.map(eq => (
              <div key={eq.id} className="equipment-card">
                <div className="eq-header">
                  <span className="eq-codigo">{eq.codigo}</span>
                  <span className="eq-sistema">{eq.sistema}</span>
                </div>
                <h3>{eq.nombre}</h3>
                <p className="eq-tipo">{eq.tipo}</p>
              </div>
            ))}

            {usuario?.role === 'ADMIN' && (
              formulario === barco.id ? (
                <div className="equipment-card">
                  <form onSubmit={handleAñadir}>
                    <div className="form-group">
                      <label>Código</label>
                      <input name="codigo" value={nuevoEquipo.codigo} onChange={handleChange} required placeholder="Ej: MP03" />
                    </div>
                    <div className="form-group">
                      <label>Nombre</label>
                      <input name="nombre" value={nuevoEquipo.nombre} onChange={handleChange} required placeholder="Ej: Motor babor" />
                    </div>
                    <div className="form-group">
                      <label>Sistema</label>
                      <input name="sistema" value={nuevoEquipo.sistema} onChange={handleChange} required placeholder="Ej: Propulsión" />
                    </div>
                    <div className="form-group">
                      <label>Tipo</label>
                      <input name="tipo" value={nuevoEquipo.tipo} onChange={handleChange} required placeholder="Ej: Motor diésel" />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="submit" style={{ flex: 1, padding: '8px', background: '#4a9eff', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                        Guardar
                      </button>
                      <button type="button" onClick={() => setFormulario(null)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #2d3f6b', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div
                  className="equipment-card"
                  onClick={() => setFormulario(barco.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed #2d3f6b', opacity: 0.7 }}
                >
                  <span style={{ fontSize: '2rem', color: '#4a9eff' }}>+</span>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}