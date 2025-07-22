import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

function HistorialDeVentas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const fetchVentas = async () => {
      const querySnapshot = await getDocs(collection(db, 'ventas'));
      const ventasData = querySnapshot.docs.map(doc => doc.data());
      setVentas(ventasData);
    };

    fetchVentas();
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Historial de Ventas
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Alumno</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Talla</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ventas.map((venta, index) => (
              <TableRow key={index}>
                <TableCell>{venta.alumnoNombre}</TableCell>
                <TableCell>{venta.tipo}</TableCell>
                <TableCell>{venta.talla}</TableCell>
                <TableCell>{venta.precio}</TableCell>
                <TableCell>{new Date(venta.fecha.seconds * 1000).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default HistorialDeVentas;
