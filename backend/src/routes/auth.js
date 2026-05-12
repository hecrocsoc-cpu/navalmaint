const express = require('express')
const router = express.Router()
const { register, login, me } = require('../controllers/authController')
const verifyToken = require('../middleware/auth')
const { body } = require('express-validator')

router.post('/register', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().withMessage('El nombre es requerido')
], register)

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], login)

router.get('/me', verifyToken, me)

module.exports = router