import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, userRole, currentUser } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && userRole) {
      switch (userRole) {
        case "Administrador":
          navigate("/admin");
          break;
        case "Promotor":
          navigate("/promotor");
          break;
        case "Docente":
          navigate("/docente");
          break;
        case "Padre":
          navigate("/padre");
          break;
        default:
          navigate("/");
      }
      setLoading(false);
    }
  }, [currentUser, userRole, navigate]);

  return (
    <div style={styles.container}>
      {/* Logo */}
      <img
        src="https://i.imgur.com/e6wa0LQ.png" // Cambia esta ruta al logo que quieras
        alt="Logo"
        style={styles.logo}
      />
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={{ marginBottom: 20 }}>Iniciar Sesión</h2>
        {error && <p style={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: "0 1rem",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 30,
  },
  form: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
  },
  input: {
    height: 40,
    padding: "0 12px",
    marginBottom: 15,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  button: {
    height: 42,
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 16,
    transition: "background-color 0.3s ease",
  },
  error: {
    marginBottom: 15,
    color: "#d93025",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
};

export default Login;
