const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const prisma = require('../services/prisma')

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { email, password, nombre } = req.body

    const usuarioExiste = await prisma.user.findUnique({ where: { email } })
    if (usuarioExiste) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const usuario = await prisma.user.create({
      data: { email, password: passwordHash, nombre }
    })

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, role: usuario.role },
      token
    })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { email, password } = req.body

    const usuario = await prisma.user.findUnique({ where: { email } })
    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales incorrectas' })
    }

    const passwordValida = await bcrypt.compare(password, usuario.password)
    if (!passwordValida) {
      return res.status(400).json({ error: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, role: usuario.role },
      token
    })
  } catch (err) {
    next(err)
  }
}

const me = async (req, res, next) => {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, nombre: true, role: true, createdAt: true }
    })
    res.json(usuario)
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, me }