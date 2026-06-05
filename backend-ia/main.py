import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NavalMaint AI Agent")

# CORS
ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
DEMO_TOKEN = os.getenv("DEMO_TOKEN", "demo-token-12345")
security = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if creds.credentials != DEMO_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"user": "demo"}

# Modelos
class ChatInput(BaseModel):
    message: str
    session_id: str

# Importar agente (se inicializa al arrancar)
from agent.agent import agente

# Rutas
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "NavalMaint AI"}

@app.post("/api/chat")
async def chat(body: ChatInput, user=Depends(get_current_user)):
    resultado = agente.invoke(
        {"messages": [HumanMessage(content=body.message)]},
        config={"configurable": {"thread_id": body.session_id}},
    )
    return {"response": resultado["messages"][-1].content}

@app.post("/api/chat/stream")
async def chat_stream(body: ChatInput, user=Depends(get_current_user)):
    async def generar():
        try:
            async for chunk in agente.astream(
                {"messages": [HumanMessage(content=body.message)]},
                config={"configurable": {"thread_id": body.session_id}},
            ):
                print("CHUNK:", chunk)
                if "llm" in chunk:
                    msg = chunk["llm"]["messages"][-1]
                    if hasattr(msg, "content") and msg.content:
                        safe = msg.content.replace("\n", "\\n")
                        yield f"data: {safe}\n\n"
        except Exception as e:
            print("ERROR:", e)
            yield f"data: Error: {str(e)}\\n\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generar(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )