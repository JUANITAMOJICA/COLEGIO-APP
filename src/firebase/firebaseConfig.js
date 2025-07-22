// src/firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDC-wOy1DOYw_ap9bbQJs37k44BJs9pV8Q', // <--- ASEGÚRATE QUE ESTA ES TU CLAVE REAL
  authDomain: 'juanita-web-151a8.firebaseapp.com',
  projectId: 'juanita-web-151a8',
  storageBucket: 'juanita-web-151a8.appspot.com',
  messagingSenderId: '649554138214',
  appId: '1:649554138214:web:0897da7461a287f91489a7',
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta auth, db y storage para usar en otros archivos
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };