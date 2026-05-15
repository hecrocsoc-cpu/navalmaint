# NavalMaint

Aplicación web de gestión de mantenimiento naval basada en el plan de mantenimiento real del **Guardamar Talía**, patrullera de Salvamento Marítimo de 31.9 metros que opera en aguas canarias.

Desarrollada como proyecto de bootcamp full stack, cubre el hueco entre el software profesional del sector (SERTICA, AMOS, ManWinWin), demasiado caro para embarcaciones medianas, y las apps de recreo (Ready4Sea), insuficientes para buques profesionales. Mercado potencial de 2.500M$ en 2024.

---

## Stack técnico

**Backend:** Node.js + Express + PostgreSQL + Prisma 6 + JWT + bcryptjs + nodemailer  
**Frontend:** React 18 + Vite + React Router v6 + Context API + CSS global  
**Despliegue:** Railway (backend + BD) + Vercel (frontend)  
**Tests:** Jest + Supertest

---

## Arrancar en local

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Acceder en: http://localhost:5173

---

## Variables de entorno

**`frontend/.env`**
VITE_API_URL=http://localhost:3000/api

**`backend/.env`**
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000

⚠️ Ningún `.env` va a GitHub — ya están en `.gitignore`.

---

## Credenciales seed

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@navalmaint.com | Admin1234 |
| Mecánico | mecanico@navalmaint.com | Mecanico1234 |

---

## Roles y permisos

**ADMIN**
- Ve todos los barcos y todos sus datos
- Crear, editar y borrar barcos, equipos y tareas
- Gestionar usuarios — asignar barco y cambiar rol
- Ver y eliminar logs en el historial
- Acceso completo a todas las páginas

**MECANICO**
- Solo ve su barco asignado (vesselId) en todas las vistas
- Puede registrar logs de mantenimiento
- Puede gestionar stock de su barco
- No puede crear ni borrar barcos, equipos ni tareas

⚠️ La seguridad de roles está en el backend — el middleware `verifyRole` protege todas las rutas sensibles.

---

## API REST
Auth:      POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
Vessels:   GET/POST        /api/vessels
GET/PUT/DELETE  /api/vessels/:id
Equipment: GET  /api/equipment/vessel/:vesselId
GET/POST        /api/equipment
GET/PUT/DELETE  /api/equipment/:id
Tasks:     GET/POST        /api/tasks
GET/PUT/DELETE  /api/tasks/:id
Logs:      GET/POST        /api/logs
GET/DELETE      /api/logs/:id
Stock:     GET/POST        /api/stock
GET             /api/stock/alertas
GET/PUT/DELETE  /api/stock/:id
Users:     GET             /api/users
PUT             /api/users/:id/vessel
PUT             /api/users/:id/role
Health:    GET /api/health

---

## Tests

```bash
cd backend && npm test
```

8 tests de integración con Jest + Supertest:

1. GET /api/health → 200
2. POST /api/auth/register → 201
3. POST /api/auth/login → 200 con token
4. POST /api/auth/login credenciales incorrectas → 400
5. GET /api/tasks sin token → 401
6. GET /api/tasks con token → 200
7. GET /api/stock con token → 200
8. GET /api/stock/alertas con token → 200

---

## Despliegue

- **Frontend:** https://navalmaint.vercel.app
- **Backend:** https://navalmaint-production.up.railway.app

Actualizar producción:
```bash
git push origin main
```

---

## Mejora futura

Integración con API de Anthropic para importar planes de mantenimiento desde PDF. El usuario sube el PDF del manual y el LLM extrae equipos, tareas, frecuencias y códigos automáticamente.