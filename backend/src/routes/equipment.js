const express = require('express')
const router = express.Router()
const { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController')
const verifyToken = require('../middleware/auth')
const verifyRole = require('../middleware/roles')
const { body } = require('express-validator')

const equipmentValidation = [
  body('codigo').notEmpty().withMessage('El código es requerido'),
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('sistema').notEmpty().withMessage('El sistema es requerido'),
  body('tipo').notEmpty().withMessage('El tipo es requerido'),
  body('vesselId').isInt().withMessage('El vesselId debe ser un número')
]

router.get('/vessel/:vesselId', verifyToken, getEquipment)
router.get('/:id', verifyToken, getEquipmentById)
router.post('/', verifyToken, verifyRole('ADMIN'), equipmentValidation, createEquipment)
router.put('/:id', verifyToken, verifyRole('ADMIN'), equipmentValidation, updateEquipment)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteEquipment)

module.exports = router