import React, { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";

export default function Maintenance() {
  const { peticion, cargando } = useApi();
  const { usuario } = useAuth();
  const [barcos, setBarcos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [colapsados, setColapsados] = useState({});
  const [formulario, setFormulario] = useState(null);
  const [logData, setLogData] = useState({
    estado: "OK",
    horasMotor: "",
    observaciones: "",
  });
  const [mensajeOk, setMensajeOk] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const [vessels, tareas] = await Promise.all([
          peticion("/vessels"),
          peticion("/tasks"),
        ]);

        const vesselsFiltrados = usuario?.role === "MECANICO"
          ? vessels.filter(v => v.id === usuario.vesselId)
          : vessels;

        const barcosConTareas = vesselsFiltrados.map((barco) => ({
          ...barco,
          tareas: tareas.filter((t) => t.equipment?.vesselId === barco.id),
        }));
        setBarcos(barcosConTareas);
      } catch (err) {
        setError("Error al cargar tareas");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const toggleColapsar = (id) => {
    setColapsados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setMensajeOk("");
    try {
      await peticion("/logs", {
        method: "post",
        data: {
          taskId: formulario,
          estado: logData.estado,
          horasMotor: logData.horasMotor || null,
          observaciones: logData.observaciones || null,
        },
      });
      setMensajeOk(
        logData.estado === "INCIDENCIA"
          ? "⚠️ Incidencia registrada — se ha enviado email al administrador"
          : "✓ Registro guardado correctamente",
      );
      setFormulario(null);
      setLogData({ estado: "OK", horasMotor: "", observaciones: "" });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (loading) return <div className="loading">Cargando tareas...</div>;
  if (error) return <div className="error">{error}</div>;

  const totalTareas = barcos.reduce((acc, b) => acc + b.tareas.length, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Plan de Mantenimiento</h1>
        <span className="badge">{totalTareas} tareas</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
      {errorMsg && <div className="error-msg">{errorMsg}</div>}

      {barcos.map((barco) => (
        <div key={barco.id} style={{ marginBottom: 24 }}>
          <div
            onClick={() => toggleColapsar(barco.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: colapsados[barco.id] ? 0 : 16,
              borderBottom: "1px solid #2d3f6b",
              paddingBottom: 10,
              cursor: "pointer",
            }}
          >
            <span style={{ color: "#4a9eff", fontSize: "1rem" }}>
              {colapsados[barco.id] ? "▶" : "▼"}
            </span>
            <h2 style={{ color: "#4a9eff", fontSize: "1.1rem" }}>
              {barco.nombre}
            </h2>
            <span className="badge">{barco.tareas.length} tareas</span>
            <span className="eq-sistema">{barco.matricula}</span>
          </div>

          {!colapsados[barco.id] &&
            (barco.tareas.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                Sin tareas registradas
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Equipo</th>
                    <th>Descripción</th>
                    <th>Frecuencia</th>
                    <th>Acción</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {barco.tareas.map((t) => (
                    <React.Fragment key={t.id}>
                      <tr>
                        <td>
                          <span className="eq-codigo">{t.codigo}</span>
                        </td>
                        <td>{t.equipment?.nombre}</td>
                        <td>{t.descripcion}</td>
                        <td>
                          <span className="badge">{t.frecuencia}</span>
                        </td>
                        <td>{t.accion}</td>
                        <td>
                          <button
                            onClick={() => {
                              setFormulario(formulario === t.id ? null : t.id);
                              setLogData({
                                estado: "OK",
                                horasMotor: "",
                                observaciones: "",
                              });
                              setMensajeOk("");
                              setErrorMsg("");
                            }}
                            style={{
                              padding: "4px 12px",
                              background:
                                formulario === t.id ? "transparent" : "#1e3a5f",
                              border: "1px solid #2d3f6b",
                              borderRadius: 6,
                              color: "#94a3b8",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                          >
                            {formulario === t.id ? "Cancelar" : "Registrar"}
                          </button>
                        </td>
                      </tr>
                      {formulario === t.id && (
                        <tr key={`form-${t.id}`}>
                          <td
                            colSpan={6}
                            style={{
                              background: "#0f1e36",
                              padding: "16px 20px",
                            }}
                          >
                            <form
                              onSubmit={handleRegistrar}
                              style={{
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-end",
                                flexWrap: "wrap",
                              }}
                            >
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: "0.8rem" }}>
                                  Estado
                                </label>
                                <select
                                  value={logData.estado}
                                  onChange={(e) =>
                                    setLogData({
                                      ...logData,
                                      estado: e.target.value,
                                    })
                                  }
                                  style={{
                                    padding: "8px 12px",
                                    background: "#0a1628",
                                    border: "1px solid #2d3f6b",
                                    borderRadius: 8,
                                    color: "#e2e8f0",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <option value="OK">✓ OK</option>
                                  <option value="PENDIENTE">⏳ Pendiente</option>
                                  <option value="INCIDENCIA">⚠️ Incidencia</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: "0.8rem" }}>
                                  Horas motor
                                </label>
                                <input
                                  type="number"
                                  placeholder="Ej: 4250"
                                  value={logData.horasMotor}
                                  onChange={(e) =>
                                    setLogData({
                                      ...logData,
                                      horasMotor: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: 120,
                                    padding: "8px 12px",
                                    background: "#0a1628",
                                    border: "1px solid #2d3f6b",
                                    borderRadius: 8,
                                    color: "#e2e8f0",
                                    fontSize: "0.9rem",
                                  }}
                                />
                              </div>
                              <div
                                className="form-group"
                                style={{ margin: 0, flex: 1, minWidth: 200 }}
                              >
                                <label style={{ fontSize: "0.8rem" }}>
                                  Observaciones
                                </label>
                                <input
                                  type="text"
                                  placeholder="Opcional"
                                  value={logData.observaciones}
                                  onChange={(e) =>
                                    setLogData({
                                      ...logData,
                                      observaciones: e.target.value,
                                    })
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    background: "#0a1628",
                                    border: "1px solid #2d3f6b",
                                    borderRadius: 8,
                                    color: "#e2e8f0",
                                    fontSize: "0.9rem",
                                  }}
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={cargando}
                                style={{
                                  padding: "8px 20px",
                                  background: "#4a9eff",
                                  border: "none",
                                  borderRadius: 8,
                                  color: "white",
                                  cursor: "pointer",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {cargando ? "Guardando..." : "Guardar"}
                              </button>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ))}
        </div>
      ))}
    </div>
  );
}