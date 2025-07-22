// src/pages/Pagos.jsx
import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

const db = getFirestore(app);

export default function Pagos({ alumnoId }) {
  const [mes, setMes] = useState("");
  const [monto, setMonto] = useState("");
  const [pagos, setPagos] = useState([]);

  const meses = [
    "Marzo", "Abril", "Mayo", "Junio", "Julio",
    "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const obtenerPagos = async () => {
    const pagosRef = collection(db, "alumnos", alumnoId, "pagos");
    const snapshot = await getDocs(pagosRef);
    const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPagos(datos);
  };

  const registrarPago = async () => {
    const nuevoPago = {
      mes,
      monto: parseFloat(monto),
      fecha: new Date().toISOString().split("T")[0],
    };
    await addDoc(collection(db, "alumnos", alumnoId, "pagos"), nuevoPago);
    setMes("");
    setMonto("");
    obtenerPagos();
  };

  const eliminarPago = async (pagoId) => {
    await deleteDoc(doc(db, "alumnos", alumnoId, "pagos", pagoId));
    obtenerPagos();
  };

  useEffect(() => {
    if (alumnoId) obtenerPagos();
  }, [alumnoId]);

  return (
    <div>
      <h2>Gestión de Pagos</h2>
      <select value={mes} onChange={(e) => setMes(e.target.value)}>
        <option value="">Seleccionar mes</option>
        {meses.map((m, i) => (
          <option key={i} value={m}>{m}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Monto"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      <button onClick={registrarPago}>Registrar Pago</button>

      <h3>Pagos Realizados</h3>
      <ul>
        {pagos.map(pago => (
          <li key={pago.id}>
            {pago.mes} - S/ {pago.monto} ({pago.fecha})
            <button onClick={() => eliminarPago(pago.id)}>🗑</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
