const express = require('express')
const router = express.Router()
const { getLogs, getLogById, createLog } = require('../controllers/logController')
const verifyToken = require('../middleware/auth')
const { body } = require('express-validator')

const logValidation = [
  body('estado').notEmpty().withMessage('El estado es requerido'),
  body('taskId').isInt().withMessage('El taskId debe ser un número')
]

router.get('/', verifyToken, getLogs)
router.get('/:id', verifyToken, getLogById)
router.post('/', verifyToken, logValidation, createLog)

module.exports = router