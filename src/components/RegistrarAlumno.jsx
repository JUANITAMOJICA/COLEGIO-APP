import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

const db = getFirestore(app);

function RegistrarAlumno({ onClose }) {
  const [nombre, setNombre] = useState("");
  const [estadoPago, setEstadoPago] = useState("Pendiente");

  const registrarAlumno = async (e) => {
    e.preventDefault();
    if (!nombre) return alert("Nombre requerido");

    await addDoc(collection(db, "alumnos"), {
      nombre,
      estadoPago,
    });

    alert("Alumno registrado con éxito");
    setNombre("");
    setEstadoPago("Pendiente");
    onClose(); // Cierra el formulario y actualiza la tabla
  };

  return (
    <form onSubmit={registrarAlumno}>
      <h3>Registrar Alumno</h3>
      <input
        type="text"
        placeholder="Nombre del Alumno"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <select
        value={estadoPago}
        onChange={(e) => setEstadoPago(e.target.value)}
      >
        <option value="Pendiente">Pendiente</option>
        <option value="Pagado">Pagado</option>
      </select>
      <button type="submit">Registrar</button>
      <button type="button" onClick={onClose}>Cancelar</button>
    </form>
  );
}

export default RegistrarAlumno;
