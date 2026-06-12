from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage, AIMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, Annotated, Sequence
import operator
import os
import re
from datetime import datetime, timedelta
from pathlib import Path

class EstadoAgente(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    vessel_id: int

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile",
    temperature=0
)

embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

_retrievers = {}

def get_or_create_retriever(vessel_id: int):
    if vessel_id in _retrievers:
        return _retrievers[vessel_id]

    docs_path = Path(__file__).parent.parent / "docs" / f"vessel_{vessel_id}"
    chroma_path = f"./chroma_db/vessel_{vessel_id}"

    if not docs_path.exists():
        return None

    chroma_dir = Path(chroma_path)
    if chroma_dir.exists() and any(chroma_dir.iterdir()):
        vectorstore = Chroma(
            persist_directory=chroma_path,
            embedding_function=embeddings
        )
        print(f"vessel_{vessel_id} — ChromaDB cargado desde disco")
    else:
        documentos = []
        for txt in docs_path.glob("*.txt"):
            loader = TextLoader(str(txt), encoding="utf-8")
            documentos.extend(loader.load())

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )
        chunks = splitter.split_documents(documentos)

        vistos = set()
        chunks_unicos = []
        for c in chunks:
            if c.page_content not in vistos:
                vistos.add(c.page_content)
                chunks_unicos.append(c)

        print(f"vessel_{vessel_id} — chunks únicos indexados: {len(chunks_unicos)}")
        vectorstore = Chroma.from_documents(
            chunks_unicos,
            embeddings,
            persist_directory=chroma_path
        )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
    _retrievers[vessel_id] = retriever
    return retriever


# ============================================================
# TOOLS — declaradas con @tool, ejecutadas desde nodo_llm
# ============================================================

@tool
def buscar_mantenimiento(consulta: str, vessel_id: int = 1) -> str:
    """Busca información en el plan de mantenimiento del barco.
    Úsala cuando el usuario pregunte sobre tareas, frecuencias,
    equipos, sistemas o procedimientos de mantenimiento."""
    retriever = get_or_create_retriever(vessel_id)
    if retriever is None:
        return "No hay documentos de mantenimiento indexados para este barco."
    docs = retriever.invoke(consulta)
    if not docs:
        return "No encontré información relevante en el plan de mantenimiento."
    resultado = ""
    for i, doc in enumerate(docs, 1):
        fuente = Path(doc.metadata.get("source", "").replace("\\", "/")).name
        resultado += f"\n[Fuente {i}: {fuente}]\n{doc.page_content}\n"
    return resultado


@tool
def obtener_fecha_actual() -> str:
    """Devuelve la fecha y hora actual.
    Úsala cuando el usuario pregunte por fechas, plazos,
    o necesite saber cuándo vence una tarea de mantenimiento."""
    ahora = datetime.now()
    return (
        f"Fecha actual: {ahora.strftime('%A, %d de %B de %Y')}\n"
        f"Hora: {ahora.strftime('%H:%M')}\n"
        f"Día del año: {ahora.timetuple().tm_yday}"
    )


@tool
def calcular_proxima_revision(fecha_ultimo_mantenimiento: str, frecuencia: str) -> str:
    """Calcula cuándo toca la próxima revisión dado el último mantenimiento y la frecuencia.
    Úsala cuando el usuario pregunte cuándo vence o toca una tarea.
    Parámetros:
    - fecha_ultimo_mantenimiento: fecha en formato DD/MM/YYYY
    - frecuencia: DIARIA, CADA_DOS_DIAS, CADA_CUATRO_DIAS, SEMANAL, QUINCENAL,
      MENSUAL, BIMESTRAL, TRIMESTRAL, SEMESTRAL, ANUAL, BIANUAL
    """
    FRECUENCIA_DIAS = {
        "DIARIA": 1, "CADA_DOS_DIAS": 2, "CADA_CUATRO_DIAS": 4,
        "SEMANAL": 7, "QUINCENAL": 15, "MENSUAL": 30,
        "BIMESTRAL": 60, "TRIMESTRAL": 90, "SEMESTRAL": 180,
        "ANUAL": 365, "BIANUAL": 730,
    }
    frecuencia_upper = frecuencia.upper().replace(" ", "_")
    if frecuencia_upper not in FRECUENCIA_DIAS:
        return f"Frecuencia '{frecuencia}' no reconocida."
    try:
        ultimo = datetime.strptime(fecha_ultimo_mantenimiento, "%d/%m/%Y")
    except ValueError:
        return "Formato de fecha incorrecto. Usa DD/MM/YYYY"
    dias = FRECUENCIA_DIAS[frecuencia_upper]
    proxima = ultimo + timedelta(days=dias)
    hoy = datetime.now()
    dias_restantes = (proxima - hoy).days
    if dias_restantes < 0:
        estado = f"⚠️ VENCIDA hace {abs(dias_restantes)} días"
    elif dias_restantes == 0:
        estado = "⚠️ VENCE HOY"
    elif dias_restantes <= 3:
        estado = f"⚠️ Vence en {dias_restantes} días (URGENTE)"
    else:
        estado = f"✓ Vence en {dias_restantes} días"
    return (
        f"Último mantenimiento: {ultimo.strftime('%d/%m/%Y')}\n"
        f"Frecuencia: {frecuencia_upper} (cada {dias} días)\n"
        f"Próxima revisión: {proxima.strftime('%d/%m/%Y')}\n"
        f"Estado: {estado}"
    )


