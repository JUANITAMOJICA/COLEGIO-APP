import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

export default function Promotor() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore(app);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [grado, setGrado] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editId, setEditId] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      alert("Error al cerrar sesión");
    }
  };

  const cargarAlumnos = useCallback(async () => {
    if (!currentUser) return;
    const q = query(collection(db, "alumnos"), where("createdBy", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const lista = [];
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() });
    });
    setAlumnos(lista);
  }, [currentUser, db]);

  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos]);

  const handleAgregarEditarAlumno = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !grado) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        const alumnoRef = doc(db, "alumnos", editId);
        await updateDoc(alumnoRef, { nombre, apellido, grado });
        setEditId(null);
      } else {
        await addDoc(collection(db, "alumnos"), {
          nombre,
          apellido,
          grado,
          createdBy: currentUser.uid,
          createdAt: new Date(),
        });
      }

      setNombre("");
      setApellido("");
      setGrado("");
      cargarAlumnos();
    } catch (error) {
      alert("Error al guardar alumno");
      console.error(error);
    }
    setLoading(false);
  };

  const handleEditar = (alumno) => {
    setNombre(alumno.nombre);
    setApellido(alumno.apellido);
    setGrado(alumno.grado);
    setEditId(alumno.id);
  };

  const handleCancelarEdicion = () => {
    setNombre("");
    setApellido("");
    setGrado("");
    setEditId(null);
  };

  const handleGestionarPagos = (id) => {
    navigate(`/gestion-pagos/${id}`);
  };

  const alumnosFiltrados = alumnos.filter((alumno) => {
    const texto = busqueda.toLowerCase();
    return (
      alumno.nombre.toLowerCase().includes(texto) ||
      alumno.apellido.toLowerCase().includes(texto) ||
      alumno.grado.toLowerCase().includes(texto)
    );
  });

  const estilos = {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    },
    title: { textAlign: "center", marginBottom: "20px" },
    form: { marginBottom: "30px" },
    input: {
      display: "block",
      marginBottom: "10px",
      padding: "10px",
      width: "100%",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    select: {
      display: "block",
      marginBottom: "10px",
      padding: "10px",
      width: "100%",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginRight: "10px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      backgroundColor: "#f2f2f2",
      padding: "10px",
      border: "1px solid #ddd",
    },
    td: {
      padding: "10px",
      border: "1px solid #ddd",
    },
    actions: {
      display: "flex",
      gap: "8px",
    },
    logoutButton: {
      marginTop: "30px",
      backgroundColor: "#d9534f",
    },
  };

  return (
    <div style={estilos.container}>
      <h1 style={estilos.title}>Promotor</h1>
      <p>Usuario: {currentUser?.email}</p>

      <form onSubmit={handleAgregarEditarAlumno} style={estilos.form}>
        <h2>{editId ? "Editar Alumno" : "Registrar Alumno"}</h2>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={estilos.input}
        />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          style={estilos.input}
        />
        <select value={grado} onChange={(e) => setGrado(e.target.value)} style={estilos.select}>
          <option value="">Selecciona un grado</option>
          <option value="Inicial 3 Años">Inicial 3 Años</option>
          <option value="Inicial 4 Años">Inicial 4 Años</option>
          <option value="Inicial 5 Años">Inicial 5 Años</option>
          <option value="1 Grado de Primaria">1 Grado de Primaria</option>
          <option value="2 Grado de Primaria">2 Grado de Primaria</option>
          <option value="3 Grado de Primaria">3 Grado de Primaria</option>
          <option value="4 Grado de Primaria">4 Grado de Primaria</option>
          <option value="5 Grado de Primaria">5 Grado de Primaria</option>
          <option value="6 Grado de Primaria">6 Grado de Primaria</option>
        </select>
        <button type="submit" disabled={loading} style={estilos.button}>
          {loading ? (editId ? "Guardando..." : "Agregando...") : editId ? "Guardar Cambios" : "Agregar Alumno"}
        </button>
        {editId && (
          <button type="button" onClick={handleCancelarEdicion} disabled={loading} style={estilos.button}>
            Cancelar
          </button>
        )}
      </form>

      <h2>Buscar Alumno</h2>
      <input
        type="text"
        placeholder="Buscar por nombre, apellido o grado"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={estilos.input}
      />

      <h2>Alumnos Registrados</h2>
      {alumnosFiltrados.length === 0 ? (
        <p>No hay alumnos registrados.</p>
      ) : (
        <table style={estilos.table}>
          <thead>
            <tr>
              <th style={estilos.th}>Nombre</th>
              <th style={estilos.th}>Apellido</th>
              <th style={estilos.th}>Grado</th>
              <th style={estilos.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnosFiltrados.map((alumno) => (
              <tr key={alumno.id}>
                <td style={estilos.td}>{alumno.nombre}</td>
                <td style={estilos.td}>{alumno.apellido}</td>
                <td style={estilos.td}>{alumno.grado}</td>
                <td style={estilos.td}>
                  <div style={estilos.actions}>
                    <button style={estilos.button} onClick={() => handleEditar(alumno)}>Editar</button>
                    <button style={estilos.button} onClick={() => handleGestionarPagos(alumno.id)}>Gestionar Pagos</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={handleLogout} style={{ ...estilos.button, ...estilos.logoutButton }}>
        Cerrar Sesión
      </button>
    </div>
  );
}
