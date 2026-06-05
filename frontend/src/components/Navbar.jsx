import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const esAdmin = usuario?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <nav className={`navbar${menuAbierto ? " navbar-menu-open" : ""}`}>
      <div className="navbar-brand">NavalMaint</div>

      <div className="navbar-links">
        <Link to="/dashboard" onClick={cerrarMenu}>Dashboard</Link>
        <Link to="/equipment" onClick={cerrarMenu}>Equipos</Link>
        <Link to="/maintenance" onClick={cerrarMenu}>Mantenimiento</Link>
        <Link to="/stock" onClick={cerrarMenu}>Stock</Link>
        <Link to="/history" onClick={cerrarMenu}>Historial</Link>
        <Link to="/chat" onClick={cerrarMenu}>Chat IA</Link>
        {esAdmin && <Link to="/vessels" onClick={cerrarMenu}>Buques</Link>}
        {esAdmin && <Link to="/vessels/new" onClick={cerrarMenu}>+ Buque</Link>}
        {esAdmin && <Link to="/users" onClick={cerrarMenu}>Usuarios</Link>}

        <div className="navbar-menu-user">
          <span>{usuario?.nombre}</span>
          <span className="badge">{usuario?.role}</span>
          <button onClick={() => { handleLogout(); cerrarMenu(); }}>Salir</button>
        </div>
      </div>

      <div className="navbar-user">
        <span>{usuario?.nombre}</span>
        <span className="badge">{usuario?.role}</span>
        <button onClick={handleLogout}>Salir</button>
      </div>

      <button
        className="navbar-hamburger"
        onClick={() => setMenuAbierto((v) => !v)}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}