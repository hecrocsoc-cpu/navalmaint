import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

export default function NewVessel() {
  const { peticion, cargando } = useApi()
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1) // 1 = barco, 2 = equipos
  const [vesselId, setVesselId] = useState(null)
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [barco, setBarco] = useState({
    nombre: '',
    tipo: '',
    matricula: '',
    anio: '',
    descripcion: ''
  })

  const [equipo, setEquipo] = useState({
    codigo: '',
    nombre: '',
    sistema: '',
    tipo: ''
  })

  const handleBarcoChange = (e) => {
    setBarco({ ...barco, [e.target.name]: e.target.value })
  }

  const handleEquipoChange = (e) => {
    setEquipo({ ...equipo, [e.target.name]: e.target.value })
  }

  const crearBarco = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    try {
      const data = await peticion('/vessels', {
        method: 'post',
        data: { ...barco, anio: parseInt(barco.anio) }
      })
      setVesselId(data.id)
      setMensajeOk(`Barco "${data.nombre}" creado correctamente`)
      setPaso(2)
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const añadirEquipo = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setMensajeOk('')
    try {
      await peticion('/equipment', {
        method: 'post',
        data: { ...equipo, vesselId }
      })
      setMensajeOk(`Equipo "${equipo.nombre}" añadido`)
      setEquipo({ codigo: '', nombre: '', sistema: '', tipo: '' })
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🚢 Añadir embarcación</h1>
        <span className="badge">Paso {paso} de 2</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
      {errorMsg && <div className="error-msg">{errorMsg}</div>}

      {paso === 1 && (
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <h2 style={{ textAlign: 'left', marginBottom: 24, color: '#4a9eff' }}>Datos de la embarcación</h2>
          <form onSubmit={crearBarco}>
            <div className="form-group">
              <label>Nombre</label>
              <input name="nombre" value={barco.nombre} onChange={handleBarcoChange} required placeholder="Ej: Guardamar Talía" />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <input name="tipo" value={barco.tipo} onChange={handleBarcoChange} required placeholder="Ej: Patrullera" />
            </div>
            <div className="form-group">
              <label>Matrícula</label>
              <input name="matricula" value={barco.matricula} onChange={handleBarcoChange} required placeholder="Ej: 7ª-2-09" />
            </div>
            <div className="form-group">
              <label>Año de construcción</label>
              <input name="anio" type="number" value={barco.anio} onChange={handleBarcoChange} required placeholder="Ej: 2009" />
            </div>
            <div className="form-group">
              <label>Descripción (opcional)</label>
              <input name="descripcion" value={barco.descripcion} onChange={handleBarcoChange} placeholder="Ej: Patrullera de Salvamento Marítimo" />
            </div>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Creando...' : 'Crear embarcación →'}
            </button>
          </form>
        </div>
      )}

      {paso === 2 && (
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <h2 style={{ textAlign: 'left', marginBottom: 24, color: '#4a9eff' }}>Añadir equipos</h2>
          <form onSubmit={añadirEquipo}>
            <div className="form-group">
              <label>Código</label>
              <input name="codigo" value={equipo.codigo} onChange={handleEquipoChange} required placeholder="Ej: MP01" />
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input name="nombre" value={equipo.nombre} onChange={handleEquipoChange} required placeholder="Ej: Motor principal estribor" />
            </div>
            <div className="form-group">
              <label>Sistema</label>
              <input name="sistema" value={equipo.sistema} onChange={handleEquipoChange} required placeholder="Ej: Propulsión" />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <input name="tipo" value={equipo.tipo} onChange={handleEquipoChange} required placeholder="Ej: Motor diésel" />
            </div>
            <button type="submit" disabled={cargando}>
              {cargando ? 'Añadiendo...' : '+ Añadir equipo'}
            </button>
          </form>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/equipment')}
              style={{ background: 'transparent', border: '1px solid #2d3f6b', color: '#94a3b8', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}
            >
              Finalizar y ver equipos
            </button>
          </div>
        </div>
      )}
    </div>
  )
}