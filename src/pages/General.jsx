import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const gradosOrdenados = [
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

const tiposPagoBasicos = ["Matrícula", "Cuota Aniversario", "Agenda", "Otros"];
const mesesPension = [
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Setiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const checkMark = <span style={{ color: "green", fontWeight: "bold" }}>✔️</span>;
const crossMark = <span style={{ color: "red", fontWeight: "bold" }}>❌</span>;

export default function General() {
  const [alumnos, setAlumnos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const alumnosSnap = await getDocs(collection(db, "alumnos"));
        const pagosSnap = await getDocs(collection(db, "pagos"));

        const listaAlumnos = alumnosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const listaPagos = pagosSnap.docs.map((doc) => ({
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

  // Filtrar alumnos por nombre o grado según filtro
  const alumnosFiltrados = alumnos
    .filter((alumno) => {
      const nombreCompleto = (alumno.nombre + " " + alumno.apellido).toLowerCase();
      const grado = alumno.grado.toLowerCase();
      const textoFiltro = filtro.toLowerCase();
      return (
        nombreCompleto.includes(textoFiltro) || grado.includes(textoFiltro)
      );
    })
    .sort(
      (a, b) =>
        gradosOrdenados.indexOf(a.grado) - gradosOrdenados.indexOf(b.grado)
    );

  // Función que revisa si hay pago registrado para alumno en tipoPago y mes (si aplica)
  const pagoRegistrado = (alumnoId, tipoPago, mes = null) => {
    return pagos.some((pago) => {
      if (pago.alumnoId !== alumnoId) return false;
      if (pago.tipoPago !== tipoPago) return false;
      if (tipoPago === "Pensión" && mes) {
        return pago.mesPension === mes;
      }
      return true;
    });
  };

  // Exportar Excel con montos numéricos
  const exportarExcel = () => {
    const data = alumnosFiltrados.map((alumno) => {
      // Para tipos básicos
      const pagosBasicos = {};
      tiposPagoBasicos.forEach((tipo) => {
        const pagosAlumno = pagos.filter(
          (p) => p.alumnoId === alumno.id && p.tipoPago === tipo
        );
        const total = pagosAlumno.reduce(
          (acc, p) => acc + parseFloat(p.monto || 0),
          0
        );
        pagosBasicos[tipo] = total > 0 ? total : 0;
      });

      // Para pensión por mes
      const pensionMeses = {};
      mesesPension.forEach((mes) => {
        const pagoMes = pagos.find(
          (p) =>
            p.alumnoId === alumno.id &&
            p.tipoPago === "Pensión" &&
            p.mesPension === mes
        );
        pensionMeses[`Pensión (${mes})`] = pagoMes ? parseFloat(pagoMes.monto || 0) : 0;
      });

      return {
        Nombre: alumno.nombre,
        Apellido: alumno.apellido,
        Grado: alumno.grado,
        ...pagosBasicos,
        ...pensionMeses,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos Detallados");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, `Pagos_Detallados.xlsx`);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Pagos Detallados por Alumno
      </Typography>

      <TextField
        label="Buscar Alumno o Grado"
        variant="outlined"
        fullWidth
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Grado</TableCell>
              {tiposPagoBasicos.map((tipo) => (
                <TableCell key={tipo} align="center">{tipo}</TableCell>
              ))}
              {mesesPension.map((mes) => (
                <TableCell key={mes} align="center">{`Pensión (${mes})`}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {alumnosFiltrados.map((alumno) => (
              <TableRow key={alumno.id} hover>
                <TableCell>{alumno.nombre}</TableCell>
                <TableCell>{alumno.apellido}</TableCell>
                <TableCell>{alumno.grado}</TableCell>

                {tiposPagoBasicos.map((tipo) => (
                  <TableCell key={tipo} align="center">
                    {pagoRegistrado(alumno.id, tipo) ? checkMark : crossMark}
                  </TableCell>
                ))}

                {mesesPension.map((mes) => (
                  <TableCell key={mes} align="center">
                    {pagoRegistrado(alumno.id, "Pensión", mes) ? checkMark : crossMark}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={exportarExcel}>
          Exportar a Excel
        </Button>
      </Box>
    </Container>
  );
}
