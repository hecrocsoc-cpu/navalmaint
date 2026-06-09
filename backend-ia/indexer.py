from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path

embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

def indexar_barco(vessel_id: int):
    docs_path = Path(__file__).parent / "docs" / f"vessel_{vessel_id}"
    chroma_path = f"./chroma_db/vessel_{vessel_id}"

    if not docs_path.exists():
        print(f"No existe la carpeta {docs_path}")
        return

    # Leer todos los .txt
    documentos = []
    for txt in sorted(docs_path.glob("*.txt")):
        print(f"Leyendo {txt.name}...")
        loader = TextLoader(str(txt), encoding="utf-8")
        documentos.extend(loader.load())

    # Trocear en chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_documents(documentos)

    # Eliminar duplicados
    vistos = set()
    chunks_unicos = []
    for c in chunks:
        if c.page_content not in vistos:
            vistos.add(c.page_content)
            chunks_unicos.append(c)

    print(f"Chunks únicos: {len(chunks_unicos)}")

    # Indexar en ChromaDB
    Chroma.from_documents(
        chunks_unicos,
        embeddings,
        persist_directory=chroma_path
    )

    print(f"✅ vessel_{vessel_id} indexado en {chroma_path}")

if __name__ == "__main__":
    import sys
    vessel_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    indexar_barco(vessel_id)