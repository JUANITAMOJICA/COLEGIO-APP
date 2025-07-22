import React from "react";
import { Button, TextField, Stack } from "@mui/material";

export default function Configuracion() {
  const handleSave = () => {
    // Lógica para guardar configuraciones
    alert("Configuraciones guardadas");
  };

  return (
    <div>
      <h2>Configuración de Cuenta</h2>
      <Stack spacing={2}>
        <TextField label="Nombre de Usuario" variant="outlined" fullWidth />
        <TextField label="Correo Electrónico" variant="outlined" fullWidth />
        <TextField label="Contraseña" type="password" variant="outlined" fullWidth />
        <Button variant="contained" color="primary" onClick={handleSave}>
          Guardar Cambios
        </Button>
      </Stack>
    </div>
  );
}
