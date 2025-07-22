import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
} from "@mui/material";

export default function PorAlumno() {
  const [alumnos, setAlumnos] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const fetchAlumnosYPagos = async () => {
      try {
        // Obtener alumnos
        const alumnosSnapshot = await getDocs(collection(db, "alumnos"));
        const listaAlumnos = alumnosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Obtener pagos
        const pagosSnapshot = await getDocs(collection(db, "pagos"));
        const listaPagos = pagosSnapshot.docs.map((doc) => doc.data());

        // Calcular pagos totales por alumno
        const alumnosConPagos = listaAlumnos.map((alumno) => {
          const pagosDelAlumno = listaPagos.filter(
            (pago) => pago.alumnoId === alumno.id
          );
          const totalPagado = pagosDelAlumno.reduce(
            (sum, pago) => sum + (pago.monto || 0),
            0
          );
          return {
            ...alumno,
            apellido: alumno.apellido || "", // ← ← Usa "apellido" (singular)
            totalPagado,
          };
        });

        setAlumnos(alumnosConPagos);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchAlumnosYPagos();
  }, []);

  const alumnosFiltrados = alumnos.filter((alumno) =>
    `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Box mt={4}>
      <Typography variant="h5" gutterBottom>
        Reporte de Pagos por Alumno
      </Typography>

      <TextField
        label="Buscar alumno por nombre o apellido"
        variant="outlined"
        fullWidth
        margin="normal"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <Paper elevation={3} sx={{ mt: 2 }}>
        <List>
          {alumnosFiltrados.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2 }}>
              No se encontraron alumnos.
            </Typography>
          ) : (
            alumnosFiltrados.map((alumno, index) => (
              <React.Fragment key={alumno.id}>
                <ListItem>
                  <ListItemText
                    primary={`${alumno.nombre} ${alumno.apellido}`}
                    secondary={`Total pagado: S/. ${alumno.totalPagado.toFixed(2)}`}
                  />
                </ListItem>
                {index < alumnosFiltrados.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
}
