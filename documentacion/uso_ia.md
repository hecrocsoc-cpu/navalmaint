# Uso de Inteligencia Artificial en NavalMaint

**Autor:** Héctor Rodríguez Socorro  
**Proyecto:** NavalMaint — Gestión de mantenimiento naval  
**Bootcamp:** Full Stack con IA · 2025

---

## 1. IA integrada en el producto

El módulo de IA es una parte central de NavalMaint, no un añadido. El asistente permite a los mecánicos consultar el plan de mantenimiento de su buque en lenguaje natural, sin necesidad de buscar en documentos PDF o tablas de Excel.

### Arquitectura del módulo

- **LangGraph** — grafo de estados que gestiona el flujo de cada petición
- **ChromaDB** — base de datos vectorial con los 10 documentos del plan de mantenimiento del Guardamar Talía indexados por `vessel_id`
- **Groq + LLaMA 3.3-70b-versatile** — modelo de lenguaje que genera las respuestas
- **MemorySaver** — memoria conversacional que mantiene el contexto por `session_id`

### Tools implementadas

El agente dispone de 3 tools que se ejecutan automáticamente según el contexto:

| Tool | Cuándo se activa | Qué hace |
|------|-----------------|----------|
| `buscar_mantenimiento` | Siempre | RAG sobre ChromaDB, devuelve fragmentos con cita de fuente |
| `obtener_fecha_actual` | Siempre | Fecha del servidor para razonar sobre plazos |
| `calcular_proxima_revision` | Cuando el mensaje contiene una fecha DD/MM/YYYY y una frecuencia | Calcula cuándo toca la próxima revisión y si está vencida |

### Ejemplo de uso real

**Pregunta:** "El filtro de aire se limpió el 01/05/2025, frecuencia mensual. ¿Cuándo toca la próxima?"

**Respuesta del agente:**
> La última limpieza fue el 01/05/2025 con frecuencia mensual (30 días). La próxima revisión toca el 13/06/2026. Estado: ✓ Vence en 3 días. (Fuente: 05_mantenimiento_quincenal.txt)

### Decisión técnica: RAG por frecuencias

Los documentos del plan de mantenimiento están divididos por frecuencia (diario, semanal, mensual…) en lugar de por equipo. Esto mejora la precisión del RAG porque cada chunk contiene información temáticamente coherente — cuando el usuario pregunta por mantenimiento diario, el retriever devuelve exactamente ese documento.

### Decisión técnica: JWT compartido

El módulo IA (FastAPI) y el backend principal (Express) comparten el mismo `JWT_SECRET`. Esto permite que el módulo IA verifique los tokens que firma Express sin consultar la base de datos, manteniendo los dos servicios independientes.

---

## 2. IA como herramienta de desarrollo

Durante el desarrollo de NavalMaint se usó IA (Claude) como asistente de programación de forma intensiva, especialmente en las partes del stack donde el nivel de experiencia era más bajo.

### Áreas donde se usó IA para desarrollar

**Backend Express (Node.js)**
- Estructura inicial de controllers y routes
- Implementación del middleware `verifyRole` para control de acceso por rol
- Lógica de filtrado por `vesselId` en cada endpoint
- Depuración de queries Prisma con includes anidados (`task → equipment → vessel`)

**Módulo IA (FastAPI + LangGraph)**
- Configuración del grafo LangGraph con `MemorySaver`
- Implementación del filtro `vessel_id` en ChromaDB para aislar documentos por buque
- Endpoint de streaming SSE (`/api/chat/stream`)
- Implementación de las 3 tools con `@tool` decorator de LangChain

**Frontend (React)**
- Lógica de tareas pendientes en el Dashboard (cálculo dinámico por frecuencia)
- Implementación del modo claro/oscuro con variables CSS y `ThemeContext`
- Componente `Chat.jsx` con lectura de SSE en tiempo real

**Despliegue**
- Configuración de Railway para dos servicios independientes (Express + FastAPI)
- Depuración del error de JWT_SECRET no sincronizado entre servicios en producción

### Cómo se usó la IA

El proceso fue siempre incremental:

1. Plantear el problema concreto con contexto real (archivos, errores, estructura existente)
2. Revisar el código propuesto antes de aplicarlo
3. Probar en local y depurar con ayuda si había errores
4. Nunca aplicar cambios sin entender qué hacían

La IA no tomó decisiones de arquitectura — esas se tomaron explícitamente y se documentaron. La IA implementó lo que ya estaba decidido.

### Decisiones que se tomaron sin IA

- Usar Prisma 6 en lugar de 7 (compatibilidad probada)
- No usar TypeScript (prioridad sobre legibilidad del código)
- Dividir los documentos RAG por frecuencia en lugar de por equipo
- Usar Groq en lugar de OpenAI (gratuito, misma API, más rápido para desarrollo)
- Mantener Express monolítico en lugar de microservicios

---

## 3. Reflexión

El mayor aprendizaje técnico fue entender cómo funciona RAG en la práctica: la calidad de las respuestas depende casi completamente de cómo están estructurados los documentos, no del modelo. Cambiar la organización de los archivos (por frecuencia en lugar de por equipo) mejoró la precisión de las respuestas más que cualquier ajuste del prompt.

El mayor reto fue la automatización con N8N. Durante el desarrollo, N8N local (v2.23.4) presentó un bug conocido en el nodo Webhook (`Cannot read properties of undefined reading 'getNode'`) que impedía ejecutar los workflows correctamente. El problema persistió incluso después de reinstalar con una versión anterior, ya que esta requería Node.js ≤22 y el entorno tenía Node 24. La solución fue migrar a N8N Cloud, donde el mismo workflow funciona sin problemas. El flujo completo quedó operativo: registro de incidencia → webhook → nodo IF condicional → email al administrador.