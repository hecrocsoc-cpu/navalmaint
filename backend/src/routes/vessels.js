const express = require('express')
const router = express.Router()
const { getVessels, getVessel, createVessel, updateVessel, deleteVessel } = require('../controllers/vesselController')
const verifyToken = require('../middleware/auth')
const verifyRole = require('../middleware/roles')
const { body } = require('express-validator')

const vesselValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('tipo').notEmpty().withMessage('El tipo es requerido'),
  body('matricula').notEmpty().withMessage('La matrícula es requerida'),
  body('anio').isInt({ min: 1900, max: 2100 }).withMessage('El año no es válido')
]

router.get('/', verifyToken, getVessels)
router.get('/:id', verifyToken, getVessel)
router.post('/', verifyToken, verifyRole('ADMIN'), vesselValidation, createVessel)
router.put('/:id', verifyToken, verifyRole('ADMIN'), vesselValidation, updateVessel)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteVessel)

module.exports = router