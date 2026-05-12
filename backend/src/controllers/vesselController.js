const { validationResult } = require('express-validator')
const prisma = require('../services/prisma')

const getVessels = async (req, res, next) => {
  try {
    const vessels = await prisma.vessel.findMany({
      include: { equipment: true, stockItems: true }
    })
    res.json(vessels)
  } catch (err) {
    next(err)
  }
}

const getVessel = async (req, res, next) => {
  try {
    const vessel = await prisma.vessel.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { equipment: true, stockItems: true }
    })
    if (!vessel) return res.status(404).json({ error: 'Embarcación no encontrada' })
    res.json(vessel)
  } catch (err) {
    next(err)
  }
}

const createVessel = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { nombre, tipo, matricula, anio, descripcion } = req.body

    const vessel = await prisma.vessel.create({
      data: { nombre, tipo, matricula, anio: parseInt(anio), descripcion }
    })
    res.status(201).json(vessel)
  } catch (err) {
    next(err)
  }
}

const updateVessel = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { nombre, tipo, matricula, anio, descripcion } = req.body

    const vessel = await prisma.vessel.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, tipo, matricula, anio: parseInt(anio), descripcion }
    })
    res.json(vessel)
  } catch (err) {
    next(err)
  }
}

const deleteVessel = async (req, res, next) => {
  try {
    await prisma.vessel.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Embarcación eliminada correctamente' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getVessels, getVessel, createVessel, updateVessel, deleteVessel }