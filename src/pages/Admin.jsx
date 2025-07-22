import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Stack,
  Divider,
  Tab,
  Tabs,
  Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import PaymentIcon from "@mui/icons-material/Payment";
import InventoryIcon from "@mui/icons-material/Inventory";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import "../styles/admin.css";

export default function Admin() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [botonActivo, setBotonActivo] = useState("gestion-usuarios");
  const [subMenuActivo, setSubMenuActivo] = useState(null);

  const adminOptions = [
    {
      label: "Gestión de Usuarios",
      icon: <PeopleIcon />,
      path: "gestion-usuarios",
    },
    {
      label: "Reporte de Pagos",
      icon: <PaymentIcon />,
      path: "reporte-pagos",
    },
    {
      label: "Inventario de Uniformes",
      icon: <InventoryIcon />,
      path: "inventario-uniformes",
    },
    {
      label: "Personal Educativo",   // Nueva pestaña
      icon: <PeopleIcon />,          // Icono de personas (puedes cambiar si quieres)
      path: "personal-educativo",
    },
    {
      label: "Configuración",
      icon: <SettingsIcon />,
      path: "configuracion",
    },
  ];

  const handleTabChange = (event, newValue) => {
    setBotonActivo(newValue);
    setSubMenuActivo(null); // Reset submenú al cambiar pestaña
    navigate(newValue);
  };

  const handleSubMenuClick = (submenu) => {
    setSubMenuActivo(submenu);
    navigate(`reporte-pagos/${submenu}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      alert("Error al cerrar sesión");
    }
  };

  return (
    <Container className="admin-container">
      <Card className="admin-card" elevation={4}>
        <CardContent>
          {/* ENCABEZADO */}
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar
              sx={{ bgcolor: "primary.main", width: 56, height: 56, mr: 2 }}
            >
              {currentUser?.email?.charAt(0).toUpperCase() || "A"}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Bienvenido Administrador
              </Typography>
              <Typography color="text.secondary" fontSize={14}>
                {currentUser?.email || "admin@demo.com"}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* PESTAÑAS PRINCIPALES */}
          <Tabs
            value={botonActivo}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            {adminOptions.map((option) => (
              <Tab
                key={option.label}
                label={option.label}
                value={option.path}
                icon={option.icon}
              />
            ))}
          </Tabs>

          {/* SUBMENÚ DE "REPORTE DE PAGOS" CENTRADO */}
          {botonActivo === "reporte-pagos" && (
            <Box mt={3} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => handleSubMenuClick("por-alumno")}
                className={subMenuActivo === "por-alumno" ? "activo" : ""}
                sx={{ minWidth: 150 }}
              >
                Por Alumno
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSubMenuClick("por-grado")}
                className={subMenuActivo === "por-grado" ? "activo" : ""}
                sx={{ minWidth: 150 }}
              >
                Por Grado
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSubMenuClick("por-categoria")}
                className={subMenuActivo === "por-categoria" ? "activo" : ""}
                sx={{ minWidth: 150 }}
              >
                Por Categoría
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleSubMenuClick("general")}
                className={subMenuActivo === "general" ? "activo" : ""}
                sx={{ minWidth: 150 }}
              >
                General
              </Button>
            </Box>
          )}

          {/* BOTÓN CERRAR SESIÓN */}
          <Stack mt={4} direction="row" justifyContent="center">
            <Button
              className="logout-button"
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* PANEL DINÁMICO */}
      <Outlet />
    </Container>
  );
}
