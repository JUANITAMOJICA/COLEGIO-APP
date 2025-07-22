import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const exportarExcel = (alumnos, grado) => {
  const data = alumnos.map((alumno) => ({
    Nombre: alumno.nombre,
    Apellido: alumno.apellido,
    Grado: alumno.grado,
    "Total Pagado (S/.)": alumno.totalPagado.toFixed(2),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(blob, `Pagos_${grado.replace(/\s+/g, "_")}.xlsx`);
};

const grados = [
  "Inicial 3 Años",
  "Inicial 4 Años",
  "Inicial 5 Años",
  "1 Grado de Primaria",
  "2 Grado de Primaria",
  "3 Grado de Primaria",
  "4 Grado de Primaria",
  "5 Grado de Primaria",
  "6 Grado de Primaria",
];

const tiposPermitidos = [
  "Matrícula",
  "Cuota de Aniversario",
  "Agenda",
  "Pensión",
];

export default function PorGrado() {
  const [gradoSeleccionado, setGradoSeleccionado] = useState(null);
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const alumnosSnapshot = await getDocs(collection(db, "alumnos"));
        const pagosSnapshot = await getDocs(collection(db, "pagos"));

        const listaAlumnos = alumnosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const listaPagos = pagosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const alumnosConPagos = listaAlumnos.map((alumno) => {
          const pagosAlumno = listaPagos.filter(
            (pago) =>
              pago.alumnoId === alumno.id &&
              tiposPermitidos.includes(pago.tipoPago)
          );

          const totalPagado = pagosAlumno.reduce(
            (sum, pago) => sum + parseFloat(pago.monto || 0),
            0
          );

          return {
            ...alumno,
            totalPagado,
          };
        });

        setAlumnos(alumnosConPagos);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    obtenerDatos();
  }, []);

  const alumnosFiltrados = gradoSeleccionado
    ? alumnos.filter((alumno) => alumno.grado === gradoSeleccionado)
    : [];

  const sumaTotalGrado = alumnosFiltrados.reduce(
    (acc, alumno) => acc + alumno.totalPagado,
    0
  );

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Reporte de Pagos por Grado
      </Typography>

      <Grid container spacing={2} mb={3}>
        {grados.map((grado) => (
          <Grid item xs={12} sm={6} md={4} key={grado}>
            <Button
              variant={gradoSeleccionado === grado ? "contained" : "outlined"}
              fullWidth
              onClick={() => setGradoSeleccionado(grado)}
            >
              {grado}
            </Button>
          </Grid>
        ))}
      </Grid>

      {gradoSeleccionado && (
        <>
          <Typography variant="h6" gutterBottom>
            Alumnos en {gradoSeleccionado}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Total ingresado en este grado:</strong>{" "}
            S/ {sumaTotalGrado.toFixed(2)}
          </Typography>
          <Divider sx={{ mb: 2 }} />
<Button
  variant="contained"
  color="success"
  onClick={() => exportarExcel(alumnosFiltrados, gradoSeleccionado)}
  sx={{ mb: 2 }}
>
  Exportar a Excel
</Button>

          <Grid container spacing={2}>
            {alumnosFiltrados.length > 0 ? (
              alumnosFiltrados.map((alumno) => (
                <Grid item xs={12} md={6} key={alumno.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {alumno.nombre} {alumno.apellido}
                      </Typography>
                      <Typography color="text.secondary">
                        Total Pagado: S/ {alumno.totalPagado.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body2" sx={{ m: 2 }}>
                No hay alumnos registrados en este grado.
              </Typography>
            )}
          </Grid>
        </>
      )}
    </Container>
  );
}
