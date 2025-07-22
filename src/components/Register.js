import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Padre"); // valor por defecto
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await signup(email, password, role);
      setMessage("Registro exitoso. Ya puedes iniciar sesión.");
      setEmail("");
      setPassword("");
      setRole("Padre");
    } catch (err) {
      setError("Error al registrarse: " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Registro de Usuario</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="ejemplo@correo.com"
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Tu contraseña"
        />

        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="Administrador">Administrador</option>
          <option value="Promotor">Promotor</option>
          <option value="Docente">Docente</option>
          <option value="Padre">Padre de Familia</option>
        </select>

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}
