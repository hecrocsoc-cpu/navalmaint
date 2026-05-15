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
  const [codigosAbiertos, setCodigosAbiertos] = useState({});

  // Estado para el formulario de nueva tarea
  const [formTareaBarco, setFormTareaBarco] = useState(null);
  const [equiposBarco, setEquiposBarco] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState({
    codigo: "",
    descripcion: "",
    frecuencia: "DIARIA",
    accion: "",
    equipmentId: "",
  });
  const [guardandoTarea, setGuardandoTarea] = useState(false);
  const [mensajeTarea, setMensajeTarea] = useState("");

  const FRECUENCIAS = [
    "DIARIA", "CADA_DOS_DIAS", "CADA_CUATRO_DIAS", "SEMANAL",
    "QUINCENAL", "MENSUAL", "BIMESTRAL", "TRIMESTRAL",
    "SEMESTRAL", "ANUAL", "BIANUAL",
  ];

  const ACCIONES = [
    "CN", "CE", "CNR", "CM", "LP", "AM", "PR",
    "CP", "CT", "EN", "VM", "CPS", "OV",
  ];

  const cargarDatos = async () => {
    try {
      const [vessels, tareas] = await Promise.all([
        peticion("/vessels"),
        peticion("/tasks"),
      ]);

      const vesselsFiltrados =
        usuario?.role === "MECANICO"
          ? vessels.filter((v) => v.id === usuario.vesselId)
          : vessels;

      const barcosConTareas = vesselsFiltrados.map((barco) => ({
        ...barco,
        tareas: tareas
          .filter((t) => t.equipment?.vesselId === barco.id)
          .sort((a, b) => {
            const orden = [
              "DIARIA", "CADA_DOS_DIAS", "CADA_CUATRO_DIAS", "SEMANAL",
              "QUINCENAL", "MENSUAL", "BIMESTRAL", "TRIMESTRAL",
              "SEMESTRAL", "ANUAL", "BIANUAL",
            ];
            const diff = orden.indexOf(a.frecuencia) - orden.indexOf(b.frecuencia);
            if (diff !== 0) return diff;
            return (a.equipment?.nombre || "").localeCompare(b.equipment?.nombre || "");
          }),
      }));
      setBarcos(barcosConTareas);
    } catch (err) {
      setError("Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
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

  const abrirFormTarea = async (barcoId) => {
    if (formTareaBarco === barcoId) {
      setFormTareaBarco(null);
      return;
    }
    try {
      const equipos = await peticion(`/equipment/vessel/${barcoId}`);
      setEquiposBarco(equipos);
      setNuevaTarea({ codigo: "", descripcion: "", frecuencia: "DIARIA", accion: "CN", equipmentId: equipos[0]?.id || "" });
      setFormTareaBarco(barcoId);
      setMensajeTarea("");
    } catch (err) {
      setErrorMsg("Error al cargar equipos");
    }
  };

  const handleCrearTarea = async (e) => {
    e.preventDefault();
    setGuardandoTarea(true);
    setMensajeTarea("");
    try {
      await peticion("/tasks", {
        method: "post",
        data: {
          ...nuevaTarea,
          equipmentId: parseInt(nuevaTarea.equipmentId),
        },
      });
      setMensajeTarea("✓ Tarea creada correctamente");
      setNuevaTarea({ codigo: "", descripcion: "", frecuencia: "DIARIA", accion: "CN", equipmentId: equiposBarco[0]?.id || "" });
      setFormTareaBarco(null);
      await cargarDatos();
    } catch (err) {
      setMensajeTarea("Error al crear la tarea");
    } finally {
      setGuardandoTarea(false);
    }
  };

  if (loading) return <div className="loading">Cargando tareas...</div>;
  if (error) return <div className="error">{error}</div>;

  const totalTareas = barcos.reduce((acc, b) => acc + b.tareas.length, 0);

  const CODIGOS = [
    { codigo: "CN", descripcion: "Comprobar nivel" },
    { codigo: "CE", descripcion: "Comprobar estado" },
    { codigo: "CNR", descripcion: "Comprobar niveles de residuos" },
    { codigo: "CM", descripcion: "Cambiar o sustituir elemento" },
    { codigo: "LP", descripcion: "Limpieza" },
    { codigo: "AM", descripcion: "Acción manual" },
    { codigo: "PR", descripcion: "Purga" },
    { codigo: "CP", descripcion: "Comprobar presión" },
    { codigo: "CT", descripcion: "Comprobar temperaturas" },
    { codigo: "EN", descripcion: "Engrase o lubricación" },
    { codigo: "VM", descripcion: "Operar motor 50-70% carga 30 min" },
    { codigo: "CPS", descripcion: "Comprobar posición" },
    { codigo: "OV", descripcion: "Overhaul" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Plan de Mantenimiento</h1>
        <span className="badge">{totalTareas} tareas</span>
      </div>

      {mensajeOk && <div className="success-msg">{mensajeOk}</div>}
      {errorMsg && <div className="error-msg">{errorMsg}</div>}
      {mensajeTarea && <div className="success-msg">{mensajeTarea}</div>}

      {barcos.map((barco) => (
        <div key={barco.id} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: colapsados[barco.id] ? 0 : 16,
              borderBottom: "1px solid #2d3f6b",
              paddingBottom: 10,
            }}
          >
            <span
              onClick={() => toggleColapsar(barco.id)}
              style={{ color: "#4a9eff", fontSize: "1rem", cursor: "pointer" }}
            >
              {colapsados[barco.id] ? "▶" : "▼"}
            </span>
            <h2
              onClick={() => toggleColapsar(barco.id)}
              style={{ color: "#4a9eff", fontSize: "1.1rem", cursor: "pointer" }}
            >
              {barco.nombre}
            </h2>
            <span className="badge">{barco.tareas.length} tareas</span>
            <span className="eq-sistema">{barco.matricula}</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={() =>
                  setCodigosAbiertos((prev) => ({
                    ...prev,
                    [barco.id]: !prev[barco.id],
                  }))
                }
                style={{
                  padding: "4px 10px",
                  background: "transparent",
                  border: "1px solid #2d3f6b",
                  borderRadius: 6,
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                📖 Códigos
              </button>
              {usuario?.role === "ADMIN" && (
                <button
                  onClick={() => abrirFormTarea(barco.id)}
                  style={{
                    padding: "4px 10px",
                    background: formTareaBarco === barco.id ? "transparent" : "#1e3a5f",
                    border: "1px solid #2d3f6b",
                    borderRadius: 6,
                    color: "#4a9eff",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  {formTareaBarco === barco.id ? "✕ Cancelar" : "+ Nueva tarea"}
                </button>
              )}
            </div>
          </div>

          {/* FORMULARIO NUEVA TAREA — solo ADMIN */}
          {formTareaBarco === barco.id && (
            <div style={{
              background: "#0f1e36",
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 16,
              border: "1px solid #2d3f6b",
            }}>
              <h3 style={{ color: "#4a9eff", fontSize: "0.95rem", marginBottom: 12 }}>
                Nueva tarea — {barco.nombre}
              </h3>
              <form onSubmit={handleCrearTarea} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem" }}>Equipo</label>
                  <select
                    value={nuevaTarea.equipmentId}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, equipmentId: e.target.value })}
                    required
                    style={{ padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                  >
                    {equiposBarco.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.codigo} — {eq.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem" }}>Código tarea</label>
                  <input
                    type="text"
                    placeholder="Ej: MP01SL0M/CN"
                    value={nuevaTarea.codigo}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, codigo: e.target.value })}
                    required
                    style={{ width: 160, padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: "0.8rem" }}>Descripción</label>
                  <input
                    type="text"
                    placeholder="Descripción de la tarea"
                    value={nuevaTarea.descripcion}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem" }}>Frecuencia</label>
                  <select
                    value={nuevaTarea.frecuencia}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, frecuencia: e.target.value })}
                    style={{ padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                  >
                    {FRECUENCIAS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem" }}>Acción</label>
                  <select
                    value={nuevaTarea.accion}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, accion: e.target.value })}
                    style={{ padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                  >
                    {ACCIONES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={guardandoTarea}
                  style={{ padding: "8px 20px", background: "#4a9eff", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: "0.9rem" }}
                >
                  {guardandoTarea ? "Guardando..." : "Crear tarea"}
                </button>
              </form>
            </div>
          )}

          {codigosAbiertos[barco.id] && (
            <div style={{ marginBottom: 16, background: "#0f1e36", borderRadius: 8, padding: "12px 16px" }}>
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {CODIGOS.map((c) => (
                    <tr key={c.codigo}>
                      <td><span className="eq-codigo">{c.codigo}</span></td>
                      <td>{c.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!colapsados[barco.id] &&
            (barco.tareas.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Sin tareas registradas</p>
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
                        <td><span className="eq-codigo">{t.codigo}</span></td>
                        <td>{t.equipment?.nombre}</td>
                        <td>{t.descripcion}</td>
                        <td><span className="badge">{t.frecuencia}</span></td>
                        <td>{t.accion}</td>
                        <td>
                          <button
                            onClick={() => {
                              setFormulario(formulario === t.id ? null : t.id);
                              setLogData({ estado: "OK", horasMotor: "", observaciones: "" });
                              setMensajeOk("");
                              setErrorMsg("");
                            }}
                            style={{
                              padding: "4px 12px",
                              background: formulario === t.id ? "transparent" : "#1e3a5f",
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
                          <td colSpan={6} style={{ background: "#0f1e36", padding: "16px 20px" }}>
                            <form
                              onSubmit={handleRegistrar}
                              style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}
                            >
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: "0.8rem" }}>Estado</label>
                                <select
                                  value={logData.estado}
                                  onChange={(e) => setLogData({ ...logData, estado: e.target.value })}
                                  style={{ padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                                >
                                  <option value="OK">✓ OK</option>
                                  <option value="PENDIENTE">⏳ Pendiente</option>
                                  <option value="INCIDENCIA">⚠️ Incidencia</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: "0.8rem" }}>Horas motor</label>
                                <input
                                  type="number"
                                  placeholder="Ej: 4250"
                                  value={logData.horasMotor}
                                  onChange={(e) => setLogData({ ...logData, horasMotor: e.target.value })}
                                  style={{ width: 120, padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                                />
                              </div>
                              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                                <label style={{ fontSize: "0.8rem" }}>Observaciones</label>
                                <input
                                  type="text"
                                  placeholder="Opcional"
                                  value={logData.observaciones}
                                  onChange={(e) => setLogData({ ...logData, observaciones: e.target.value })}
                                  style={{ width: "100%", padding: "8px 12px", background: "#0a1628", border: "1px solid #2d3f6b", borderRadius: 8, color: "#e2e8f0", fontSize: "0.9rem" }}
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={cargando}
                                style={{ padding: "8px 20px", background: "#4a9eff", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: "0.9rem" }}
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