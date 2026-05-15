import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'

export default function Users() {
  const { peticion } = useApi()
  const [usuarios, setUsuarios] = useState([])
  const [barcos, setBarcos] = useState([])
  const [loading, setLoading] = useState(true)
  const [mensajeOk, setMensajeOk] = useState('')
  const [error, setError] = useState(null)

  const cargar = async () => {
    try {
      const [users, vessels] = await Promise.all([
        peticion('/users'),
        peticion('/vessels')
      ])
      setUsuarios(users)
      setBarcos(vessels)
    } catch (err) {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleAsignar = async (userId, vesselId) => {
    try {
      await peticion(`/users/${userId}/vessel`, {
        method: 'put',
        data: { vesselId: vesselId === '' ? null : vesselId }
      })
      setMensajeOk('Barco asignado correctamente')
      setTimeout(() => setMensajeOk(''), 3000)
      await cargar()
    } catch (err) {
      setError('Error al asignar barco')
    }
  }

  const handleRol = async (userId, roleActual) => {
    const nuevoRol = roleActual === 'ADMIN' ? 'MECANICO' : 'ADMIN'
    if (!window.confirm(`¿Cambiar rol a ${nuevoRol}?`)) return
    try {
      await peticion(`/users/${userId}/role`, {
        method: 'put',
        data: { role: nuevoRol }
      })
      setMensajeOk(`Rol cambiado a ${nuevoRol}`)
      setTimeout(() => setMensajeOk(''), 3000)
      await cargar()
    } catch (err) {
      setError('Error al cambiar rol')
    }
  }

  if (loading) return <div className="loading">Cargando usuarios...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👥 Gestión de Usuarios</h1>
        <span className="badge">{usuarios.length} usuarios</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Barco asignado</th>
            <th>Barco</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td>
                {u.vesselId
                  ? barcos.find(b => b.id === u.vesselId)?.nombre || `ID ${u.vesselId}`
                  : <span style={{ color: '#94a3b8' }}>Sin asignar</span>
                }
              </td>
              <td>
                {u.role === 'MECANICO' && (
                  <select
                    defaultValue={u.vesselId || ''}
                    onChange={(e) => handleAsignar(u.id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      background: '#0a1628',
                      border: '1px solid #2d3f6b',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value=''>Sin asignar</option>
                    {barcos.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                )}
              </td>
              <td>
                <button
                  onClick={() => handleRol(u.id, u.role)}
                  style={{
                    padding: '4px 10px',
                    background: 'transparent',
                    border: `1px solid ${u.role === 'ADMIN' ? '#c0392b' : '#2d6a4f'}`,
                    borderRadius: 6,
                    color: u.role === 'ADMIN' ? '#e74c3c' : '#52b788',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {u.role === 'ADMIN' ? '↓ Hacer mecánico' : '↑ Hacer admin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}