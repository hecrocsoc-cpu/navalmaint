import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Maintenance from "./pages/Maintenance";
import Stock from "./pages/Stock";
import History from "./pages/History";
import NewVessel from "./pages/NewVessel";
import Vessels from "./pages/Vessels";

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
        path="/stock"
        element={
          <RutaProtegida>
            <Stock />
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
      <Route
        path="/history"
        element={
          <RutaProtegida>
            <History />
          </RutaProtegida>
        }
      />
      <Route
        path="/vessels/new"
        element={
          <RutaProtegida>
            <NewVessel />
          </RutaProtegida>
        }
      />
      <Route
        path="/vessels"
        element={
          <RutaProtegida>
            <Vessels />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
