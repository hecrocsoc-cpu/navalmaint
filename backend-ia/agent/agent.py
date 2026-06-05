from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator
import os
from pathlib import Path

# Estado del agente
class EstadoAgente(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

# Inicializar LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile",
    temperature=0
)

# Cargar e indexar documentos
def cargar_documentos():
    docs_path = Path(__file__).parent.parent / "docs" / "vessel_1"
    documentos = []
    for txt in docs_path.glob("*.txt"):
        loader = TextLoader(str(txt), encoding="utf-8")
        documentos.extend(loader.load())
    return documentos

def crear_vectorstore():
    documentos = cargar_documentos()
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
    print(f"Chunks únicos indexados: {len(chunks_unicos)}")
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma.from_documents(
        chunks_unicos,
        embeddings,
        persist_directory="./chroma_db"
    )
    return vectorstore

# Crear o cargar vectorstore
vectorstore = crear_vectorstore()
retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

# Nodo principal del agente
def nodo_llm(estado: EstadoAgente) -> dict:
    ultimo_mensaje = next(
        (m.content for m in reversed(estado["messages"]) if isinstance(m, HumanMessage)),
        ""
    )
    docs = retriever.invoke(ultimo_mensaje)
    contexto = "\n\n".join(d.page_content for d in docs)

    system = SystemMessage(content=f"""Eres NavalMaint AI, un asistente experto en mantenimiento naval.
Tienes acceso al plan de mantenimiento REAL del Guardamar Talía, una patrullera de Salvamento Marítimo.
IMPORTANTE: Responde ÚNICAMENTE basándote en el contexto proporcionado.
Si el contexto contiene la información, úsala directamente y cita los datos concretos.
Si no encuentras la información en el contexto, di exactamente: "No encuentro esa información en el plan de mantenimiento del Talía."
No inventes datos. No uses conocimiento general si tienes datos específicos del Talía.
Responde en español de forma técnica y precisa.

CONTEXTO DEL PLAN DE MANTENIMIENTO:
{contexto}""")

    respuesta = llm.invoke([system] + list(estado["messages"]))
    return {"messages": [respuesta]}
# Construir grafo
grafo = StateGraph(EstadoAgente)
grafo.add_node("llm", nodo_llm)
grafo.set_entry_point("llm")
grafo.add_edge("llm", END)

checkpointer = MemorySaver()
agente = grafo.compile(checkpointer=checkpointer)