const { validationResult } = require('express-validator')
const prisma = require('../services/prisma')

const getStock = async (req, res, next) => {
  try {
    const { vesselId } = req.query
    const where = {}
    if (vesselId) where.vesselId = parseInt(vesselId)

    const stock = await prisma.stockItem.findMany({
      where,
      include: { vessel: true }
    })
    res.json(stock)
  } catch (err) {
    next(err)
  }
}

const getStockAlertas = async (req, res, next) => {
  try {
    const { vesselId } = req.query
    const where = {}
    if (vesselId) where.vesselId = parseInt(vesselId)

    const stock = await prisma.stockItem.findMany({
      where,
      include: { vessel: true }
    })

    const alertas = stock.filter(item => item.cantidad <= item.minimo)
    res.json(alertas)
  } catch (err) {
    next(err)
  }
}

const getStockById = async (req, res, next) => {
  try {
    const item = await prisma.stockItem.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { vessel: true }
    })
    if (!item) return res.status(404).json({ error: 'Pieza no encontrada' })
    res.json(item)
  } catch (err) {
    next(err)
  }
}

const createStockItem = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { nombre, codigo, cantidad, minimo, clase, vesselId } = req.body

    const item = await prisma.stockItem.create({
      data: {
        nombre,
        codigo,
        cantidad: parseInt(cantidad),
        minimo: parseInt(minimo),
        clase,
        vesselId: parseInt(vesselId)
      }
    })
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

const updateStockItem = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg })
    }

    const { nombre, codigo, cantidad, minimo, clase } = req.body

    const item = await prisma.stockItem.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nombre,
        codigo,
        cantidad: parseInt(cantidad),
        minimo: parseInt(minimo),
        clase
      }
    })
    res.json(item)
  } catch (err) {
    next(err)
  }
}

const deleteStockItem = async (req, res, next) => {
  try {
    await prisma.stockItem.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Pieza eliminada correctamente' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getStock, getStockAlertas, getStockById, createStockItem, updateStockItem, deleteStockItem }