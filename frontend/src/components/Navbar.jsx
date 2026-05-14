import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">⚓ NavalMaint</div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/equipment">Equipos</Link>
        <Link to="/maintenance">Mantenimiento</Link>
        <Link to="/stock">Stock</Link>
        <Link to="/history">Historial</Link>
        <Link to="/vessels">Barcos</Link>
        <Link to="/vessels/new">+ Nuevo</Link>
      </div>
      <div className="navbar-user">
        <span>{usuario?.nombre}</span>
        <span className="badge">{usuario?.role}</span>
        <button onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  );
}
