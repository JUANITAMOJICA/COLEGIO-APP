import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

export default function Navbar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      alert("Error al cerrar sesión");
    }
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">
          Colegio App - {currentUser?.email || "Usuario"}
        </Typography>
        <Box>
          <Button color="inherit" onClick={() => navigate("/admin/inventario-uniformes")}>
            Consultar Inventario
          </Button>
          <Button color="inherit" onClick={() => navigate("/admin/venta-uniformes")}>
            Venta de Uniformes
          </Button>
          <Button color="inherit" onClick={() => navigate("/admin/historial-ventas")}>
            Historial de Ventas
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
