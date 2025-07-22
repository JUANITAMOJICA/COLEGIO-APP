// src/App.js

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Admin from "./pages/Admin";
import GestionUsuarios from "./pages/GestionUsuarios";
import ReportePagos from "./pages/ReportePagos";
import PorAlumno from "./pages/PorAlumno";
import PorGrado from "./pages/PorGrado";
import PorCategoria from "./pages/PorCategoria";
import General from "./pages/General";
import Configuracion from "./pages/Configuracion";
import Promotor from "./pages/Promotor";
import Docente from "./pages/Docente";
import Padre from "./pages/Padre";
import GestionPagos from "./pages/GestionPagos";
import InventarioUniformes from "./pages/InventarioUniformes";
import PersonalEducativo from "./pages/PersonalEducativo"; // 👈 NUEVO
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import 'bootstrap/dist/css/bootstrap.min.css';

// Función para manejar redirección por rol
const getRedirectPath = (role) => {
  const redirectPaths = {
    Administrador: "/admin",
    Promotor: "/promotor",
    Docente: "/docente",
    Padre: "/padre",
  };
  return redirectPaths[role] || "/";
};

function App() {
  const { user, role } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="Administrador">
            <Admin />
          </ProtectedRoute>
        }
      >
        <Route path="gestion-usuarios" element={<GestionUsuarios />} />
        <Route path="reporte-pagos" element={<ReportePagos />} />
        <Route path="reporte-pagos/por-alumno" element={<PorAlumno />} />
        <Route path="reporte-pagos/por-grado" element={<PorGrado />} />
        <Route path="reporte-pagos/por-categoria" element={<PorCategoria />} />
        <Route path="reporte-pagos/general" element={<General />} />
        <Route path="inventario-uniformes" element={<InventarioUniformes />} />
        <Route path="personal-educativo" element={<PersonalEducativo />} /> {/* ✅ NUEVO */}
        <Route path="configuracion" element={<Configuracion />} />
      </Route>

      {/* Promotor */}
      <Route
        path="/promotor"
        element={
          <ProtectedRoute role="Promotor">
            <Promotor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gestion-pagos/:alumnoId"
        element={
          <ProtectedRoute role="Promotor">
            <GestionPagos />
          </ProtectedRoute>
        }
      />

      {/* Docente */}
      <Route
        path="/docente"
        element={
          <ProtectedRoute role="Docente">
            <Docente />
          </ProtectedRoute>
        }
      />

      {/* Padre */}
      <Route
        path="/padre"
        element={
          <ProtectedRoute role="Padre">
            <Padre />
          </ProtectedRoute>
        }
      />

      {/* Redirección por rol o login */}
      <Route
        path="/"
        element={
          !user ? <Navigate to="/login" /> : <Navigate to={getRedirectPath(role)} />
        }
      />

      {/* Página no encontrada */}
      <Route path="*" element={<h1>Página no encontrada</h1>} />
    </Routes>
  );
}

export default App;
 