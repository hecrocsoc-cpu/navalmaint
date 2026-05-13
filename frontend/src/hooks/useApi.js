import { useState } from 'react'
import axios from 'axios'
import API_URL from '../config/api'

export const useApi = () => {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const peticion = async (endpoint, opciones = {}) => {
    setCargando(true)
    setError(null)

    const token = localStorage.getItem('token')

    try {
      const res = await axios({
        url: `${API_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        ...opciones
      })

      return res.data
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error en la petición'
      setError(mensaje)
      throw new Error(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return { peticion, cargando, error }
}