# ============================================================
# HELPERS — detectar fecha en mensaje
# ============================================================

FRECUENCIAS_KEYWORDS = {
    "diaria": "DIARIA", "diario": "DIARIA",
    "dos días": "CADA_DOS_DIAS", "2 días": "CADA_DOS_DIAS",
    "cuatro días": "CADA_CUATRO_DIAS", "4 días": "CADA_CUATRO_DIAS",
    "semanal": "SEMANAL", "semana": "SEMANAL",
    "quincenal": "QUINCENAL", "quincena": "QUINCENAL",
    "mensual": "MENSUAL", "mes": "MENSUAL",
    "bimestral": "BIMESTRAL",
    "trimestral": "TRIMESTRAL",
    "semestral": "SEMESTRAL",
    "anual": "ANUAL", "año": "ANUAL",
    "bianual": "BIANUAL",
}

def detectar_fecha_y_frecuencia(mensaje: str):
    fecha_match = re.search(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b", mensaje)
    if not fecha_match:
        return None, None
    fecha = f"{fecha_match.group(1).zfill(2)}/{fecha_match.group(2).zfill(2)}/{fecha_match.group(3)}"
    mensaje_lower = mensaje.lower()
    for keyword, frecuencia in FRECUENCIAS_KEYWORDS.items():
        if keyword in mensaje_lower:
            return fecha, frecuencia
    return fecha, None


# ============================================================
# NODO LLM
# ============================================================

def nodo_llm(estado: EstadoAgente) -> dict:
    vessel_id = estado.get("vessel_id", 1)

    ultimo_mensaje = next(
        (m.content for m in reversed(estado["messages"]) if isinstance(m, HumanMessage)),
        ""
    )

    # Tool 1: buscar_mantenimiento — siempre se ejecuta
    retriever = get_or_create_retriever(vessel_id)
    if retriever:
        docs = retriever.invoke(ultimo_mensaje)
        contexto = ""
        for i, doc in enumerate(docs, 1):
            fuente = Path(doc.metadata.get("source", "")).name
            contexto += f"\n[Fuente {i}: {fuente}]\n{doc.page_content}\n"
    else:
        contexto = "No hay documentos de mantenimiento indexados para este barco."

    # Tool 2: obtener_fecha_actual — siempre se ejecuta
    fecha_info = obtener_fecha_actual.invoke({})

    # Tool 3: calcular_proxima_revision — solo si hay fecha en el mensaje
    calculo_revision = ""
    fecha_detectada, frecuencia_detectada = detectar_fecha_y_frecuencia(ultimo_mensaje)
    if fecha_detectada and frecuencia_detectada:
        calculo_revision = calcular_proxima_revision.invoke({
            "fecha_ultimo_mantenimiento": fecha_detectada,
            "frecuencia": frecuencia_detectada
        })

    system_content = f"""Eres NavalMaint AI, un asistente experto en mantenimiento naval.
Tienes acceso al plan de mantenimiento de esta embarcación.

INFORMACIÓN DE FECHA:
{fecha_info}

IMPORTANTE:
- Responde ÚNICAMENTE basándote en el contexto proporcionado.
- Cuando uses información de una fuente, cítala indicando: (Fuente: nombre_archivo).
- Si el contexto contiene la información, úsala directamente y cita los datos concretos.
- Si no encuentras la información en el contexto, di exactamente: "No encuentro esa información en el plan de mantenimiento."
- No inventes datos. Responde en español de forma técnica y precisa.

CONTEXTO DEL PLAN DE MANTENIMIENTO:
{contexto}"""

    if calculo_revision:
        system_content += f"\n\nCÁLCULO DE PRÓXIMA REVISIÓN:\n{calculo_revision}"

    system = SystemMessage(content=system_content)
    respuesta = llm.invoke([system] + list(estado["messages"]))
    return {"messages": [respuesta]}


# ============================================================
# GRAFO
# ============================================================

grafo = StateGraph(EstadoAgente)
grafo.add_node("llm", nodo_llm)
grafo.set_entry_point("llm")
grafo.add_edge("llm", END)

checkpointer = MemorySaver()
agente = grafo.compile(checkpointer=checkpointer)


# ============================================================
# HISTORIAL
# ============================================================

def get_historial(session_id: str) -> list:
    try:
        config = {"configurable": {"thread_id": session_id}}
        state = agente.get_state(config)
        if not state or not state.values:
            return []
        mensajes = state.values.get("messages", [])
        historial = []
        for m in mensajes:
            if isinstance(m, HumanMessage):
                historial.append({"role": "user", "content": m.content})
            elif isinstance(m, AIMessage):
                historial.append({"role": "ai", "content": m.content})
        return historial
    except Exception:
        return []