import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  Box,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import CategoriaChart from "../components/CategoriaChart";

const tiposPermitidos = [
  "Matrícula",
  "Cuota Aniversario",
  "Agenda",
  "Pensión",
];

export default function PorCategoria() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [pagos, setPagos] = useState([]);

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

        setAlumnos(listaAlumnos);
        setPagos(listaPagos);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    obtenerDatos();
  }, []);

  const alumnosFiltrados = categoriaSeleccionada
    ? alumnos.filter((alumno) =>
        pagos.some(
          (pago) =>
            pago.alumnoId === alumno.id &&
            pago.tipoPago === categoriaSeleccionada
        )
      )
    : [];

  const pagosFiltrados = pagos.filter(
    (pago) => pago.tipoPago === categoriaSeleccionada
  );

  const totalCategoria = pagosFiltrados.reduce(
    (acc, pago) => acc + parseFloat(pago.monto || 0),
    0
  );

  const totalPension = pagos
    .filter((p) => p.tipoPago === "Pensión")
    .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

  const exportarExcel = () => {
    const data = alumnosFiltrados.map((alumno) => {
      const pagosAlumno = pagosFiltrados.filter(
        (p) => p.alumnoId === alumno.id
      );

      const mesesPagados =
        categoriaSeleccionada === "Pensión"
          ? pagosAlumno.map((p) => p.mesPension || "Sin mes").join(", ")
          : "";

      return {
        Nombre: alumno.nombre,
        Apellido: alumno.apellido,
        Grado: alumno.grado,
        "Monto Pagado (S/.)": pagosAlumno
          .map((p) => p.monto)
          .join(", "),
        ...(categoriaSeleccionada === "Pensión" && {
          "Meses Pagados": mesesPagados,
        }),
      };
    });

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

    saveAs(blob, `Pagos_Total_${categoriaSeleccionada}.xlsx`);
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Reporte de Pagos por Categoría
      </Typography>

      <Grid container spacing={2} mb={3}>
        {tiposPermitidos.map((tipo) => (
          <Grid item xs={12} sm={6} md={3} key={tipo}>
            <Button
              variant={
                categoriaSeleccionada === tipo ? "contained" : "outlined"
              }
              fullWidth
              onClick={() => setCategoriaSeleccionada(tipo)}
            >
              {tipo}
            </Button>
          </Grid>
        ))}
      </Grid>

      {categoriaSeleccionada && (
        <>
          <Typography variant="h6" gutterBottom>
            Alumnos que realizaron {categoriaSeleccionada}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Total ingresado en esta categoría:</strong> S/{" "}
            {totalCategoria.toFixed(2)}
          </Typography>

          {categoriaSeleccionada === "Pensión" && (
            <Typography variant="body1" color="primary">
              <strong>Total Recaudado por Pensión:</strong> S/{" "}
              {totalPension.toFixed(2)}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {alumnosFiltrados.length > 0 ? (
              alumnosFiltrados.map((alumno) => {
                const pagosAlumno = pagosFiltrados.filter(
                  (p) => p.alumnoId === alumno.id
                );

                const montoTotal = pagosAlumno.reduce(
                  (acc, p) => acc + parseFloat(p.monto || 0),
                  0
                );

                const meses =
                  categoriaSeleccionada === "Pensión"
                    ? pagosAlumno.map((p) => p.mesPension || "Sin mes")
                    : [];

                return (
                  <Grid item xs={12} md={6} key={alumno.id}>
                    <Card elevation={3}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {alumno.nombre} {alumno.apellido}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Grado: {alumno.grado}
                        </Typography>
                        <Typography variant="body2">
                          Total Pagado: S/ {montoTotal.toFixed(2)}
                        </Typography>
                        {categoriaSeleccionada === "Pensión" && (
                          <Typography variant="body2" color="text.secondary">
                            Meses: {meses.join(", ")}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Typography variant="body2" sx={{ m: 2 }}>
                No hay alumnos registrados en esta categoría.
              </Typography>
            )}
          </Grid>
            {/* Gráfico de montos por alumno */}
            {alumnosFiltrados.length > 0 && pagosFiltrados.length > 0 && (
            <CategoriaChart alumnos={alumnosFiltrados} pagos={pagosFiltrados} />
            )}
          <Box mt={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={exportarExcel}
            >
              Exportar a Excel
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
