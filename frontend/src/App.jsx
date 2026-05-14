import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Maintenance from "./pages/Maintenance";

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) return <div>Cargando...</div>;
  if (!usuario) return <Navigate to="/login" />;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route
        path="/equipment"
        element={
          <RutaProtegida>
            <Equipment />
          </RutaProtegida>
        }
      />
      <Route
        path="/maintenance"
        element={
          <RutaProtegida>
            <Maintenance />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
