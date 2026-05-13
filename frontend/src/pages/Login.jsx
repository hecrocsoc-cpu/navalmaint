import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errorLocal, setErrorLocal] = useState(null)
  const { login } = useAuth()
  const { peticion, cargando } = useApi()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorLocal(null)

    if (!form.email || !form.password) {
      setErrorLocal('Todos los campos son obligatorios')
      return
    }

    try {
      const datos = await peticion('/api/auth/login', {
        method: 'post',
        data: form
      })
      login(datos.usuario, datos.token)
      navigate('/dashboard')
    } catch (err) {
      setErrorLocal(err.message)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>NavalMaint</h1>
        <h2>Iniciar sesión</h2>

        {errorLocal && <div className="error-msg">{errorLocal}</div>}

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              disabled={cargando}
            />
          </div>

          <button type="submit" disabled={cargando}>
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </div>
    </div>
  )
}

export default Login