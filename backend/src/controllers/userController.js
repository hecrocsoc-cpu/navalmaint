const prisma = require('../services/prisma')

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nombre: true, role: true, vesselId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
}

const assignVessel = async (req, res, next) => {
  try {
    const { vesselId } = req.body
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { vesselId: vesselId ? parseInt(vesselId) : null },
      select: { id: true, email: true, nombre: true, role: true, vesselId: true }
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['ADMIN', 'MECANICO'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      select: { id: true, email: true, nombre: true, role: true, vesselId: true }
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { getUsers, assignVessel, updateRole }