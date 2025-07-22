import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

export default function Notas() {
  const [notas, setNotas] = useState([]);
  const db = getFirestore(app);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    async function fetchNotas() {
      let q;

      if (userRole === "Padre") {
        // Para Padres, buscamos las notas relacionadas a su usuario, ejemplo: notas con el ID de alumno relacionado al usuario
        // Suponemos que en la colección 'notas' hay un campo 'alumnoId' que relaciona al usuario padre con las notas
        q = query(collection(db, "notas"), where("alumnoId", "==", currentUser.uid));
      } else {
        // Para Admin, Docente o Promotor, traemos todas las notas
        q = query(collection(db, "notas"));
      }

      const querySnapshot = await getDocs(q);
      const notasData = [];
      querySnapshot.forEach((doc) => {
        notasData.push({ id: doc.id, ...doc.data() });
      });
      setNotas(notasData);
    }

    if (currentUser && userRole) {
      fetchNotas();
    }
  }, [db, currentUser, userRole]);

  return (
    <div>
      <h2>Notas de Estudiantes</h2>
      {notas.length === 0 ? (
        <p>No hay notas disponibles.</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Materia</th>
              <th>Nota</th>
              <th>Periodo</th>
            </tr>
          </thead>
          <tbody>
            {notas.map(({ id, alumnoNombre, materia, nota, periodo }) => (
              <tr key={id}>
                <td>{alumnoNombre}</td>
                <td>{materia}</td>
                <td>{nota}</td>
                <td>{periodo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
