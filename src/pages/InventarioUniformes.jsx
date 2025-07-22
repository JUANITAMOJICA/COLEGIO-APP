import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, TextField, MenuItem, Divider, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import VentaDeUniforme from '../components/VentaDeUniforme';
import HistorialDeVentas from '../pages/HistorialDeVentas'; // Asegúrate de que exista este componente
import { jsPDF } from "jspdf";
import { generarPDFRecibo } from '../pages/HistorialDeVentas';

const tallas = ['4', '6', '8', '10', '12', '14', '16'];
const tipos = ['Buzo', 'Casaca', 'Camisa', 'Polo', 'Short', 'Corbata', 'Lazo', 'Chompa', 'Falda', 'Otros'];
const ubicaciones = ['Almacén'];
const estados = ['Para Pedido', 'Para Recojo', 'En Stock'];

const InventarioUniformes = () => {
  const [view, setView] = useState('consultar');
  const [form, setForm] = useState({
    tipo: '',
    talla: '',
    cantidad: '',
    precio: '',
    ubicacion: '',
    estado: '',
  });
  const [inventario, setInventario] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [password, setPassword] = useState('');

  // Cargar inventario desde Firestore y ordenar por fecha
  useEffect(() => {
    const cargarInventario = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'uniformes'));
        const datos = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || 0;
            const bTime = b.timestamp?.toDate?.() || 0;
            return bTime - aTime;
          });
        setInventario(datos);
      } catch (error) {
        console.error('Error al obtener inventario:', error);
      }
    };

    cargarInventario();
  }, [view]);

  // Cargar ventas y alumnos cuando la vista es 'historial'
  useEffect(() => {
    if (view === 'historial') {
      const cargarVentas = async () => {
        try {
          const ventasSnapshot = await getDocs(collection(db, 'ventas'));
          const ventasData = ventasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVentas(ventasData);
        } catch (error) {
          console.error('Error al cargar ventas:', error);
        }
      };

      const cargarAlumnos = async () => {
        try {
          const alumnosSnapshot = await getDocs(collection(db, 'alumnos'));
          const alumnosData = alumnosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAlumnos(alumnosData);
        } catch (error) {
          console.error('Error al cargar alumnos:', error);
        }
      };

      cargarVentas();
      cargarAlumnos();
    }
  }, [view]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAgregarSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'uniformes'), {
        ...form,
        timestamp: serverTimestamp()
      });
      alert('Uniforme agregado al inventario correctamente.');
      setForm({
        tipo: '',
        talla: '',
        cantidad: '',
        precio: '',
        ubicacion: '',
        estado: '',
      });
      setView('consultar');
    } catch (error) {
      console.error('Error al agregar uniforme:', error);
    }
  };

  const validatePassword = () => {
    if (password === '230990') {
      setAccessGranted(true);
      setPasswordOpen(false);
      setView('agregar');
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha.seconds * 1000).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventario de Uniformes
      </Typography>

      {/* Botones de navegación */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={view === 'consultar' ? 'contained' : 'outlined'}
          onClick={() => setView('consultar')}
        >
          Consultar Inventario
        </Button>
        <Button
          variant={view === 'agregar' ? 'contained' : 'outlined'}
          onClick={() => {
            if (!accessGranted) setPasswordOpen(true);
            else setView('agregar');
          }}
        >
          Agregar Inventario
        </Button>
        <Button
          variant={view === 'venta' ? 'contained' : 'outlined'}
          onClick={() => setView('venta')}
        >
          Venta de Uniforme
        </Button>
        <Button
          variant={view === 'historial' ? 'contained' : 'outlined'}
          onClick={() => setView('historial')}
        >
          Historial de Ventas
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* VISTA AGREGAR INVENTARIO */}
      {view === 'agregar' && accessGranted && (
        <Box component="form" onSubmit={handleAgregarSubmit}>
          <Typography variant="h6" gutterBottom>Formulario de Inventario</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth name="tipo" label="Tipo de Uniforme" value={form.tipo} onChange={handleInputChange}>
                {tipos.map((tipo) => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth name="talla" label="Talla" value={form.talla} onChange={handleInputChange}>
                {tallas.map((talla) => <MenuItem key={talla} value={talla}>{talla}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth name="cantidad" label="Cantidad Disponible" type="number" value={form.cantidad} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth name="precio" label="Precio (S/)" type="number" value={form.precio} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth name="ubicacion" label="Ubicación" value={form.ubicacion} onChange={handleInputChange}>
                {ubicaciones.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth name="estado" label="Estado" value={form.estado} onChange={handleInputChange}>
                {estados.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 3 }}>
            Agregar al Inventario
          </Button>
        </Box>
      )}

      {/* VISTA CONSULTAR INVENTARIO */}
      {view === 'consultar' && (
        <>
          <Typography variant="h6" gutterBottom>Lista de Inventario</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Talla</strong></TableCell>
                  <TableCell><strong>Cantidad</strong></TableCell>
                  <TableCell><strong>Precio (S/)</strong></TableCell>
                  <TableCell><strong>Ubicación</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventario.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{item.talla}</TableCell>
                    <TableCell>{item.cantidad}</TableCell>
                    <TableCell>{item.precio}</TableCell>
                    <TableCell>{item.ubicacion}</TableCell>
                    <TableCell>{item.estado}</TableCell>
                    <TableCell>{formatearFecha(item.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* VISTA VENTA DE UNIFORME */}
      {view === 'venta' && <VentaDeUniforme />}

      {/* VISTA HISTORIAL DE VENTAS */}
      {view === 'historial' && (
  <Box>
    <Typography variant="h6" gutterBottom>
      Historial de Ventas Confirmadas
    </Typography>

    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Nombres y Apellidos</strong></TableCell>
            <TableCell><strong>Tipo</strong></TableCell>
            <TableCell><strong>Cantidad</strong></TableCell>
            <TableCell><strong>Precio (S/)</strong></TableCell>
            <TableCell><strong>Fecha</strong></TableCell>
            <TableCell><strong>Hora</strong></TableCell>
            <TableCell><strong>Recibo</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ventas
            .slice()
            .sort((a, b) => {
              const fechaA = a.fecha?.seconds ? a.fecha.seconds * 1000 : 0;
              const fechaB = b.fecha?.seconds ? b.fecha.seconds * 1000 : 0;
              return fechaB - fechaA;
            })
            .map((venta) => {
              const alumno = alumnos.find(a => a.id === venta.alumnoId);
              const nombreCompleto = alumno?.nombre && alumno?.apellido
                ? `${alumno.nombre} ${alumno.apellido}`
                : alumno?.nombre || alumno?.apellido || 'Alumno desconocido';

              const fechaObj = venta.fecha?.seconds ? new Date(venta.fecha.seconds * 1000) : null;
              const fechaStr = fechaObj?.toLocaleDateString('es-PE') || '';
              const horaStr = fechaObj?.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit'
              }) || '';

             const generarReciboPDF = async (venta) => {
  const alumno = alumnos.find(a => a.id === venta.alumnoId);
  if (!alumno) {
    alert('No se encontró información del alumno');
    return;
  }

  const fechaPago = venta.fecha?.seconds ? new Date(venta.fecha.seconds * 1000) : new Date();

  const reciboFake = {
    alumnoId: venta.alumnoId,
    fechaPago: fechaPago.toISOString(),
    tipoPago: 'Otros',
    descripcionOtros: `Compra de uniforme: ${venta.tipo}${venta.talla ? `, Talla ${venta.talla}` : ''}`,
    monto: parseFloat(venta.precio || 0),
    medioPago: 'Efectivo',
    numeroRecibo: venta.numeroRecibo || venta.id?.substring(0, 8) || 'SN',
  };

  await generarPDFRecibo(reciboFake, alumno);
};

              return (
                <TableRow key={venta.id}>
                  <TableCell>{nombreCompleto}</TableCell>
                  <TableCell>{venta.tipo}</TableCell>
                  <TableCell>{venta.cantidad || 1}</TableCell>
                  <TableCell>{venta.precio}</TableCell>
                  <TableCell>{fechaStr}</TableCell>
                  <TableCell>{horaStr}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => generarReciboPDF(venta)}>
                      Descargar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
)}

      {/* Diálogo de contraseña */}
      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)}>
        <DialogTitle>Ingrese la contraseña</DialogTitle>
        <DialogContent>
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordOpen(false)}>Cancelar</Button>
          <Button onClick={validatePassword}>Validar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventarioUniformes;
