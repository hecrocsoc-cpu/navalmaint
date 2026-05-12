const { validationResult } = require('express-validator')
const prisma = require('../services/prisma')

const getEquipment = async (req, res, next) => {
  try {
    const equipment = await prisma.equipment.findMany({
      where: { vesselId: parseInt(req.params.vesselId) },
      include: { tasks: true }
    })
    res.json(equipment)
  } catch (err) {
    next(err)
  }
}

const getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { tasks: true }
    })
    if (!equipment) return res.status(404).json({ error: 'Equipo no encontrado' })
    res.json(equipment)
  } catch (err) {
    next(err)
  }
}

const createEquipment = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { codigo, nombre, sistema, tipo, vesselId } = req.body

    const equipment = await prisma.equipment.create({
      data: { codigo, nombre, sistema, tipo, vesselId: parseInt(vesselId) }
    })
    res.status(201).json(equipment)
  } catch (err) {
    next(err)
  }
}

const updateEquipment = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { codigo, nombre, sistema, tipo } = req.body

    const equipment = await prisma.equipment.update({
      where: { id: parseInt(req.params.id) },
      data: { codigo, nombre, sistema, tipo }
    })
    res.json(equipment)
  } catch (err) {
    next(err)
  }
}

const deleteEquipment = async (req, res, next) => {
  try {
    await prisma.equipment.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Equipo eliminado correctamente' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment }