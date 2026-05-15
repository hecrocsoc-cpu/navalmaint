const express = require('express')
const router = express.Router()
const { getLogs, getLogById, createLog, deleteLog } = require('../controllers/logController')
const verifyToken = require('../middleware/auth')
const verifyRole = require('../middleware/roles')
const { body } = require('express-validator')

const logValidation = [
  body('estado').notEmpty().withMessage('El estado es requerido'),
  body('taskId').isInt().withMessage('El taskId debe ser un número')
]

router.get('/', verifyToken, getLogs)
router.get('/:id', verifyToken, getLogById)
router.post('/', verifyToken, logValidation, createLog)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteLog)

module.exports = router