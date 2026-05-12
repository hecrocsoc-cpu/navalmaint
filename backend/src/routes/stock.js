const express = require('express')
const router = express.Router()
const { getStock, getStockAlertas, getStockById, createStockItem, updateStockItem, deleteStockItem } = require('../controllers/stockController')
const verifyToken = require('../middleware/auth')
const verifyRole = require('../middleware/roles')
const { body } = require('express-validator')

const stockValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('codigo').notEmpty().withMessage('El código es requerido'),
  body('cantidad').isInt({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('minimo').isInt({ min: 0 }).withMessage('El mínimo debe ser un número positivo'),
  body('vesselId').isInt().withMessage('El vesselId debe ser un número')
]

router.get('/', verifyToken, getStock)
router.get('/alertas', verifyToken, getStockAlertas)
router.get('/:id', verifyToken, getStockById)
router.post('/', verifyToken, verifyRole('ADMIN'), stockValidation, createStockItem)
router.put('/:id', verifyToken, verifyRole('ADMIN'), stockValidation, updateStockItem)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteStockItem)

module.exports = router