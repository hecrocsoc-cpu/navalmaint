from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, Annotated, Sequence
import operator
import os
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

    # Si ya existe el ChromaDB cargarlo, si no crearlo
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
def nodo_llm(estado: EstadoAgente) -> dict:
    vessel_id = estado.get("vessel_id", 1)
    retriever = get_or_create_retriever(vessel_id)

    ultimo_mensaje = next(
        (m.content for m in reversed(estado["messages"]) if isinstance(m, HumanMessage)),
        ""
    )

    if retriever is None:
        contexto = "No hay documentos de mantenimiento indexados para este barco."
    else:
        docs = retriever.invoke(ultimo_mensaje)
        contexto = "\n\n".join(d.page_content for d in docs)

    system = SystemMessage(content=f"""Eres NavalMaint AI, un asistente experto en mantenimiento naval.
Tienes acceso al plan de mantenimiento de esta embarcación.
IMPORTANTE: Responde ÚNICAMENTE basándote en el contexto proporcionado.
Si el contexto contiene la información, úsala directamente y cita los datos concretos.
Si no encuentras la información en el contexto, di exactamente: "No encuentro esa información en el plan de mantenimiento."
No inventes datos. Responde en español de forma técnica y precisa.

CONTEXTO DEL PLAN DE MANTENIMIENTO:
{contexto}""")

    respuesta = llm.invoke([system] + list(estado["messages"]))
    return {"messages": [respuesta]}

grafo = StateGraph(EstadoAgente)
grafo.add_node("llm", nodo_llm)
grafo.set_entry_point("llm")
grafo.add_edge("llm", END)

checkpointer = MemorySaver()
agente = grafo.compile(checkpointer=checkpointer)