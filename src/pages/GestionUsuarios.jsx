import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebase/firebaseConfig";
import {
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  MenuItem,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("Docente");

  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditado, setNombreEditado] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const usuariosCollection = collection(db, "usuarios");

  const obtenerUsuarios = async () => {
    const data = await getDocs(usuariosCollection);
    setUsuarios(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const registrarUsuario = async () => {
    setError("");
    setSuccess("");
    if (!nuevoNombre || !nuevoEmail || !nuevoPassword) {
      setError("Completa todos los campos");
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const credencial = await createUserWithEmailAndPassword(
        auth,
        nuevoEmail,
        nuevoPassword
      );

      // Guardar datos del usuario en Firestore con UID como ID
      await setDoc(doc(db, "usuarios", credencial.user.uid), {
        nombre: nuevoNombre,
        email: nuevoEmail,
        rol: nuevoRol,
      });

      setSuccess("Usuario creado correctamente");
      setNuevoNombre("");
      setNuevoEmail("");
      setNuevoPassword("");
      setNuevoRol("Docente");
      obtenerUsuarios();
    } catch (e) {
      setError("Error al crear usuario: " + e.message);
    }
  };

  const eliminarUsuario = async (id) => {
    const usuarioDoc = doc(db, "usuarios", id);
    await deleteDoc(usuarioDoc);
    obtenerUsuarios();
  };

  const comenzarEdicion = (id, nombre) => {
    setEditandoId(id);
    setNombreEditado(nombre);
  };

  const guardarEdicion = async () => {
    const usuarioDoc = doc(db, "usuarios", editandoId);
    await updateDoc(usuarioDoc, { nombre: nombreEditado });
    setEditandoId(null);
    setNombreEditado("");
    obtenerUsuarios();
  };

  return (
    <Box sx={{ mt: 4, p: 3, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Formulario para registrar usuario */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Nombre"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          fullWidth
        />
        <TextField
          label="Email"
          value={nuevoEmail}
          onChange={(e) => setNuevoEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Contraseña"
          value={nuevoPassword}
          onChange={(e) => setNuevoPassword(e.target.value)}
          type="password"
          fullWidth
        />
        <TextField
          label="Rol"
          select
          value={nuevoRol}
          onChange={(e) => setNuevoRol(e.target.value)}
          fullWidth
        >
          <MenuItem value="Administrador">Administrador</MenuItem>
          <MenuItem value="Promotor">Promotor</MenuItem>
          <MenuItem value="Docente">Docente</MenuItem>
          <MenuItem value="Padre">Padre</MenuItem>
        </TextField>

        <Button variant="contained" onClick={registrarUsuario}>
          Registrar Usuario
        </Button>
      </Box>

      {/* Lista de usuarios */}
      <List>
        {usuarios.map(({ id, nombre, email, rol }) => (
          <ListItem
            key={id}
            secondaryAction={
              <>
                {editandoId === id ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={guardarEdicion}
                  >
                    Guardar
                  </Button>
                ) : (
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => comenzarEdicion(id, nombre)}
                  >
                    <EditIcon />
                  </IconButton>
                )}

                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => eliminarUsuario(id)}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            {editandoId === id ? (
              <TextField
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                fullWidth
              />
            ) : (
              <ListItemText
                primary={nombre}
                secondary={`Email: ${email} | Rol: ${rol}`}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
