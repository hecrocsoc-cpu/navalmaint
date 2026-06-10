import os
import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NavalMaint AI Agent")

ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET")
security = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

class ChatInput(BaseModel):
    message: str
    session_id: str
    vessel_id: int

from agent.agent import agente, get_historial

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "NavalMaint AI"}

@app.post("/api/chat")
async def chat(body: ChatInput, user=Depends(get_current_user)):
    resultado = agente.invoke(
        {"messages": [HumanMessage(content=body.message)], "vessel_id": body.vessel_id},
        config={"configurable": {"thread_id": body.session_id}},
    )
    return {"response": resultado["messages"][-1].content, "session_id": body.session_id}

@app.post("/api/chat/stream")
async def chat_stream(body: ChatInput, user=Depends(get_current_user)):
    async def generar():
        try:
            async for chunk in agente.astream(
                {"messages": [HumanMessage(content=body.message)], "vessel_id": body.vessel_id},
                config={"configurable": {"thread_id": body.session_id}},
            ):
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

@app.get("/api/chat/history/{session_id}")
async def chat_history(session_id: str, user=Depends(get_current_user)):
    historial = get_historial(session_id)
    return {"session_id": session_id, "messages": historial}