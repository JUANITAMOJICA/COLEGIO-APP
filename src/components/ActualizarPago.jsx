import React, { useState } from "react";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

const db = getFirestore(app);

function ActualizarPago({ alumno, onClose }) {
  const [nuevoEstado, setNuevoEstado] = useState(alumno.estadoPago);

  const actualizarEstado = async () => {
    const docRef = doc(db, "alumnos", alumno.id);
    await updateDoc(docRef, {
      estadoPago: nuevoEstado
    });
    onClose(); // Para cerrar el formulario y refrescar datos
  };

  return (
    <div>
      <h3>Actualizar Estado de Pago de {alumno.nombre}</h3>
      <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
        <option value="Pendiente">Pendiente</option>
        <option value="Pagado">Pagado</option>
      </select>
      <button onClick={actualizarEstado}>Guardar</button>
      <button onClick={onClose}>Cancelar</button>
    </div>
  );
}

export default ActualizarPago;
