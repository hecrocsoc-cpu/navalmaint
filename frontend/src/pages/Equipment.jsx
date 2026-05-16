import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

const CODIGOS_EQUIPOS = [
  { codigo: 'MP01/MP02', descripcion: 'Motores principales (MTU 4000 M70)' },
  { codigo: 'MA01/MA02', descripcion: 'Motores auxiliares (John Deere 6068)' },
  { codigo: 'MG01', descripcion: 'Motor generador de puerto (Mosa GE 33 VSK)' },
  { codigo: 'RE01/RE02', descripcion: 'Reductoras (ZF 7550V)' },
  { codigo: 'PF01', descripcion: 'Planta de aguas fecales (Hamann supermini)' },
  { codigo: 'PT01', descripcion: 'Potabilizadora (Marnorte BD 40/15)' },
  { codigo: 'DP01', descripcion: 'Depuradora de combustible (Alfa Laval MMB 304)' },
  { codigo: 'ST01', descripcion: 'Servo timón (ST-2X750)' },
  { codigo: 'CM01', descripcion: 'Compresor de aire (Atlas Copco 50l)' },
  { codigo: 'CA01', descripcion: 'Compresor aire respirable' },
  { codigo: 'AA01', descripcion: 'Aire acondicionado (Condaria)' },
]

export default function Equipment() {
  const { peticion } = useApi()
  const { usuario } = useAuth()
  const [buques, setbuques] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formulario, setFormulario] = useState(null)
  const [nuevoEquipo, setNuevoEquipo] = useState({ codigo: '', nombre: '', sistema: '', tipo: '' })
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [codigosAbiertos, setCodigosAbiertos] = useState({})

  const cargar = async () => {
    try {
      const vessels = await peticion('/vessels')
      const vesselsFiltrados = usuario?.role === 'MECANICO'
        ? vessels.filter(v => v.id === usuario.vesselId)
        : vessels

      const buquesConEquipos = await Promise.all(
        vesselsFiltrados.map(async (buque) => {
          const equipos = await peticion(`/equipment/vessel/${buque.id}`)
          return { ...buque, equipos }
        })
      )
      setbuques(buquesConEquipos)
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

  const totalEquipos = buques.reduce((acc, b) => acc + b.equipos.length, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Equipos</h1>
        <span className="badge">{totalEquipos} equipos</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
      {errorMsg && <div className="error-msg">{errorMsg}</div>}

      {buques.map(buque => (
        <div key={buque.id} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, borderBottom: '1px solid #2d3f6b', paddingBottom: 10 }}>
            <h2 style={{ color: '#4a9eff', fontSize: '1.1rem' }}>{buque.nombre}</h2>
            <span className="badge">{buque.equipos.length} equipos</span>
            <span className="eq-sistema">{buque.matricula}</span>
            <button
              onClick={() => setCodigosAbiertos(prev => ({ ...prev, [buque.id]: !prev[buque.id] }))}
              style={{
                marginLeft: 'auto',
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid #2d3f6b',
                borderRadius: 6,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
               📖Códigos equipos
            </button>
          </div>

          {codigosAbiertos[buque.id] && (
            <div style={{ marginBottom: 16, background: '#0f1e36', borderRadius: 8, padding: '12px 16px' }}>
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Equipo</th>
                  </tr>
                </thead>
                <tbody>
                  {CODIGOS_EQUIPOS.map(c => (
                    <tr key={c.codigo}>
                      <td><span className="eq-codigo">{c.codigo}</span></td>
                      <td>{c.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="equipment-grid">
            {buque.equipos.map(eq => (
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
              formulario === buque.id ? (
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
                  onClick={() => setFormulario(buque.id)}
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