import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

export default function Publicaciones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const db = getFirestore(app);

  useEffect(() => {
    async function fetchPublicaciones() {
      const q = query(collection(db, "publicaciones"), orderBy("fecha", "desc"));
      const querySnapshot = await getDocs(q);
      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setPublicaciones(posts);
    }

    fetchPublicaciones();
  }, [db]);

  return (
    <div>
      <h2>Publicaciones de Eventos</h2>
      {publicaciones.length === 0 ? (
        <p>No hay publicaciones disponibles.</p>
      ) : (
        publicaciones.map(({ id, titulo, descripcion, fecha }) => (
          <div key={id} style={{border: "1px solid #ccc", padding: "10px", marginBottom: "10px"}}>
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
            <small>{fecha?.toDate ? fecha.toDate().toLocaleString() : "Fecha no disponible"}</small>
          </div>
        ))
      )}
    </div>
  );
}
