import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";

const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000";

export default function Chat() {
  const { usuario, token } = useAuth();
  const { peticion } = useApi();
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [buques, setBuques] = useState([]);
  const [vesselIdSeleccionado, setVesselIdSeleccionado] = useState(null);
  const bottomRef = useRef(null);

  const esAdmin = usuario?.role === "ADMIN";

  useEffect(() => {
    if (esAdmin) {
      peticion("/vessels").then((data) => {
        setBuques(data);
        if (data.length > 0) setVesselIdSeleccionado(data[0].id);
      });
    } else {
      setVesselIdSeleccionado(usuario?.vesselId);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const vesselIdFinal = esAdmin ? vesselIdSeleccionado : usuario?.vesselId;

  const enviar = async () => {
    if (!mensaje.trim() || cargando || !vesselIdFinal) return;

    const pregunta = mensaje.trim();
    setMensaje("");
    setMensajes((prev) => [...prev, { role: "user", content: pregunta }]);
    setCargando(true);
    setMensajes((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const res = await fetch(`${AI_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: pregunta,
          session_id: sessionId,
          vessel_id: vesselIdFinal,
        }),
      });

      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            const contenido = data.replace(/\\n/g, "\n");
            setMensajes((prev) => {
              const nuevos = [...prev];
              nuevos[nuevos.length - 1] = {
                role: "ai",
                content: nuevos[nuevos.length - 1].content + contenido,
              };
              return nuevos;
            });
          }
        }
      }
    } catch (err) {
      setMensajes((prev) => {
        const nuevos = [...prev];
        nuevos[nuevos.length - 1] = {
          role: "ai",
          content: "Error al conectar con el asistente. Inténtalo de nuevo.",
        };
        return nuevos;
      });
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="page-container">
      <h1>Asistente Naval IA</h1>
      <p className="chat-subtitulo">
        Consulta el plan de mantenimiento de tu embarcación
      </p>

      {esAdmin && buques.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "0.5rem" }}>Buque:</label>
          <select
            value={vesselIdSeleccionado || ""}
            onChange={(e) => {
              setVesselIdSeleccionado(Number(e.target.value));
              setMensajes([]);
            }}
          >
            {buques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="chat-contenedor">
        <div className="chat-mensajes">
          {mensajes.length === 0 && (
            <div className="chat-vacio">
              <p>¿En qué puedo ayudarte con el mantenimiento?</p>
              <p>Ejemplo: "¿Qué mantenimiento diario hay que hacer en los motores principales?"</p>
            </div>
          )}
          {mensajes.map((msg, i) => (
            <div key={i} className={`chat-mensaje chat-mensaje-${msg.role}`}>
              <span className="chat-rol">{msg.role === "user" ? "Tú" : "NavalMaint AI"}</span>
              <p>{msg.content}</p>
            </div>
          ))}
          {cargando && mensajes[mensajes.length - 1]?.content === "" && (
            <div className="chat-typing">Escribiendo...</div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta..."
            rows={2}
            disabled={cargando}
          />
          <button onClick={enviar} disabled={cargando || !mensaje.trim()}>
            {cargando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}