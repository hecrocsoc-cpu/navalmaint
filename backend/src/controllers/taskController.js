const { validationResult } = require('express-validator')
const prisma = require('../services/prisma')

const getTasks = async (req, res, next) => {
  try {
    const { equipmentId, frecuencia } = req.query
    const where = {}
    if (equipmentId) where.equipmentId = parseInt(equipmentId)
    if (frecuencia) where.frecuencia = frecuencia

    const tasks = await prisma.maintenanceTask.findMany({
      where,
      include: { equipment: true }
    })
    res.json(tasks)
  } catch (err) {
    next(err)
  }
}

const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.maintenanceTask.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { equipment: true, logs: true }
    })
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' })
    res.json(task)
  } catch (err) {
    next(err)
  }
}

const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { codigo, descripcion, frecuencia, accion, equipmentId } = req.body

    const task = await prisma.maintenanceTask.create({
      data: { codigo, descripcion, frecuencia, accion, equipmentId: parseInt(equipmentId) }
    })
    res.status(201).json(task)
  } catch (err) {
    next(err)
  }
}

const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { codigo, descripcion, frecuencia, accion } = req.body

    const task = await prisma.maintenanceTask.update({
      where: { id: parseInt(req.params.id) },
      data: { codigo, descripcion, frecuencia, accion }
    })
    res.json(task)
  } catch (err) {
    next(err)
  }
}

const deleteTask = async (req, res, next) => {
  try {
    await prisma.maintenanceTask.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Tarea eliminada correctamente' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask }