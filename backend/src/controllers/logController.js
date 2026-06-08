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

const notificarN8N = async (log) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado: log.estado,
      taskCodigo: log.task.codigo,
      taskDescripcion: log.task.descripcion,
      usuarioNombre: log.user.nombre,
      usuarioEmail: log.user.email,
      observaciones: log.observaciones,
      fecha: new Date().toLocaleString("es-ES"),
    }),
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

      try {
        await notificarN8N(log);
      } catch (n8nErr) {
        console.error("Error notificando N8N:", n8nErr);
      }
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};
const deleteLog = async (req, res, next) => {
  try {
    await prisma.maintenanceLog.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Registro eliminado correctamente" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs, getLogById, createLog, deleteLog };
