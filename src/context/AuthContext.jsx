import React, { useContext, useState, useEffect, createContext } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";

// Crear contexto
const AuthContext = createContext();

// Hook para acceder al contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}

// Proveedor del contexto
export function AuthProvider({ children }) {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login
  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
    // El listener de onAuthStateChanged se encargará de obtener el rol
  }

  // Registro
  async function register(email, password, rol = "Padre") {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Guardar el rol en Firestore
    await setDoc(doc(db, "usuarios", uid), {
      rol,
    });
  }

  // Logout
  async function logout() {
    await signOut(auth);
  }

  // Obtener usuario y rol al cambiar de sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: Usuario detectado:", user);
      setCurrentUser(user);

      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("AuthContext: Documento usuario:", data);
          setUserRole(data.rol);
        } else {
          console.log("AuthContext: No se encontró documento para usuario", user.uid);
          setUserRole(null);
        }
      } else {
        console.log("AuthContext: No hay usuario");
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [auth, db]);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
