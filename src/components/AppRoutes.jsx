// AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Admin from "./pages/Admin";
import GestionUsuarios from "./pages/GestionUsuarios";
import ReportePagos from "./pages/ReportePagos";
import PorAlumno from "./pages/PorAlumno";
import PorGrado from "./pages/PorGrado";
import PorCategoria from "./pages/PorCategoria";
import General from "./pages/General";
import Configuracion from "./pages/Configuracion";
import PersonalEducativo from "./pages/PersonalEducativo"; // ✅ NUEVA IMPORTACIÓN
import Login from "./pages/Login";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<Admin />}>
        <Route path="gestion-usuarios" element={<GestionUsuarios />} />

        <Route path="reporte-pagos" element={<ReportePagos />}>
          <Route index element={<Navigate to="por-alumno" replace />} />
          <Route path="por-alumno" element={<PorAlumno />} />
          <Route path="por-grado" element={<PorGrado />} />
          <Route path="por-categoria" element={<PorCategoria />} />
          <Route path="general" element={<General />} />
        </Route>

        <Route path="personal-educativo" element={<PersonalEducativo />} /> {/* ✅ NUEVA RUTA */}
        <Route path="configuracion" element={<Configuracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
