import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

const FRECUENCIA_DIAS = {
  DIARIA: 1,
  SEMANAL: 7
}

function tareaPendiente(tarea, logs) {
  const logsDeEstaTarea = logs.filter(l => l.taskId === tarea.id)
  if (logsDeEstaTarea.length === 0) return true
  const ultimoLog = logsDeEstaTarea.reduce((a, b) =>
    new Date(a.fecha) > new Date(b.fecha) ? a : b
  )
  const diasDesdeUltimo = (Date.now() - new Date(ultimoLog.fecha)) / (1000 * 60 * 60 * 24)
  return diasDesdeUltimo >= FRECUENCIA_DIAS[tarea.frecuencia]
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { peticion, cargando } = useApi()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ barcos: 0, equipos: 0, tareas: 0, alertas: 0 })
  const [ultimosLogs, setUltimosLogs] = useState([])
  const [tareasPendientes, setTareasPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [formulario, setFormulario] = useState(null)
  const [logData, setLogData] = useState({ estado: 'OK', horasMotor: '', observaciones: '' })
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [logs, setLogs] = useState([])

  const cargar = async () => {
    try {
      const [vessels, alertas, logsData, tareas] = await Promise.all([
        peticion('/vessels'),
        peticion('/stock/alertas'),
        peticion('/logs'),
        peticion('/tasks')
      ])

      const vesselsFiltrados = usuario?.role === 'MECANICO'
        ? vessels.filter(v => v.id === usuario.vesselId)
        : vessels

      const equiposPorBarco = await Promise.all(
        vesselsFiltrados.map(b => peticion(`/equipment/vessel/${b.id}`))
      )
      const totalEquipos = equiposPorBarco.reduce((acc, eq) => acc + eq.length, 0)

      const alertasFiltradas = usuario?.role === 'MECANICO'
        ? alertas.filter(a => a.vesselId === usuario.vesselId)
        : alertas

      const logsFiltrados = usuario?.role === 'MECANICO'
        ? logsData.filter(l => l.task?.equipment?.vesselId === usuario.vesselId)
        : logsData

      // Tareas DIARIAS y SEMANALES del barco del usuario
      const tareasFiltradas = tareas.filter(t => {
        const esDelBarco = usuario?.role === 'MECANICO'
          ? t.equipment?.vesselId === usuario.vesselId
          : vesselsFiltrados.some(v => v.id === t.equipment?.vesselId)
        const esFrecuenciaRelevante = ['DIARIA', 'SEMANAL'].includes(t.frecuencia)
        return esDelBarco && esFrecuenciaRelevante
      })

      const pendientes = tareasFiltradas.filter(t => tareaPendiente(t, logsData))

      setStats({
        barcos: vesselsFiltrados.length,
        equipos: totalEquipos,
        tareas: tareas.filter(t =>
          usuario?.role === 'MECANICO'
            ? t.equipment?.vesselId === usuario.vesselId
            : true
        ).length,
        alertas: alertasFiltradas.length
      })
      setLogs(logsData)
      setUltimosLogs(logsFiltrados.slice(0, 5))
      setTareasPendientes(pendientes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleRegistrar = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setMensajeOk('')
    try {
      await peticion('/logs', {
        method: 'post',
        data: {
          taskId: formulario,
          estado: logData.estado,
          horasMotor: logData.horasMotor || null,
          observaciones: logData.observaciones || null,
        }
      })
      setMensajeOk(
        logData.estado === 'INCIDENCIA'
          ? '⚠️ Incidencia registrada'
          : '✓ Tarea marcada como completada'
      )
      setFormulario(null)
      setLogData({ estado: 'OK', horasMotor: '', observaciones: '' })
      cargar()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Bienvenido, {usuario?.nombre}</span>
      </div>

      {/* MÉTRICAS */}
      <div className="cards-grid" style={{ marginBottom: 32 }}>
        <div className="card" onClick={() => navigate('/vessels')} style={{ cursor: 'pointer' }}>
          <h3 style={{ color: '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>{loading ? '—' : stats.barcos}</h3>
          <p>🚢 Embarcaciones</p>
        </div>
        <div className="card" onClick={() => navigate('/equipment')} style={{ cursor: 'pointer' }}>
          <h3 style={{ color: '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>{loading ? '—' : stats.equipos}</h3>
          <p>⚙️ Equipos</p>
        </div>
        <div className="card" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>
          <h3 style={{ color: '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>{loading ? '—' : stats.tareas}</h3>
          <p>🔧 Tareas de mantenimiento</p>
        </div>
        <div className="card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer', borderColor: stats.alertas > 0 ? '#ef4444' : undefined }}>
          <h3 style={{ color: stats.alertas > 0 ? '#ef4444' : '#4a9eff', fontSize: '2rem', marginBottom: 4 }}>
            {loading ? '—' : stats.alertas}
          </h3>
          <p>⚠️ Alertas de stock</p>
        </div>
      </div>

      {/* TAREAS PENDIENTES HOY */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#4a9eff', fontSize: '1.1rem', marginBottom: 16 }}>
          🔧 Tareas pendientes
          {!loading && <span className="badge" style={{ marginLeft: 8 }}>{tareasPendientes.length}</span>}
        </h2>

        {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
        {errorMsg && <div className="error-msg">{errorMsg}</div>}

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Cargando...</p>
        ) : tareasPendientes.length === 0 ? (
          <p style={{ color: '#22c55e' }}>✓ Todo al día</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Equipo</th>
                <th>Descripción</th>
                <th>Frecuencia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tareasPendientes.map(t => (
                <>
                  <tr key={t.id}>
                    <td><span className="eq-codigo">{t.codigo}</span></td>
                    <td>{t.equipment?.nombre}</td>
                    <td>{t.descripcion}</td>
                    <td><span className="badge">{t.frecuencia}</span></td>
                    <td>
                      <button
                        onClick={() => {
                          setFormulario(formulario === t.id ? null : t.id)
                          setLogData({ estado: 'OK', horasMotor: '', observaciones: '' })
                          setMensajeOk('')
                          setErrorMsg('')
                        }}
                        style={{
                          padding: '4px 12px',
                          background: formulario === t.id ? 'transparent' : '#1e3a5f',
                          border: '1px solid #2d3f6b',
                          borderRadius: 6,
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {formulario === t.id ? 'Cancelar' : 'Marcar'}
                      </button>
                    </td>
                  </tr>
                  {formulario === t.id && (
                    <tr key={`form-${t.id}`}>
                      <td colSpan={5} style={{ background: '#0f1e36', padding: '16px 20px' }}>
                        <form onSubmit={handleRegistrar} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.8rem' }}>Estado</label>
                            <select
                              value={logData.estado}
                              onChange={e => setLogData({ ...logData, estado: e.target.value })}
                              style={{ padding: '8px 12px', background: '#0a1628', border: '1px solid #2d3f6b', borderRadius: 8, color: '#e2e8f0', fontSize: '0.9rem' }}
                            >
                              <option value="OK">✓ OK</option>
                              <option value="PENDIENTE">⏳ Pendiente</option>
                              <option value="INCIDENCIA">⚠️ Incidencia</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.8rem' }}>Horas motor</label>
                            <input
                              type="number"
                              placeholder="Ej: 4250"
                              value={logData.horasMotor}
                              onChange={e => setLogData({ ...logData, horasMotor: e.target.value })}
                              style={{ width: 120, padding: '8px 12px', background: '#0a1628', border: '1px solid #2d3f6b', borderRadius: 8, color: '#e2e8f0', fontSize: '0.9rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                            <label style={{ fontSize: '0.8rem' }}>Observaciones</label>
                            <input
                              type="text"
                              placeholder="Opcional"
                              value={logData.observaciones}
                              onChange={e => setLogData({ ...logData, observaciones: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', background: '#0a1628', border: '1px solid #2d3f6b', borderRadius: 8, color: '#e2e8f0', fontSize: '0.9rem' }}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={cargando}
                            style={{ padding: '8px 20px', background: '#4a9eff', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}
                          >
                            {cargando ? 'Guardando...' : 'Guardar'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ÚLTIMOS REGISTROS */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#4a9eff', fontSize: '1.1rem', marginBottom: 16 }}>Últimos registros</h2>
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Cargando...</p>
        ) : ultimosLogs.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Sin registros todavía</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tarea</th>
                <th>Equipo</th>
                <th>Estado</th>
                <th>Mecánico</th>
              </tr>
            </thead>
            <tbody>
              {ultimosLogs.map(log => (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div>
        <h2 style={{ color: '#4a9eff', fontSize: '1.1rem', marginBottom: 16 }}>Accesos rápidos</h2>
        <div className="cards-grid">
          <div className="card" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>
            <h3>🔧 Mantenimiento</h3>
            <p>Registrar tarea o incidencia</p>
          </div>
          <div className="card" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>
            <h3>📋 Historial</h3>
            <p>Ver todos los registros</p>
          </div>
          <div className="card" onClick={() => navigate('/stock')} style={{ cursor: 'pointer' }}>
            <h3>📦 Stock</h3>
            <p>Gestionar repuestos</p>
          </div>
          {usuario?.role === 'ADMIN' && (
            <div className="card" onClick={() => navigate('/vessels/new')} style={{ cursor: 'pointer' }}>
              <h3>🚢 Nueva embarcación</h3>
              <p>Dar de alta un barco</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}