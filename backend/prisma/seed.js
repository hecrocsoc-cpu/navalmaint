const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // USUARIOS
  const adminPassword = await bcrypt.hash('Admin1234!', 10)
  const mecPassword = await bcrypt.hash('Mecanico1234!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@navalmaint.com' },
    update: {},
    create: {
      email: 'admin@navalmaint.com',
      password: adminPassword,
      nombre: 'Administrador',
      role: 'ADMIN'
    }
  })

  const mecanico = await prisma.user.upsert({
    where: { email: 'mecanico@navalmaint.com' },
    update: {},
    create: {
      email: 'mecanico@navalmaint.com',
      password: mecPassword,
      nombre: 'Juan Pérez',
      role: 'MECANICO'
    }
  })

  console.log('✅ Usuarios creados')

  // BUQUE
  const vessel = await prisma.vessel.upsert({
    where: { matricula: '7ª TF-3-1009' },
    update: {},
    create: {
      nombre: 'Guardamar Talía',
      tipo: 'Patrullera de Salvamento',
      matricula: '7ª TF-3-1009',
      anio: 2009,
      descripcion: 'Patrullera de Salvamento Marítimo de 31.9m. Astilleros Armon 2009. Base Canarias.'
    }
  })

  console.log('✅ Buque creado')

  // EQUIPOS
  const equipos = [
    { codigo: 'MP01', nombre: 'Motor Principal Estribor MTU 4000 M70', sistema: 'PM', tipo: 'Motor Diesel' },
    { codigo: 'MP02', nombre: 'Motor Principal Babor MTU 4000 M70', sistema: 'PM', tipo: 'Motor Diesel' },
    { codigo: 'MA01', nombre: 'Motor Auxiliar 1 John Deere 6068', sistema: 'EG', tipo: 'Grupo Electrógeno' },
    { codigo: 'MA02', nombre: 'Motor Auxiliar 2 John Deere 6068', sistema: 'EG', tipo: 'Grupo Electrógeno' },
    { codigo: 'MG01', nombre: 'Motor Emergencia Mosa GE 33 VSK', sistema: 'EG', tipo: 'Grupo Emergencia' },
    { codigo: 'RE01', nombre: 'Reductora Estribor ZF 7550V', sistema: 'PM', tipo: 'Reductora' },
    { codigo: 'RE02', nombre: 'Reductora Babor ZF 7550V', sistema: 'PM', tipo: 'Reductora' },
    { codigo: 'PF01', nombre: 'Planta Fecales Hamann Supermini', sistema: 'SF', tipo: 'Tratamiento Aguas' },
    { codigo: 'PT01', nombre: 'Planta Osmosis Marnorte BD 40/15', sistema: 'DA', tipo: 'Osmosis Inversa' },
    { codigo: 'DP01', nombre: 'Depuradora Alfa Laval MMB 304', sistema: 'SD', tipo: 'Depuradora' },
    { codigo: 'ST01', nombre: 'Servo Timón ST-2X750', sistema: 'ST', tipo: 'Gobierno' },
    { codigo: 'CM01', nombre: 'Compresor Aire Atlas Copco 50l', sistema: 'SA', tipo: 'Compresor' },
    { codigo: 'CA01', nombre: 'Compresor Aire Respirable', sistema: 'SA', tipo: 'Compresor' },
    { codigo: 'AA01', nombre: 'Aire Acondicionado Condaria', sistema: 'AA', tipo: 'Climatización' },
  ]

  const equiposCreados = {}
  for (const eq of equipos) {
    const created = await prisma.equipment.upsert({
      where: { id: (await prisma.equipment.findFirst({ where: { codigo: eq.codigo, vesselId: vessel.id } }))?.id || 0 },
      update: {},
      create: { ...eq, vesselId: vessel.id }
    })
    equiposCreados[eq.codigo] = created
  }

  console.log('✅ Equipos creados')

  // TAREAS DE MANTENIMIENTO
  const tareas = [
    // MP01 - Motor Principal Estribor
    { codigo: 'MP01-CN-D', descripcion: 'Control nivel aceite motor MP01', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['MP01'].id },
    { codigo: 'MP01-CN-D2', descripcion: 'Control nivel agua refrigeración MP01', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['MP01'].id },
    { codigo: 'MP01-LP-S', descripcion: 'Limpieza prefiltros combustible MP01', frecuencia: 'SEMANAL', accion: 'LP', equipmentId: equiposCreados['MP01'].id },
    { codigo: 'MP01-CM-M', descripcion: 'Cambio filtro aceite MP01', frecuencia: 'MENSUAL', accion: 'CM', equipmentId: equiposCreados['MP01'].id },
    { codigo: 'MP01-CM-T', descripcion: 'Cambio aceite motor MP01', frecuencia: 'TRIMESTRAL', accion: 'CM', equipmentId: equiposCreados['MP01'].id },
    { codigo: 'MP01-OV-A', descripcion: 'Overhaul inyectores MP01', frecuencia: 'ANUAL', accion: 'OV', equipmentId: equiposCreados['MP01'].id },

    // MP02 - Motor Principal Babor
    { codigo: 'MP02-CN-D', descripcion: 'Control nivel aceite motor MP02', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['MP02'].id },
    { codigo: 'MP02-CN-D2', descripcion: 'Control nivel agua refrigeración MP02', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['MP02'].id },
    { codigo: 'MP02-LP-S', descripcion: 'Limpieza prefiltros combustible MP02', frecuencia: 'SEMANAL', accion: 'LP', equipmentId: equiposCreados['MP02'].id },
    { codigo: 'MP02-CM-M', descripcion: 'Cambio filtro aceite MP02', frecuencia: 'MENSUAL', accion: 'CM', equipmentId: equiposCreados['MP02'].id },
    { codigo: 'MP02-CM-T', descripcion: 'Cambio aceite motor MP02', frecuencia: 'TRIMESTRAL', accion: 'CM', equipmentId: equiposCreados['MP02'].id },
    { codigo: 'MP02-OV-A', descripcion: 'Overhaul inyectores MP02', frecuencia: 'ANUAL', accion: 'OV', equipmentId: equiposCreados['MP02'].id },

    // RE01/RE02 - Reductoras
    { codigo: 'RE01-CN-D', descripcion: 'Control nivel aceite reductora RE01', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['RE01'].id },
    { codigo: 'RE01-CM-S', descripcion: 'Cambio aceite reductora RE01', frecuencia: 'SEMESTRAL', accion: 'CM', equipmentId: equiposCreados['RE01'].id },
    { codigo: 'RE02-CN-D', descripcion: 'Control nivel aceite reductora RE02', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['RE02'].id },
    { codigo: 'RE02-CM-S', descripcion: 'Cambio aceite reductora RE02', frecuencia: 'SEMESTRAL', accion: 'CM', equipmentId: equiposCreados['RE02'].id },

    // MA01/MA02 - Auxiliares
    { codigo: 'MA01-CN-D', descripcion: 'Control nivel aceite MA01', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['MA01'].id },
    { codigo: 'MA01-CM-M', descripcion: 'Cambio filtro aceite MA01', frecuencia: 'MENSUAL', accion: 'CM', equipmentId: equiposCreados['MA01'].id },
    { codigo: 'MA02-CN-D', descripcion: 'Control nivel aceite MA02', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['MA02'].id },
    { codigo: 'MA02-CM-M', descripcion: 'Cambio filtro aceite MA02', frecuencia: 'MENSUAL', accion: 'CM', equipmentId: equiposCreados['MA02'].id },

    // PT01 - Osmosis
    { codigo: 'PT01-LP-S', descripcion: 'Limpieza filtros osmosis PT01', frecuencia: 'SEMANAL', accion: 'LP', equipmentId: equiposCreados['PT01'].id },
    { codigo: 'PT01-CN-M', descripcion: 'Control presiones y caudal osmosis', frecuencia: 'MENSUAL', accion: 'CN', equipmentId: equiposCreados['PT01'].id },
    { codigo: 'PT01-CM-A', descripcion: 'Cambio membranas osmosis PT01', frecuencia: 'ANUAL', accion: 'CM', equipmentId: equiposCreados['PT01'].id },

    // DP01 - Depuradora
    { codigo: 'DP01-LP-S', descripcion: 'Limpieza depuradora Alfa Laval', frecuencia: 'SEMANAL', accion: 'LP', equipmentId: equiposCreados['DP01'].id },
    { codigo: 'DP01-OV-T', descripcion: 'Overhaul bowl depuradora', frecuencia: 'TRIMESTRAL', accion: 'OV', equipmentId: equiposCreados['DP01'].id },

    // ST01 - Servo timón
    { codigo: 'ST01-CN-D', descripcion: 'Control nivel aceite hidráulico timón', frecuencia: 'DIARIA', accion: 'CN', equipmentId: equiposCreados['ST01'].id },
    { codigo: 'ST01-PR-M', descripcion: 'Prueba funcionamiento servo timón', frecuencia: 'MENSUAL', accion: 'PR', equipmentId: equiposCreados['ST01'].id },

    // AA01 - Aire acondicionado
    { codigo: 'AA01-LP-M', descripcion: 'Limpieza filtros aire acondicionado', frecuencia: 'MENSUAL', accion: 'LP', equipmentId: equiposCreados['AA01'].id },
    { codigo: 'AA01-CN-T', descripcion: 'Control gas refrigerante AA01', frecuencia: 'TRIMESTRAL', accion: 'CN', equipmentId: equiposCreados['AA01'].id },
  ]

  for (const tarea of tareas) {
    const existing = await prisma.maintenanceTask.findFirst({
      where: { codigo: tarea.codigo }
    })
    if (!existing) {
      await prisma.maintenanceTask.create({ data: tarea })
    }
  }

  console.log('✅ Tareas creadas')

  // STOCK
  const stock = [
    { nombre: 'Aceite MTU Rimula R4 15W40', codigo: 'ACE-MTU-001', cantidad: 200, minimo: 50, clase: 'A', vesselId: vessel.id },
    { nombre: 'Aceite ZF Ecofluid M', codigo: 'ACE-ZF-001', cantidad: 40, minimo: 20, clase: 'A', vesselId: vessel.id },
    { nombre: 'Filtro aceite MTU (MP01/MP02)', codigo: 'FIL-ACE-MTU', cantidad: 6, minimo: 4, clase: 'A', vesselId: vessel.id },
    { nombre: 'Filtro combustible MTU primario', codigo: 'FIL-COM-MTU-P', cantidad: 4, minimo: 4, clase: 'A', vesselId: vessel.id },
    { nombre: 'Filtro combustible MTU secundario', codigo: 'FIL-COM-MTU-S', cantidad: 4, minimo: 4, clase: 'A', vesselId: vessel.id },
    { nombre: 'Filtro aceite John Deere', codigo: 'FIL-ACE-JD', cantidad: 8, minimo: 4, clase: 'A', vesselId: vessel.id },
    { nombre: 'Correa alternador MP01', codigo: 'COR-ALT-MP01', cantidad: 2, minimo: 2, clase: 'B', vesselId: vessel.id },
    { nombre: 'Membrana osmosis Marnorte', codigo: 'MEM-OSM-001', cantidad: 1, minimo: 1, clase: 'A', vesselId: vessel.id },
    { nombre: 'Aceite hidráulico servo timón', codigo: 'ACE-HID-ST01', cantidad: 20, minimo: 10, clase: 'B', vesselId: vessel.id },
    { nombre: 'Refrigerante motores (anticongelante)', codigo: 'REF-MOT-001', cantidad: 30, minimo: 10, clase: 'B', vesselId: vessel.id },
    { nombre: 'Inyector MTU (recambio)', codigo: 'INY-MTU-001', cantidad: 2, minimo: 2, clase: 'A', vesselId: vessel.id },
    { nombre: 'Gas refrigerante R410A', codigo: 'GAS-R410A', cantidad: 1, minimo: 1, clase: 'B', vesselId: vessel.id },
  ]

  for (const item of stock) {
    const existing = await prisma.stockItem.findFirst({
      where: { codigo: item.codigo, vesselId: vessel.id }
    })
    if (!existing) {
      await prisma.stockItem.create({ data: item })
    }
  }

  console.log('✅ Stock creado')

  // LOGS de ejemplo
  const primerasTareas = await prisma.maintenanceTask.findMany({ take: 5 })
  
  for (const tarea of primerasTareas) {
    await prisma.maintenanceLog.create({
      data: {
        fecha: new Date(),
        horasMotor: 4250.5,
        estado: 'OK',
        observaciones: 'Revisión rutinaria sin incidencias',
        taskId: tarea.id,
        userId: mecanico.id
      }
    })
  }

  console.log('✅ Logs de ejemplo creados')
  console.log('🚀 Seed completado correctamente')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })