import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, MenuItem, Button, Grid, Paper,
  IconButton, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import { jsPDF } from "jspdf";
import { runTransaction } from 'firebase/firestore';

const obtenerSiguienteNumeroRecibo = async () => {
  const reciboRef = doc(db, 'recibos', 'config');
  let nuevoNumero = null;

  await runTransaction(db, async (transaction) => {
    const reciboDoc = await transaction.get(reciboRef);

    if (!reciboDoc.exists()) {
      // Crear el documento si no existe
      transaction.set(reciboRef, { ultimoNumeroRecibo: 1016 }); // Puedes poner 1000 si quieres empezar desde ahí
      nuevoNumero = 1017;
    } else {
      const ultimo = reciboDoc.data().ultimoNumeroRecibo || 1000;
      nuevoNumero = ultimo + 1;
      transaction.update(reciboRef, { ultimoNumeroRecibo: nuevoNumero });
    }
  });

  return nuevoNumero;
};


const loadImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => resolve(img);
  });
const generarPDF = async (recibo, alumno) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const colors = {
    primary: "#1A73E8",
    darkText: "#222222",
    grayText: "#666666",
    lightGray: "#F7F9FC",
    border: "#E0E0E0",
  };

  const logoUrl = "https://i.imgur.com/e6wa0LQ.png";
  const logo = await loadImage(logoUrl);

  const marginLeft = 40;
  const marginRight = 555;
  let cursorY = 50;

  doc.addImage(logo, "PNG", marginLeft, cursorY, 50, 50);
  doc.setFontSize(12);
  doc.setTextColor(colors.darkText);
  doc.setFont("helvetica", "bold");
  doc.text("Institución Educativa Particular", marginLeft + 70, cursorY + 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Juanita Mojica", marginLeft + 70, cursorY + 28);
  doc.text("R.D.R. N° 000616-16", marginLeft + 70, cursorY + 42);
  doc.text(
    "Centro Poblado Victor Raúl Haya de la Torre Mz 57 - Lote 01 - HUANCHACO",
    marginLeft + 70,
    cursorY + 56
  );

  cursorY += 70;
  doc.setDrawColor(colors.border);
  doc.setLineWidth(1);
  doc.line(marginLeft, cursorY, marginRight, cursorY);

  cursorY += 25;
  doc.setFontSize(16);
  doc.setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE PAGO", 297.5, cursorY, null, null, "center");

  const alumnoNombre = `${alumno?.nombre || "-"} ${alumno?.apellido || "-"}`;
  const grado = alumno?.grado || "-";
  const fecha = new Date().toLocaleDateString();
  const tipo = recibo?.tipoPago || "-";
  const medio = recibo?.medioPago || "-";
  const descripcion = recibo?.descripcionOtros || "-";
  const operacion = recibo?.numOperacion || "-";
  const monto = `S/. ${recibo?.monto?.toFixed(2) || "0.00"}`;
  const montoTexto = numeroALetras ? numeroALetras(recibo?.monto || 0) : "-";

  const info = [
    ["N° de Recibo", recibo.numeroRecibo || "-"],
    ["Fecha", fecha],
    ["Alumno", alumnoNombre],
    ["Grado", grado],
    ["Tipo de Pago", tipo],
    ["Descripción", descripcion],
    ["Medio de Pago", medio],
    ["N° de Operación", operacion],
    ["Monto", monto],
    ["Monto en Letras", montoTexto],
  ];

  const labelX = marginLeft + 10;
  const valueX = marginLeft + 140;
  const rowHeight = 22;
  let tableY = cursorY + 50;

  info.forEach(([label, value], j) => {
    const y = tableY + j * rowHeight;
    if (j % 2 === 0) {
      doc.setFillColor(colors.lightGray);
      doc.rect(marginLeft, y - 14, marginRight - marginLeft, rowHeight, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.grayText);
    doc.setFontSize(10);
    doc.text(`${label}:`, labelX, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.darkText);
    doc.text(`${value}`, valueX, y);
  });

  const firmaY = tableY + info.length * rowHeight + 30;
  const lineStartX = marginRight - 130;
  const lineEndX = marginRight - 20;
  doc.setDrawColor(colors.darkText);
  doc.setLineWidth(0.8);
  doc.line(lineStartX, firmaY, lineEndX, firmaY);
  doc.setFontSize(9);
  doc.setTextColor(colors.grayText);
  doc.text("Sello de Conformidad", (lineStartX + lineEndX) / 2, firmaY + 14, null, null, "center");

  doc.setFontSize(8);
  doc.setTextColor(colors.grayText);
  doc.text(
    "Este documento no reemplaza comprobante tributario. Es solo constancia de pago escolar.",
    297.5,
    firmaY + 30,
    null,
    null,
    "center"
  );

  const nombreAlumno = `${alumno?.nombre || "Alumno"}_${alumno?.apellido || ""}`.replace(/\s+/g, "_");
  const numeroRecibo = recibo?.numeroRecibo || recibo?.id || "0000";
  doc.save(`Recibo_${nombreAlumno}_R${numeroRecibo}.pdf`);
};

  
const tipos = ['Buzo', 'Casaca', 'Camisa', 'Polo', 'Short', 'Corbata', 'Lazo', 'Chompa', 'Falda', 'Otros'];
const tallas = ['4', '6', '8', '10', '12', '14', '16'];

const numeroALetras = (numero = 0) => {
  const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenasD = ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const convertir = (n) => {
    if (n < 10) return unidades[n];
    if (n < 20) return decenas[n - 10];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return decenasD[d - 2] + (u > 0 ? ` y ${unidades[u]}` : '');
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      if (c === 1 && r === 0) return 'cien';
      return (c === 1 ? 'ciento' : centenas[c - 1]) + (r > 0 ? ` ${convertir(r)}` : '');
    }
    return n.toString(); // para miles o más, devolver como número
  };

  const partes = numero.toFixed(2).split('.');
  const entero = parseInt(partes[0]);
  const centavos = parseInt(partes[1]);

  const textoEntero = convertir(entero);
  const textoCentavos = centavos > 0 ? ` con ${centavos}/100` : '';

  return textoEntero.charAt(0).toUpperCase() + textoEntero.slice(1) + textoCentavos + ' soles';
};

const VentaDeUniforme = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [form, setForm] = useState({ tipo: '', talla: '', precio: '' });
  const [ventaItems, setVentaItems] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [montoTotal, setMontoTotal] = useState(0);

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [alumnosFiltrados, setAlumnosFiltrados] = useState([]);

  
  useEffect(() => {
    const cargarAlumnos = async () => {
      const snapshot = await getDocs(collection(db, 'alumnos'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(data);
    };
    cargarAlumnos();
  }, []);

  useEffect(() => {
    const cargarInventario = async () => {
      const snapshot = await getDocs(collection(db, 'uniformes'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventario(data);
    };
    cargarInventario();
  }, []);

  useEffect(() => {
    const total = ventaItems.reduce((sum, item) => sum + parseFloat(item.precio || 0), 0);
    setMontoTotal(total);
  }, [ventaItems]);

  const handleAgregarItem = () => {
    if (!form.tipo || !form.talla || !form.precio) {
      alert('Completa todos los campos');
      return;
    }

    const stockItem = inventario.find(i => i.tipo === form.tipo && i.talla === form.talla);
    const yaAgregado = ventaItems.filter(i => i.tipo === form.tipo && i.talla === form.talla).length;

    if (!stockItem || stockItem.cantidad <= yaAgregado) {
      alert('No hay stock disponible o ya has agregado la cantidad máxima permitida.');
      return;
    }

    setVentaItems([...ventaItems, { ...form }]);
    setForm({ tipo: '', talla: '', precio: '' });
  };

  const handleEliminarItem = (index) => {
    const nuevosItems = [...ventaItems];
    nuevosItems.splice(index, 1);
    setVentaItems(nuevosItems);
  };

  const handleVenderItem = async (index) => {
  if (!alumnoSeleccionado) {
    alert('Selecciona un alumno antes de registrar la venta');
    return;
  }

  const item = ventaItems[index];
  const stockItem = inventario.find(
    (inv) => inv.tipo === item.tipo && inv.talla === item.talla
  );

  if (!stockItem || stockItem.cantidad <= 0) {
    alert('No hay stock disponible para este producto');
    return;
  }

  try {
    const stockDocRef = doc(db, 'uniformes', stockItem.id);
    await updateDoc(stockDocRef, {
      cantidad: stockItem.cantidad - 1,
    });

    await addDoc(collection(db, 'ventas'), {
      alumnoId: alumnoSeleccionado.id,
      alumnoNombre: `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido}`,
      tipo: item.tipo,
      talla: item.talla,
      precio: parseFloat(item.precio),
      fecha: new Date(),
    });

    setHistorialVentas([
      ...historialVentas,
      {
        alumnoId: alumnoSeleccionado.id,
        alumnoNombre: `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido}`,
        tipo: item.tipo,
        talla: item.talla,
        precio: parseFloat(item.precio),
        fecha: new Date(),
      },
    ]);

    setVentaItems(ventaItems.filter((_, i) => i !== index));

    const snapshot = await getDocs(collection(db, 'uniformes'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInventario(data);
  } catch (error) {
    console.error('Error en la venta:', error);
  }
};

const handleConfirmarVenta = async () => {
  if (!alumnoSeleccionado) {
    alert('Selecciona un alumno antes de confirmar la venta');
    return;
  }

  try {
    const nuevasVentas = [];

    for (const item of ventaItems) {
      const stockItem = inventario.find(
        (inv) => inv.tipo === item.tipo && inv.talla === item.talla
      );

      if (!stockItem || stockItem.cantidad <= 0) {
        alert(`No hay stock suficiente para ${item.tipo} Talla ${item.talla}`);
        return;
      }

      const stockDocRef = doc(db, 'uniformes', stockItem.id);
      await updateDoc(stockDocRef, {
        cantidad: stockItem.cantidad - 1,
      });

      const numeroRecibo = await obtenerSiguienteNumeroRecibo();

      const ventaDoc = await addDoc(collection(db, 'ventas'), {
        alumnoId: alumnoSeleccionado.id,
        alumnoNombre: `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido}`,
        tipo: item.tipo,
        talla: item.talla,
        precio: parseFloat(item.precio),
        fecha: new Date(),
        numeroRecibo,
      });

      nuevasVentas.push({
        id: ventaDoc.id,
        alumnoId: alumnoSeleccionado.id,
        alumnoNombre: `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellido}`,
        tipo: item.tipo,
        talla: item.talla,
        precio: parseFloat(item.precio),
        fecha: new Date(),
        numeroRecibo,
      });
    }

    setHistorialVentas([...historialVentas, ...nuevasVentas]);
    setVentaItems([]);
    setAlumnoSeleccionado(null);
    setTextoBusqueda('');
    setAlumnosFiltrados([]);

    const snapshot = await getDocs(collection(db, 'uniformes'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setInventario(data);

    alert('Venta confirmada exitosamente');
  } catch (error) {
    console.error('Error al confirmar la venta:', error);
    alert('Error: ' + error.message);
  }
};


  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Venta de Uniforme
      </Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={10}>
          <TextField
            fullWidth
            label="Buscar Alumno"
            placeholder="Escribe el nombre o apellido..."
            variant="outlined"
            value={textoBusqueda}
            onChange={(e) => {
              const valor = e.target.value.toLowerCase();
              setTextoBusqueda(e.target.value);
              setAlumnosFiltrados(
                alumnos.filter(
                  (a) =>
                    a.nombre?.toLowerCase()?.includes(valor) || a.apellido?.toLowerCase()?.includes(valor)
                )
              );
              setAlumnoSeleccionado(null);
            }}
          />
          {textoBusqueda && alumnosFiltrados.length > 0 && (
            <Paper sx={{ maxHeight: 200, overflowY: 'auto', mt: 1 }}>
              {alumnosFiltrados.map((alumno) => (
                <Box
                  key={alumno.id}
                  onClick={() => {
                    setAlumnoSeleccionado(alumno);
                    setTextoBusqueda(`${alumno.nombre} ${alumno.apellido}`);
                    setAlumnosFiltrados([]);
                  }}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#e3f2fd' },
                  }}
                >
                  {alumno.nombre} {alumno.apellido} — {alumno.grado}
                </Box>
              ))}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ height: '56px' }}
            onClick={() => {
              setAlumnoSeleccionado(null);
              setTextoBusqueda('');
              setAlumnosFiltrados([]);
            }}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>

      {alumnoSeleccionado && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1">Datos del Alumno:</Typography>
          <Typography>
            {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido} / {alumnoSeleccionado.grado}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">STOCK DISPONIBLE</Typography>
        {inventario.filter(item => item.cantidad > 0).length === 0 ? (
          <Typography color="text.secondary">No hay stock disponible.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Talla</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Precio (S/)</TableCell>
                  <TableCell align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventario.filter(item => item.cantidad > 0).map((item) => {
                  const yaAgregado = ventaItems.filter(
                    (i) => i.tipo === item.tipo && i.talla === item.talla
                  ).length;
                  const disponible = item.cantidad - yaAgregado;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.tipo}</TableCell>
                      <TableCell>{item.talla}</TableCell>
                      <TableCell align="right">{disponible}</TableCell>
                      <TableCell align="right">
                        {isNaN(parseFloat(item.precio)) ? '-' : parseFloat(item.precio).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setVentaItems([...ventaItems, {
                              tipo: item.tipo,
                              talla: item.talla,
                              precio: parseFloat(item.precio) || ''
                            }]);
                          }}
                          disabled={disponible <= 0}
                        >
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1">Agregar Producto a Venta</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {tipos.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select fullWidth label="Talla" value={form.talla} onChange={(e) => setForm({ ...form, talla: e.target.value })}>
              {tallas.map((talla) => (
                <MenuItem key={talla} value={talla}>{talla}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Precio (S/)"
              type="number"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
          </Grid>
        </Grid>
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleAgregarItem}>
          Agregar a Vista Previa
        </Button>
      </Box>

      {ventaItems.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Vista Previa de Venta</Typography>
          {ventaItems.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>
                {item.tipo} - Talla {item.talla} - 1 unid - S/ {parseFloat(item.precio).toFixed(2)}
              </Typography>
              <Box>
                <IconButton color="error" onClick={() => handleEliminarItem(index)} title="Eliminar Item">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            MONTO TOTAL: S/ {montoTotal.toFixed(2)}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleConfirmarVenta}
            disabled={ventaItems.length === 0 || !alumnoSeleccionado}
          >
            CONFIRMAR VENTA
          </Button>
        </Paper>
      )}

      {historialVentas.length > 0 && (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      HISTORIAL DE VENTA
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Alumno</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Talla</TableCell>
            <TableCell align="right">Precio (S/)</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell align="center">Recibo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {historialVentas.map((venta, idx) => (
            <TableRow key={idx}>
              <TableCell>{venta.alumnoNombre || `${alumnoSeleccionado?.nombre} ${alumnoSeleccionado?.apellido}`}</TableCell>
              <TableCell>{venta.tipo}</TableCell>
              <TableCell>{venta.talla}</TableCell>
              <TableCell align="right">{parseFloat(venta.precio).toFixed(2)}</TableCell>
              <TableCell>
                {venta.fecha
                  ? new Date(
                      venta.fecha.seconds
                        ? venta.fecha.seconds * 1000
                        : venta.fecha
                    ).toLocaleString()
                  : '-'}
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    generarPDF(
                      {
                        numeroRecibo: venta.numeroRecibo || idx + 1,

                        tipoPago: 'Uniforme',
                        descripcionOtros: `${venta.tipo} Talla ${venta.talla}`,
                        medioPago: 'Efectivo',
                        numOperacion: '-',
                        monto: parseFloat(venta.precio)
                      },
                      alumnos.find(a => a.id === venta.alumnoId)
                    )
                  }
                >
                  PDF
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>


      )}
    </Box>
  );
};

export default VentaDeUniforme;
