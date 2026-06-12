# NavalMaint

Aplicación web de gestión de mantenimiento naval basada en el plan de mantenimiento real del **Guardamar Talía**, patrullera de Salvamento Marítimo de 31.9 metros que opera en aguas canarias.

Desarrollada como proyecto de bootcamp full stack, cubre el hueco entre el software profesional del sector (SERTICA, AMOS, ManWinWin), demasiado caro para embarcaciones medianas, y las apps de recreo (Ready4Sea), insuficientes para buques profesionales. Mercado potencial de 2.500M$ en 2024.

Incluye un asistente de IA con RAG que responde consultas sobre el plan de mantenimiento de cada buque a partir de sus documentos reales.

---

## Stack técnico

**Backend:** Node.js + Express + PostgreSQL + Prisma 6 + JWT + bcryptjs + nodemailer  
**Frontend:** React 18 + Vite + React Router v6 + Context API + CSS global  
**Módulo IA:** Python + FastAPI + LangGraph + ChromaDB + Groq (LLaMA 3.3-70b-versatile)  
**Despliegue:** Railway (backend + BD + módulo IA) + Vercel (frontend)  
**Tests:** Jest + Supertest

---

## Arrancar en local

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — módulo IA
cd backend-ia
source venv/Scripts/activate
uvicorn main:app --reload --port 8000
```

Acceder en: http://localhost:5173

---

## Variables de entorno

**`frontend/.env`**
VITE_API_URL=http://localhost:3000/api
VITE_AI_URL=http://localhost:8000

**`backend/.env`**
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000

**`backend-ia/.env`**
GROQ_API_KEY=...
JWT_SECRET=...          ← mismo valor que en backend/.env
ALLOWED_ORIGINS=http://localhost:5173,https://navalmaint.vercel.app

⚠️ Ningún `.env` va a GitHub — ya están en `.gitignore`.  
⚠️ El `JWT_SECRET` debe ser idéntico en el backend Express y en el módulo IA — así el módulo IA puede verificar los tokens que firma Express.

---

## Credenciales seed

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@navalmaint.com | Admin1234 |
| Mecánico | mecanico@navalmaint.com | Mecanico1234! |

---

## Roles y permisos

**ADMIN**
- Ve todos los buques y todos sus datos
- Crear, editar y borrar buques, equipos y tareas
- Gestionar usuarios — asignar buque y cambiar rol
- Ver y eliminar logs en el historial
- Acceso completo a todas las páginas
- En el chat IA puede consultar cualquier buque

**MECANICO**
- Solo ve su buque asignado (vesselId) en todas las vistas
- Puede registrar logs de mantenimiento
- Puede gestionar stock de su buque
- No puede crear ni borrar buques, equipos ni tareas
- En el chat IA solo consulta documentos de su buque

⚠️ La seguridad de roles está en el backend — el middleware `verifyRole` protege todas las rutas sensibles.

---

## API REST — Backend (Express)
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

## API REST — Módulo IA (FastAPI)
Chat:      POST /api/chat                        ← respuesta completa
           POST /api/chat/stream                 ← streaming SSE
           GET  /api/chat/history/{session_id}   ← historial de sesión
Health:    GET  /api/health
Swagger:   GET  /docs                            ← documentación automática

El módulo IA verifica el mismo JWT que Express (secret compartido) y filtra los documentos por `vessel_id`, de forma que cada usuario solo consulta el plan de su buque.

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
- **Módulo IA:** https://navalmaint-ia-production.up.railway.app

Actualizar producción del backend y frontend:
```bash
git push origin main
```

El módulo IA se despliega desde su carpeta con el CLI de Railway:
```bash
cd backend-ia
railway up
```

---

## Reto técnico: autenticación compartida entre dos backends

NavalMaint tiene **dos backends distintos**: el principal en Express (Node.js) y el módulo de IA en FastAPI (Python). El usuario inicia sesión una sola vez en el frontend, pero las peticiones del chat van al backend de IA, no al de Express.

El reto era: ¿cómo verifica el backend de IA que el usuario está autenticado, si el login se hizo en el otro backend?

**Solución:** usar el mismo `JWT_SECRET` en los dos backends.

- Express **firma** el token al hacer login, con su secret.
- El frontend guarda ese token y lo envía en cada petición al chat.
- El módulo IA **verifica** el token con el mismo secret.

Como los dos comparten la llave, el módulo IA reconoce los tokens de Express sin necesidad de consultar la base de datos ni hacer un segundo login. Si los secrets no coinciden, el módulo IA devuelve un **401 Unauthorized** y el chat no funciona — fue justo el error que hubo que depurar al desplegar: el secret en producción no era idéntico en ambos servicios.

---

## Automatización con N8N

Cuando se registra un log de mantenimiento con estado **INCIDENCIA**, el backend de Express dispara un webhook hacia un workflow de N8N. Allí, un **nodo IF** comprueba el estado:

- Si el estado es `INCIDENCIA` → envía un email de alerta al administrador.
- Si no → no hace nada.

Esto permite que un responsable se entere al instante de un fallo registrado por un mecánico, sin tener que estar revisando la app. El workflow está exportado en `n8n-workflows/incidencia-alert.json`.

---


## Documentación

- **Documentación técnica:** `documentacion/documentation.html` — abre en el navegador
- **Colección Postman:** `documentacion/navalmaint_postman_collection.json` — importar en Postman
- **Swagger FastAPI:** https://navalmaint-ia-production.up.railway.app/docs
- **Uso de IA:** `documentacion/uso_ia.md`

---

## Backlog

- **Dashboard con historial real:** la lógica de tareas pendientes funciona correctamente, pero requiere uso continuado para reflejar el estado real del día. Con historial acumulado, el mecánico ve solo lo que toca según la última vez que se realizó cada tarea.
- **Panel de gestión de usuarios mejorado:** cambiar contraseña. Nodemailer ya está instalado en el backend para el envío de emails.
- **Eliminar usuario con logs:** actualmente no es posible eliminar usuarios que tengan registros en el historial. Requiere borrado en cascada o eliminación previa de logs.
- **Página /vessels/:id:** perfil completo de cada buque con equipos y estadísticas.
- **Campo ubicacion en StockItem:** ubicación física del repuesto en el buque. Requiere migración.
- **Calendario visual de mantenimientos.**
- **Persistencia de ChromaDB con pgvector:** actualmente el módulo IA reindexa los documentos al arrancar. Migrar a pgvector sobre Railway evitaría la reindexación.
- **Importar planes de mantenimiento desde PDF:** el usuario sube el PDF del manual y el LLM extrae equipos, tareas, frecuencias y códigos automáticamente.
