const { validationResult } = require("express-validator");
const prisma = require("../services/prisma");
const nodemailer = require("nodemailer");

const sendIncidenciaEmail = async (task, usuario, observaciones) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_ADMIN,
    subject: `⚠️ Incidencia registrada - ${task.codigo}`,
    html: `
      <h2>Incidencia registrada en NavalMaint</h2>
      <p><strong>Tarea:</strong> ${task.descripcion}</p>
      <p><strong>Código:</strong> ${task.codigo}</p>
      <p><strong>Registrada por:</strong> ${usuario.nombre}</p>
      <p><strong>Observaciones:</strong> ${observaciones}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
    `,
  });
};

const getLogs = async (req, res, next) => {
  try {
    const { taskId, userId, estado } = req.query;
    const where = {};
    if (taskId) where.taskId = parseInt(taskId);
    if (userId) where.userId = parseInt(userId);
    if (estado) where.estado = estado;

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: {
        task: {
          include: { equipment: true },
        },
        user: true,
      },
      orderBy: { fecha: "desc" },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

const getLogById = async (req, res, next) => {
  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { task: true, user: true },
    });
    if (!log) return res.status(404).json({ error: "Registro no encontrado" });
    res.json(log);
  } catch (err) {
    next(err);
  }
};

const createLog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { horasMotor, estado, observaciones, taskId } = req.body;

    const log = await prisma.maintenanceLog.create({
      data: {
        horasMotor: horasMotor ? parseFloat(horasMotor) : null,
        estado,
        observaciones,
        taskId: parseInt(taskId),
        userId: req.user.id,
      },
      include: { task: true, user: true },
    });

    if (estado === "INCIDENCIA") {
      try {
        await sendIncidenciaEmail(log.task, log.user, observaciones);
      } catch (emailErr) {
        console.error("Error enviando email:", emailErr);
      }
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs, getLogById, createLog };
