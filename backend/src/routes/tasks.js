const express = require('express')
const router = express.Router()
const { getTasks, getTaskById, createTask, updateTask, deleteTask } = require('../controllers/taskController')
const verifyToken = require('../middleware/auth')
const verifyRole = require('../middleware/roles')
const { body } = require('express-validator')

const taskValidation = [
  body('codigo').notEmpty().withMessage('El código es requerido'),
  body('descripcion').notEmpty().withMessage('La descripción es requerida'),
  body('frecuencia').notEmpty().withMessage('La frecuencia es requerida'),
  body('accion').notEmpty().withMessage('La acción es requerida'),
  body('equipmentId').isInt().withMessage('El equipmentId debe ser un número')
]

router.get('/', verifyToken, getTasks)
router.get('/:id', verifyToken, getTaskById)
router.post('/', verifyToken, verifyRole('ADMIN'), taskValidation, createTask)
router.put('/:id', verifyToken, verifyRole('ADMIN'), taskValidation, updateTask)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteTask)

module.exports = router