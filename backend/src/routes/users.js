const express = require('express')
const router = express.Router()
const { getUsers, assignVessel, updateRole, deleteUser } = require('../controllers/userController')
const verifyToken = require('../middleware/auth')
const verifyRole = require('../middleware/roles')

router.get('/', verifyToken, verifyRole('ADMIN'), getUsers)
router.put('/:id/vessel', verifyToken, verifyRole('ADMIN'), assignVessel)
router.put('/:id/role', verifyToken, verifyRole('ADMIN'), updateRole)
router.delete('/:id', verifyToken, verifyRole('ADMIN'), deleteUser)

module.exports = router