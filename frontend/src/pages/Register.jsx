import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [errorLocal, setErrorLocal] = useState(null)
  const [exito, setExito] = useState(false)
  const { peticion, cargando } = useApi()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorLocal(null)

    if (!form.nombre || !form.email || !form.password) {
      setErrorLocal('Todos los campos son obligatorios')
      return
    }

    if (form.password.length < 6) {
      setErrorLocal('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      await peticion('/auth/register', {
        method: 'post',
        data: form
      })
      setExito(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setErrorLocal(err.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>NavalMaint</h1>
        <h2>Crear cuenta</h2>

        {errorLocal && <div className="error-msg">{errorLocal}</div>}
        {exito && <div className="success-msg">Cuenta creada. Redirigiendo...</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              disabled={cargando}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              disabled={cargando}
            />
          </div>

          <button type="submit" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  )
}

export default Register