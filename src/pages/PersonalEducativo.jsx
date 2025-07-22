import React, { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase/firebaseConfig"; // Asegúrate de que esta ruta sea correcta
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaUserGraduate,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaInfoCircle,
  FaHandHoldingUsd, // Nuevo icono para Adelantos
  FaUserCircle, // Icono para la foto si no hay imagen
} from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import { FaChartBar } from "react-icons/fa";

const PersonalEducativo = () => {
  // --- Definición de Colores y Estilos ---
  const colors = {
    primary: "#4A90E2", // Azul principal
    secondary: "#50B7C1", // Verde azulado
    accent: "#FF6B6B", // Rojo vibrante para delete/danger
    background: "#F0F2F5", // Fondo claro
    cardBackground: "#FFFFFF", // Fondo de tarjetas
    text: "#333333", // Texto oscuro principal
    lightText: "#666666", // Texto secundario/claro
    border: "#E0E0E0", // Borde suave
    success: "#4CAF50", // Verde para éxito
    info: "#2196F3", // Azul para información/PDF
    warning: "#FFC107", // Amarillo para advertencia
  };

  const style = {
    container: {
      padding: "30px",
      backgroundColor: colors.background,
      minHeight: "10vh",
      fontFamily: "'Inter', sans-serif",
      color: colors.text,
    },
    tabs: {
      display: "flex",
      marginBottom: "30px",
      backgroundColor: colors.cardBackground,
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
      overflow: "hidden",
    },
    tab: (isActive) => ({
      padding: "15px 25px",
      cursor: "pointer",
      fontWeight: isActive ? "600" : "500",
      color: isActive ? colors.cardBackground : colors.lightText,
      backgroundColor: isActive ? colors.primary : "transparent",
      borderBottom: isActive ? `3px solid ${colors.secondary}` : "none",
      flexGrow: 1,
      textAlign: "center",
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden",
      textShadow: isActive ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
    }),
    tabContent: {
      backgroundColor: colors.cardBackground,
      padding: "30px",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
    },
    sectionTitle: {
      fontSize: "26px",
      color: colors.primary,
      marginBottom: "25px",
      borderBottom: `2px solid ${colors.border}`,
      paddingBottom: "10px",
      fontWeight: "700",
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      position: "relative",
      overflow: "hidden",
    },
    cardHoverEffect: {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
    },
    cardImage: {
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      objectFit: "cover",
      marginBottom: "15px",
      border: `3px solid ${colors.secondary}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    cardContent: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    cardName: {
      fontSize: "20px",
      fontWeight: "600",
      color: colors.primary,
      marginBottom: "8px",
      cursor: "pointer",
    },
    cardDetail: {
      fontSize: "15px",
      color: colors.lightText,
      marginBottom: "5px",
    },
    cardButtons: {
      position: "absolute",
      bottom: "10px",
      right: "10px",
      display: "flex",
      gap: "8px",
      opacity: 0,
      transform: "translateY(10px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    },
    cardButtonsWrapperHover: {
      opacity: 1,
      transform: "translateY(0)",
    },
    cardButton: {
      border: "none",
      borderRadius: "50%",
      width: "38px",
      height: "38px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      fontSize: "18px",
      color: colors.cardBackground,
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      transition: "transform 0.2s ease, background-color 0.2s ease",
    },
    editButton: {
      backgroundColor: colors.primary,
    },
    deleteButton: {
      backgroundColor: colors.accent,
    },
    button: {
      backgroundColor: colors.primary,
      color: "white",
      padding: "12px 25px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "600",
      marginTop: "20px",
      transition: "background-color 0.3s ease, transform 0.2s ease",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      marginBottom: "15px",
      border: `1px solid ${colors.border}`,
      borderRadius: "8px",
      fontSize: "16px",
      boxSizing: "border-box",
      transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: colors.text,
      fontSize: "15px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease-out forwards",
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      padding: "40px",
      borderRadius: "15px",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
      maxWidth: "90%", // Más flexible para el ancho
      width: "fit-content", // Se ajusta al contenido
      position: "relative",
      animation: "slideIn 0.3s ease-out forwards",
      overflowX: "auto", // Permite el scroll horizontal si el contenido es demasiado ancho
      maxHeight: "90vh", // Limita la altura del modal
      overflowY: "auto", // Permite scroll vertical
    },
    closeButton: {
      position: "absolute",
      top: "15px",
      right: "15px",
      background: "none",
      border: "none",
      fontSize: "28px",
      cursor: "pointer",
      color: colors.lightText,
    },
    modalInfo: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "15px 25px",
      marginBottom: "30px",
    },
    modalInfoBlock: {
      display: "flex",
      flexDirection: "column",
    },
    modalInfoTitle: {
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: "5px",
      fontSize: "14px",
    },
    modalInfoText: {
      fontSize: "16px",
      color: colors.text,
    },
    modalActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "15px",
      marginTop: "20px",
    },
    modalActionButton: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      transition: "background-color 0.3s ease, transform 0.2s ease",
    },
    modalEditButton: {
      backgroundColor: colors.primary,
      color: "white",
    },
    modalDeleteButton: {
      backgroundColor: colors.accent,
      color: "white",
    },
    modalPdfButton: {
      backgroundColor: colors.info,
      color: "white",
    },
    historyCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      padding: "15px 20px",
      marginBottom: "15px",
      cursor: "pointer",
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    },
    historyDetailTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
      backgroundColor: colors.cardBackground,
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    historyTableHead: {
      backgroundColor: colors.primary,
      color: "white",
    },
    historyTableCell: {
      padding: "12px 15px",
      textAlign: "left",
      borderBottom: `1px solid ${colors.border}`,
      fontSize: "14px",
    },
  };

  // Función para inyectar estilos CSS globales con hover y animaciones
  const injectStyles = () => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      .card-hover-effect:hover {
        transform: ${style.cardHoverEffect.transform};
        box-shadow: ${style.cardHoverEffect.boxShadow};
      }
      .card-hover-effect:hover .card-buttons-wrapper {
        opacity: ${style.cardButtonsWrapperHover.opacity};
        transform: ${style.cardButtonsWrapperHover.transform};
      }
      .button-hover-effect:hover {
        background-color: ${colors.secondary};
        transform: translateY(-2px);
      }
      .button-hover-effect:active {
        transform: translateY(0);
      }
      .card-button:hover {
          transform: scale(1.1);
      }
      .card-button.edit-button:hover {
        background-color: #3A7BD5; /* Color específico para hover del botón editar */
      }
      .card-button.delete-button:hover {
        background-color: #E05A5A; /* Color específico para hover del botón eliminar */
      }
      .card-button.pdf-button:hover {
        background-color: #1976D2; /* Color específico para hover del botón PDF */
      }
      .history-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
      }
      .modal-action-button:hover {
        transform: scale(1.02);
      }
      .modal-edit-button:hover {
          background-color: #3A7BD5;
      }
      .modal-delete-button:hover {
          background-color: #E05A5A;
      }
      .modal-pdf-button:hover {
          background-color: #1976D2;
      }
      .card-name-hover:hover {
        text-decoration: underline;
      }
      .input:focus {
        border-color: ${colors.primary};
        box-shadow: 0 0 0 3px ${colors.primary}30;
        outline: none;
      }
      .close-button:hover {
        color: ${colors.accent};
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);
  };

  // Llama a injectStyles una sola vez al montar el componente
  useEffect(() => {
    injectStyles();
  }, []);

  // --- Estados del Componente ---
  const [activeTab, setActiveTab] = useState("INFO"); // Pestaña activa
  const [personalEducativo, setPersonalEducativo] = useState([]); // Lista de docentes/personal
  const [loading, setLoading] = useState(true); // Estado de carga

  // Estados para la pestaña "Registrar Personal"
  const [registroFormData, setRegistroFormData] = useState({
    apellidos: "",
    nombres: "",
    dni: "",
    direccion: "",
    nacimiento: "",
    cargo: "",
    ingreso: "",
    telefono: "",
    email: "",
    aula: "",
    observaciones: "",
    salarioBase: "", // Nuevo campo para el salario base
    foto: null, // File object for upload
    fotoPath: "", // Path/URL from Firebase Storage
  });
  const [previewURL, setPreviewURL] = useState(null); // Previsualización de la foto
  const [isEditingRegistro, setIsEditingRegistro] = useState(false); // Modo edición
  const [editRegistroFormData, setEditRegistroFormData] = useState(null); // Datos originales en edición
  const fileInputRef = useRef(null); // Referencia al input de archivo

  // Estado para el modal de detalles del docente
  const [modalDocente, setModalDocente] = useState(null);

  // Estados para la pestaña de Permisos/Asistencia
  const [permisoForm, setPermisoForm] = useState({
    dni: "",
    mes: new Date().toLocaleString("es-ES", { month: "long" }),
    fecha: "",
    tipo: "", // Nuevo: Permiso, Falta, Tardanza
    detalle: "",
  });
  const [permisos, setPermisos] = useState({}); // { dni: [{ fecha, detalle, mes, tipo }] }

  // Estados para la pestaña de Adelantos
  const [adelantoForm, setAdelantoForm] = useState({
    dni: "",
    fechaAdelanto: "",
    montoAdelanto: "",
    mesAplicacion: new Date().toLocaleString("es-ES", { month: "long" }),
    motivo: "",
  });
  const [adelantos, setAdelantos] = useState([]); // [{ dni, fechaAdelanto, montoAdelanto, mesAplicacion, motivo }]

  // Estados para la pestaña de Pagos
  const [pagoForm, setPagoForm] = useState({
    dni: "",
    mes: "", // Se inicializará dinámicamente
    monto: "", // Se autocompletará
    descuentoAdicional: "", // Descuento manual, no adelanto
    motivoDescuentoAdicional: "",
    gratificacion: "", // Monto de gratificación
    incluirGratificacion: false, // Checkbox para gratificación
    fechaPago: "",
    medioPago: "Efectivo",
  });
  const [pagosProfesores, setPagosProfesores] = useState([]); // [{ dni, mes, monto, fechaPago, descuentoAdicional, motivoDescuentoAdicional, gratificacion, medioPago }]
  const [showPagoHistoryModal, setShowPagoHistoryModal] = useState(false);
  const [selectedDocentePagoHistory, setSelectedDocentePagoHistory] =
    useState(null);
  const [mesesDisponiblesPago, setMesesDisponiblesPago] = useState([]); // Meses que aún no se han pagado para el docente seleccionado

  const today = new Date().toISOString().split("T")[0]; // Para establecer el día máximo en los inputs de fecha
  const mesesDelAnio = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  // --- Carga inicial de datos desde Firebase ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar Personal Educativo
        const personalSnapshot = await getDocs(
          collection(db, "PersonalEducativo")
        );
        const personalData = personalSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPersonalEducativo(personalData);

        // Cargar Permisos
        const permisosSnapshot = await getDocs(collection(db, "permisos"));
        const permisosData = {};
        permisosSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (!permisosData[data.dni]) {
            permisosData[data.dni] = [];
          }
          permisosData[data.dni].push(data);
        });
        setPermisos(permisosData);

        // Cargar Adelantos
        const adelantosSnapshot = await getDocs(collection(db, "adelantos"));
        const adelantosData = adelantosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAdelantos(adelantosData);

        // Cargar Pagos Profesores
        const pagosSnapshot = await getDocs(collection(db, "pagosProfesores"));
        const pagosProfesoresData = pagosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPagosProfesores(pagosProfesoresData);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        Swal.fire(
          "Error",
          "Hubo un error al cargar la información. Intenta de nuevo.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hook para cerrar el modal con ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setModalDocente(null);
        setShowPagoHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);


  // --- Handlers de Formulario de Registro de Personal ---
  const handleRegistroFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto" && files && files[0]) {
      const file = files[0];
      setRegistroFormData((prev) => ({ ...prev, foto: file }));
      setPreviewURL(URL.createObjectURL(file));
    } else {
      setRegistroFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Función para subir imagen a Firebase Storage
  const uploadImage = async (file) => {
    if (!file) return null;
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `personal_fotos/${uniqueFileName}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return { url: downloadURL, path: storageRef.fullPath };
    } catch (error) {
      console.error("Error al subir la imagen a Storage:", error);
      Swal.fire("Error", "No se pudo subir la foto.", "error");
      return null;
    }
  };

  // Función para eliminar imagen de Storage
  const deleteImage = async (filePath) => {
    if (!filePath) return;
    try {
      const imageRef = ref(storage, filePath);
      await deleteObject(imageRef);
      console.log("Imagen eliminada de Storage:", filePath);
    } catch (error) {
      console.error("Error al eliminar imagen de Storage:", error);
    }
  };

  const handleSubmitRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !registroFormData.apellidos ||
      !registroFormData.nombres ||
      !registroFormData.dni ||
      !registroFormData.cargo ||
      !registroFormData.ingreso ||
      !registroFormData.aula ||
      !registroFormData.salarioBase
    ) {
      Swal.fire(
        "Campos Incompletos",
        "Por favor, rellena todos los campos obligatorios (*).",
        "warning"
      );
      setLoading(false);
      return;
    }

    try {
      let photoURL = registroFormData.foto; // Usar la URL existente si no se cambia la foto
      let photoStoragePath = registroFormData.fotoPath;

      // Si se seleccionó un nuevo archivo de foto
      if (registroFormData.foto && typeof registroFormData.foto !== "string") {
        // Si hay una foto anterior, eliminarla de Storage
        if (isEditingRegistro && editRegistroFormData?.fotoPath) {
          await deleteImage(editRegistroFormData.fotoPath);
        }
        const uploadResult = await uploadImage(registroFormData.foto);
        if (uploadResult) {
          photoURL = uploadResult.url;
          photoStoragePath = uploadResult.path;
        } else {
          setLoading(false);
          return;
        }
      } else if (
        isEditingRegistro &&
        registroFormData.foto === null &&
        editRegistroFormData?.fotoPath
      ) {
        // Si se eliminó la foto en edición
        await deleteImage(editRegistroFormData.fotoPath);
        photoURL = "";
        photoStoragePath = "";
      }
      // Si la foto es un string (URL existente) y no se cambió, no hacer nada

      const personalData = {
        ...registroFormData,
        foto: photoURL,
        fotoPath: photoStoragePath,
        salarioBase: parseFloat(registroFormData.salarioBase), // Convertir a número
      };

      delete personalData.fotoFile; // Asegurarse de no guardar el objeto File

      if (isEditingRegistro) {
        const personalRef = doc(db, "PersonalEducativo", editRegistroFormData.id);
        await updateDoc(personalRef, personalData);
        setPersonalEducativo((prev) =>
          prev.map((p) =>
            p.id === editRegistroFormData.id ? { id: p.id, ...personalData } : p
          )
        );
        Swal.fire(
          "¡Actualizado!",
          "Personal actualizado con éxito.",
          "success"
        );
      } else {
        const docRef = await addDoc(
          collection(db, "PersonalEducativo"),
          personalData
        );
        setPersonalEducativo((prev) => [
          ...prev,
          { id: docRef.id, ...personalData },
        ]);
        Swal.fire(
          "¡Registrado!",
          "Personal registrado con éxito.",
          "success"
        );
      }

      // Resetear formulario
      setRegistroFormData({
        apellidos: "",
        nombres: "",
        dni: "",
        direccion: "",
        nacimiento: "",
        cargo: "",
        ingreso: "",
        telefono: "",
        email: "",
        aula: "",
        observaciones: "",
        salarioBase: "",
        foto: null,
        fotoPath: "",
      });
      setPreviewURL(null);
      setIsEditingRegistro(false);
      setEditRegistroFormData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error al guardar personal:", error);
      Swal.fire(
        "Error",
        `Hubo un error al ${isEditingRegistro ? "actualizar" : "registrar"} el personal.`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (personal) => {
    setActiveTab("REGISTRAR_PERSONAL"); // Cambiar a la pestaña de registro para editar
    setIsEditingRegistro(true);
    setEditRegistroFormData(personal);
    setRegistroFormData({
      apellidos: personal.apellidos || "",
      nombres: personal.nombres || "",
      dni: personal.dni || "",
      direccion: personal.direccion || "",
      nacimiento: personal.nacimiento || "",
      cargo: personal.cargo || "",
      ingreso: personal.ingreso || "",
      telefono: personal.telefono || "",
      email: personal.email || "",
      aula: personal.aula || "",
      observaciones: personal.observaciones || "",
      salarioBase: personal.salarioBase || "",
      foto: personal.foto || null,
      fotoPath: personal.fotoPath || "",
    });
    setPreviewURL(personal.foto || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeletePersonal = async (id, fotoPath) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto! Se eliminará el personal y sus registros asociados (permisos, adelantos, pagos).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: colors.accent,
      cancelButtonColor: colors.lightText,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          // Eliminar foto de Storage si existe
          if (fotoPath) {
            await deleteImage(fotoPath);
          }

          // Eliminar el documento de personal
          await deleteDoc(doc(db, "PersonalEducativo", id));

          // Eliminar permisos asociados
          const qPermisos = query(collection(db, "permisos"), where("dni", "==", personalEducativo.find(p => p.id === id)?.dni));
          const permisosToDelete = await getDocs(qPermisos);
          permisosToDelete.forEach(async (d) => await deleteDoc(doc(db, "permisos", d.id)));

          // Eliminar adelantos asociados
          const qAdelantos = query(collection(db, "adelantos"), where("dni", "==", personalEducativo.find(p => p.id === id)?.dni));
          const adelantosToDelete = await getDocs(qAdelantos);
          adelantosToDelete.forEach(async (d) => await deleteDoc(doc(db, "adelantos", d.id)));

          // Eliminar pagos asociados
          const qPagos = query(collection(db, "pagosProfesores"), where("dni", "==", personalEducativo.find(p => p.id === id)?.dni));
          const pagosToDelete = await getDocs(qPagos);
          pagosToDelete.forEach(async (d) => await deleteDoc(doc(db, "pagosProfesores", d.id)));


          setPersonalEducativo((prev) => prev.filter((p) => p.id !== id));
          // Actualizar estados de permisos, adelantos y pagos para reflejar la eliminación
          const deletedDNI = personalEducativo.find(p => p.id === id)?.dni;
          if (deletedDNI) {
            setPermisos(prev => {
              const newPermisos = { ...prev };
              delete newPermisos[deletedDNI];
              return newPermisos;
            });
            setAdelantos(prev => prev.filter(a => a.dni !== deletedDNI));
            setPagosProfesores(prev => prev.filter(p => p.dni !== deletedDNI));
          }


          Swal.fire("¡Eliminado!", "El personal ha sido eliminado junto con sus registros.", "success");
        } catch (error) {
              console.error("Error al eliminar personal:", error);
              Swal.fire(
                  "Error",
                  "Hubo un error al eliminar el personal y/o sus registros asociados. Por favor, verifica la consola para más detalles.",
                  "error"
              );
          } finally {
              setLoading(false);
          }
      }
    });
  };

  // --- Handlers de Permisos/Asistencia ---
  const handlePermisoChange = (e) => {
    const { name, value } = e.target;
    setPermisoForm((prev) => ({ ...prev, [name]: value }));
  };

  const registrarPermiso = async () => {
    if (
      !permisoForm.dni ||
      !permisoForm.fecha ||
      !permisoForm.tipo ||
      !permisoForm.detalle
    ) {
      Swal.fire(
        "Campos Incompletos",
        "Por favor, selecciona un docente, fecha, tipo y detalle del permiso/asistencia.",
        "warning"
      );
      return;
    }

    try {
      await addDoc(collection(db, "permisos"), permisoForm);

      setPermisos((prev) => {
        const newPermisos = { ...prev };
        if (!newPermisos[permisoForm.dni]) {
          newPermisos[permisoForm.dni] = [];
        }
        newPermisos[permisoForm.dni].push(permisoForm);
        return newPermisos;
      });

      Swal.fire("¡Éxito!", "Registro de asistencia/permiso guardado correctamente.", "success");
      setPermisoForm((prev) => ({ ...prev, fecha: "", tipo: "", detalle: "" }));
    } catch (error) {
      console.error("Error al registrar permiso:", error);
      Swal.fire(
        "Error",
        "Hubo un error al registrar el permiso/asistencia.",
        "error"
      );
    }
  };

  // --- Handlers de Adelantos ---
  const handleAdelantoChange = (e) => {
    const { name, value } = e.target;
    setAdelantoForm((prev) => ({ ...prev, [name]: value }));
  };

  const registrarAdelanto = async () => {
    if (
      !adelantoForm.dni ||
      !adelantoForm.fechaAdelanto ||
      !adelantoForm.montoAdelanto ||
      !adelantoForm.mesAplicacion ||
      !adelantoForm.motivo
    ) {
      Swal.fire(
        "Campos Incompletos",
        "Por favor, completa todos los campos para registrar el adelanto.",
        "warning"
      );
      return;
    }

    try {
      const adelantoData = {
        ...adelantoForm,
        montoAdelanto: parseFloat(adelantoForm.montoAdelanto),
      };
      await addDoc(collection(db, "adelantos"), adelantoData);

      setAdelantos((prev) => [...prev, adelantoData]);

      Swal.fire("¡Éxito!", "Adelanto registrado correctamente.", "success");
      setAdelantoForm({
        dni: "",
        fechaAdelanto: "",
        montoAdelanto: "",
        mesAplicacion: new Date().toLocaleString("es-ES", { month: "long" }),
        motivo: "",
      });
    } catch (error) {
      console.error("Error al registrar adelanto:", error);
      Swal.fire("Error", "Hubo un error al registrar el adelanto.", "error");
    }
  };

  // --- Handlers de Pagos ---
  const handlePagoFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPagoForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Efecto para autocompletar monto y actualizar meses disponibles al seleccionar docente
 useEffect(() => {
  if (pagoForm.dni) {
    const selectedDocente = personalEducativo.find(
      (p) => p.dni === pagoForm.dni
    );
    if (selectedDocente) {
      // ✅ Autocompletar salario base pero sin actualizarlo
      setPagoForm((prev) => ({
        ...prev,
        monto: selectedDocente.salarioBase || "",
      }));

      // Calcular meses disponibles
      const mesesPagadosDocente = pagosProfesores
        .filter((p) => p.dni === pagoForm.dni)
        .map((p) => p.mes);

      const mesesFiltrados = mesesDelAnio.slice(2, 12);
      const disponibles = mesesFiltrados.filter(
        (mes) => !mesesPagadosDocente.includes(mes)
      );
      setMesesDisponiblesPago(disponibles);
    }
  } else {
    setPagoForm((prev) => ({ ...prev, monto: "", mes: "" }));
    setMesesDisponiblesPago([]);
  }
}, [pagoForm.dni, personalEducativo, pagosProfesores]);

  // Efecto para recalcular monto final al cambiar mes, gratificación o descuentos
const calcularMontoFinal = () => {
  const montoBase = parseFloat(pagoForm.monto || 0); // Asegúrate de que esto se obtenga correctamente
  const gratificacion = pagoForm.incluirGratificacion ? parseFloat(pagoForm.gratificacion || 0) : 0;
  const descuentoAdicional = parseFloat(pagoForm.descuentoAdicional || 0);

  // Sumar todos los adelantos del mes de aplicación para el DNI seleccionado
  const adelantosMes = adelantos
    .filter(
      (a) => a.dni === pagoForm.dni && a.mesAplicacion === pagoForm.mes
    )
    .reduce((sum, a) => sum + parseFloat(a.montoAdelanto || 0), 0);

  let total = montoBase + gratificacion - adelantosMes - descuentoAdicional;

  // Asegúrate de que el total no sea negativo si los descuentos superan los ingresos
  return Math.max(0, total);
};
  const registrarPago = async () => {
    if (
      !pagoForm.dni ||
      !pagoForm.mes ||
      !pagoForm.monto || // monto ya viene del salario base
      !pagoForm.fechaPago ||
      !pagoForm.medioPago
    ) {
      Swal.fire(
        "Campos Incompletos",
        "Por favor, completa todos los campos obligatorios para el pago.",
        "warning"
      );
      return;
    }

    // Verificar si el mes ya fue pagado para este docente
    const mesYaPagado = pagosProfesores.some(
      (p) => p.dni === pagoForm.dni && p.mes === pagoForm.mes
    );
    if (mesYaPagado) {
      Swal.fire(
        "Pago Duplicado",
        `El pago para ${pagoForm.mes} ya ha sido registrado para este docente.`,
        "error"
      );
      return;
    }

    try {
      const montoFinalCalculado = calcularMontoFinal();

      const pagoData = {
        dni: pagoForm.dni,
        mes: pagoForm.mes,
        montoOriginal: parseFloat(pagoForm.monto), // Salario base
        montoFinalPagado: montoFinalCalculado, // Monto después de descuentos/gratificación
        fechaPago: pagoForm.fechaPago,
        descuentoAdicional: parseFloat(pagoForm.descuentoAdicional || 0),
        motivoDescuentoAdicional: pagoForm.motivoDescuentoAdicional || "",
        gratificacion:
          pagoForm.incluirGratificacion &&
          (pagoForm.mes === "Julio" || pagoForm.mes === "Diciembre")
            ? parseFloat(pagoForm.gratificacion || 0)
            : 0,
        medioPago: pagoForm.medioPago,
      };

      await addDoc(collection(db, "pagosProfesores"), pagoData);

      setPagosProfesores((prev) => [...prev, pagoData]); // Actualizar estado local

      Swal.fire("¡Éxito!", "Pago registrado correctamente.", "success");
      // Resetear formulario de pago
      setPagoForm({
        dni: "",
        mes: "",
        monto: "",
        descuentoAdicional: "",
        motivoDescuentoAdicional: "",
        gratificacion: "",
        incluirGratificacion: false,
        fechaPago: "",
        medioPago: "Efectivo",
      });
    } catch (error) {
      console.error("Error al registrar pago:", error);
      Swal.fire("Error", "Hubo un error al registrar el pago.", "error");
    }
  };

  // --- Generación de PDF (Ficha de Personal - Una Columna) ---
  const handleGeneratePdf = async (personal) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20; // Margen uniforme
    let y = margin; // Posición inicial
    const contentWidth = pageWidth - 2 * margin; // Ancho disponible para el contenido

    // --- Título Principal ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(colors.primary);
    doc.text("FICHA DE PERSONAL", pageWidth / 2, y + 10, { align: "center" });
    y += 25; // Espacio después del título principal

    // Colores y fuentes para el diseño
    const sectionTitleColor = colors.primary;
    const infoKeyColor = colors.text;
    const infoValueColor = colors.lightText;
    const separatorColor = colors.border;

    // Posición central para elementos en una sola columna
    const centerAlignX = pageWidth / 2;
    const keyX = margin; // Posición X para la etiqueta de la clave
    const valueX = margin + 30; // Posición X para el valor del dato (con sangría)
    const lineHeight = 7; // Espaciado vertical entre líneas de información

    // --- Sección de Foto y Nombre ---
    const photoSize = 45;
    let photoX = centerAlignX - (photoSize / 2);
    let photoY = y;

    if (personal.foto) {
        try {
            const img = new Image();
            img.src = personal.foto;
            await new Promise((resolve) => {
                img.onload = () => {
                    doc.addImage(img, "JPEG", photoX, photoY, photoSize, photoSize, undefined, 'FAST');
                    resolve();
                };
                img.onerror = () => {
                    console.warn("No se pudo cargar la imagen para PDF:", personal.foto);
                    // Dibuja el círculo con el icono si la imagen falla
                    doc.setFillColor(colors.border);
                    doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 'F');
                    doc.setFontSize(30); // Tamaño del icono
                    doc.setTextColor(colors.lightText);
                    doc.setFont("FontAwesome", "normal"); // Asumiendo que FontAwesome está cargado
                    doc.text("\uf007", photoX + photoSize / 2, photoY + photoSize / 2 + 5, { align: "center" }); // \uf007 es el código para fa-user
                    resolve();
                };
            });
        } catch (e) {
            console.error("Error al añadir imagen al PDF:", e);
            // Dibuja el círculo con el icono si ocurre un error general
            doc.setFillColor(colors.border);
            doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 'F');
            doc.setFontSize(30); // Tamaño del icono
            doc.setTextColor(colors.lightText);
            doc.setFont("FontAwesome", "normal");
            doc.text("\uf007", photoX + photoSize / 2, photoY + photoSize / 2 + 5, { align: "center" });
        }
    } else {
        // Dibuja el círculo con el icono si no hay foto
        doc.setFillColor(colors.border);
        doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 'F');
        doc.setFontSize(30); // Tamaño del icono
        doc.setTextColor(colors.lightText);
        doc.setFont("FontAwesome", "normal"); // Esto requiere que 'jspdf-autotable' o una extensión de jsPDF haya cargado FontAwesome
        doc.text("\uf007", photoX + photoSize / 2, photoY + photoSize / 2 + 5, { align: "center" }); // Código Unicode para el ícono de usuario
    }
    y += photoSize + 10;

    // Nombre y Cargo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(colors.text);
    doc.text(`${personal.nombres} ${personal.apellidos}`, centerAlignX, y, { align: "center" });
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(colors.lightText);
    doc.text(personal.cargo, centerAlignX, y, { align: "center" });
    y += 20; // Espacio después del nombre y cargo

    // --- Sección de Información Personal ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(sectionTitleColor);
    doc.text("Información Personal", margin, y);
    doc.setDrawColor(separatorColor);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 10;
    doc.setFontSize(12);

    // DNI
    doc.setTextColor(infoKeyColor);
    doc.text("DNI:", keyX, y);
    doc.setTextColor(infoValueColor);
    doc.text(personal.dni, valueX, y);
    y += lineHeight;

    // Nacimiento
    doc.setTextColor(infoKeyColor);
    doc.text("Nacimiento:", keyX, y);
    doc.setTextColor(infoValueColor);
    doc.text(personal.nacimiento || "N/A", valueX, y);
    y += lineHeight;

    // Ingreso
    doc.setTextColor(infoKeyColor);
    doc.text("Ingreso:", keyX, y);
    doc.setTextColor(infoValueColor);
    doc.text(personal.ingreso || "N/A", valueX, y);
    y += lineHeight;

    // Aula Asignada
    doc.setTextColor(infoKeyColor);
    doc.text("Aula Asignada:", keyX, y);
    doc.setTextColor(infoValueColor);
    doc.text(personal.aula || "N/A", valueX, y);
    y += 17; // Espacio extra antes de la siguiente sección

    // --- Sección de Contacto ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(sectionTitleColor);
    doc.text("Contacto", margin, y);
    doc.setDrawColor(separatorColor);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 10;
    doc.setFontSize(12);

    // Teléfono
    doc.setTextColor(infoKeyColor);
    doc.text("Teléfono:", keyX, y);
    doc.setTextColor(infoValueColor);
    doc.text(personal.telefono || "N/A", valueX, y);
    y += lineHeight;

    // Email
    doc.setTextColor(infoKeyColor);
    doc.text("Email:", keyX, y);
    doc.setTextColor(infoValueColor);
    doc.text(personal.email || "N/A", valueX, y);
    y += lineHeight;

    // Dirección (con manejo de texto largo)
    doc.setTextColor(infoKeyColor);
    doc.text("Dirección:", keyX, y);
    doc.setTextColor(infoValueColor);
    const addressText = personal.direccion || "N/A";
    const addressLines = doc.splitTextToSize(addressText, contentWidth - (valueX - margin));
    doc.text(addressLines, valueX, y);
    y += (addressLines.length * lineHeight) + 5; // Ajusta 'y' según el número de líneas de la dirección

    // --- Sección de Observaciones ---
    if (personal.observaciones) {
        y += 10; // Espacio entre secciones
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(sectionTitleColor);
        doc.text("Observaciones", margin, y);
        doc.setDrawColor(separatorColor);
        doc.line(margin, y + 2, margin + contentWidth, y + 2);
        y += 10;
        doc.setFontSize(12);
        doc.setTextColor(infoValueColor);
        const obsLines = doc.splitTextToSize(personal.observaciones, contentWidth);
        doc.text(obsLines, margin, y);
        y += (obsLines.length * lineHeight); // Ajusta 'y' según el número de líneas
    }

    // --- Pie de Página ---
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(colors.lightText);
    const footerText = `FICHA ELABORADA POR LA PARTE TÉCNICA DE LA INSTITUCIÓN EDUCATIVA JUANITA MOJICA - ${new Date().toLocaleDateString('es-ES')}`;
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    doc.save(`Ficha_Personal_${personal.nombres}_${personal.apellidos}.pdf`);
    Swal.fire("¡PDF Generado!", "La ficha del personal se ha descargado.", "success");
  };


  // --- Generación de PDF (Historial de Pagos) ---
const handleGeneratePagoHistoryPdf = (personal, pagosDelPersonal) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  if (!pagosDelPersonal || pagosDelPersonal.length === 0) {
    Swal.fire("Sin datos", "No hay pagos registrados para este docente.", "info");
    return;
  }

  // --- Header con datos del docente ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(colors.primary);
  doc.text(
    "INSTITUCIÓN EDUCATIVA PARTICULAR CRISTIANA JUANITA MOJICA",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 8;
  doc.setDrawColor(colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(16);
  doc.setTextColor(colors.primary);
  doc.text("Historial de Pagos", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(colors.text);
  doc.text(`Docente: ${personal.nombres} ${personal.apellidos}`, margin, y);
  y += 6;
  doc.text(`Cargo: ${personal.cargo}`, margin, y);
  y += 6;
  doc.text(`DNI: ${personal.dni}`, margin, y);
  y += 6;
  doc.text(`AULA: ${personal.aula}`, margin, y);
  y += 6;
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, margin, y);
  y += 10;

  // --- Tabla ---
  const headers = [
    "Fecha Pago", "Mes", "Monto Base (S/)", "Gratificación (S/)",
    "Adelantos (S/)", "Desc. Adicional (S/)", "Monto Final (S/)", "Medio Pago"
  ];

  const data = pagosDelPersonal.map((pago) => {
    const adelantosMes = adelantos
      .filter((a) => a.dni === pago.dni && a.mesAplicacion === pago.mes)
      .reduce((sum, a) => sum + parseFloat(a.montoAdelanto || 0), 0);

    return [
      pago.fechaPago,
      pago.mes,
      Number(pago.montoOriginal).toFixed(2),
      pago.gratificacion ? Number(pago.gratificacion).toFixed(2) : "0.00",
      adelantosMes.toFixed(2),
      pago.descuentoAdicional ? Number(pago.descuentoAdicional).toFixed(2) : "0.00",
      Number(pago.montoFinalPagado).toFixed(2),
      pago.medioPago,
    ];
  });

  // ✅ Suma total de montos finales
  const totalMontoFinal = pagosDelPersonal.reduce((sum, pago) => {
    return sum + parseFloat(pago.montoFinalPagado || 0);
  }, 0);

  // Agregar fila total
  data.push([
    "", "", "", "", "", "TOTAL:",
    totalMontoFinal.toFixed(2),
    ""
  ]);

  doc.autoTable({
    startY: y,
    head: [headers],
    body: data,
    theme: "striped",
    headStyles: {
      fillColor: colors.primary,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
    },
    margin: { left: margin, right: margin },
  });

  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Pie de página con firmas ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // Firma docente (izquierda)
  doc.text("    ______________________________", margin, pageHeight - 30);
  doc.setFont("helvetica", "bold");
  doc.text("DOCENTE", margin + 40, pageHeight - 25, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`(${personal.nombres} ${personal.apellidos})`, margin + 40, pageHeight - 20, { align: "center" });

  // Firma promotoría (derecha)
  doc.setFont("helvetica", "normal");
  doc.text("______________________________", pageWidth - 90, pageHeight - 30);
  doc.setFont("helvetica", "bold");
  doc.text("PROMOTORÍA", pageWidth - 70, pageHeight - 25);

  // --- Footer texto técnico ---
  const footerText = `FICHA ELABORADA POR LA PARTE TÉCNICA DE LA INSTITUCIÓN EDUCATIVA JUANITA MOJICA - ${new Date().toLocaleDateString('es-ES')}`;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(colors.lightText);
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

  // --- Guardar PDF ---
  doc.save(`Historial_Pagos_${personal.nombres}_${personal.apellidos}.pdf`);

  Swal.fire({
    title: "¡PDF Generado!",
    text: "El historial de pagos se ha descargado.",
    icon: "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });
};

const handleGenerateReporteGeneralPagosPdf = () => {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape para más columnas
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  if (!personalEducativo || personalEducativo.length === 0) {
    Swal.fire("Sin datos", "No hay docentes registrados para generar el reporte.", "info");
    return;
  }

  if (!pagosProfesores || pagosProfesores.length === 0) {
    Swal.fire("Sin datos", "No hay pagos registrados para generar el reporte.", "info");
    return;
  }

  // --- Encabezado ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(colors.primary);
  doc.text(
    "INSTITUCIÓN EDUCATIVA PARTICULAR CRISTIANA JUANITA MOJICA",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 8;
  doc.setFontSize(18);
  doc.setTextColor(colors.primary);
  doc.text("REPORTE GENERAL DE PAGOS", pageWidth / 2, y, { align: "center" });
  y += 8;

  const fechaEmision = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(11);
  doc.setTextColor(colors.text);
  doc.text(`Fecha de Emisión: ${fechaEmision}`, margin, y);
  y += 10;

  // --- Tabla ---
  const meses = [
    "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const headers = ["NOMBRE COMPLETO", ...meses, "TOTAL"];

  const data = personalEducativo.map((docente) => {
    const pagosDocente = pagosProfesores.filter(p => p.dni === docente.dni);

    const montosMensuales = meses.map((mes) => {
      const pagosMes = pagosDocente.filter(p => p.mes.toUpperCase() === mes);
      const totalMes = pagosMes.reduce((sum, p) => sum + parseFloat(p.montoFinalPagado || 0), 0);
      return totalMes.toFixed(2);
    });

    const totalAnual = montosMensuales.reduce((sum, monto) => sum + parseFloat(monto), 0);

    return [
      `${docente.nombres} ${docente.apellidos}`,
      ...montosMensuales,
      totalAnual.toFixed(2)
    ];
  });

  doc.autoTable({
    startY: y,
    head: [headers],
    body: data,
    theme: "grid",
    headStyles: {
      fillColor: colors.primary,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 1,
      overflow: "linebreak",
    },
    margin: { left: margin, right: margin },
  });

  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Footer técnico ---
  const footerText = `REPORTE ELABORADO POR LA PARTE TÉCNICA DE LA INSTITUCIÓN EDUCATIVA JUANITA MOJICA - ${fechaEmision}`;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(colors.lightText);
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });

  // --- Guardar PDF ---
  doc.save(`Reporte_General_Pagos_${new Date().getFullYear()}.pdf`);

  Swal.fire({
    title: "¡PDF Generado!",
    text: "El reporte general de pagos se ha descargado.",
    icon: "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });
};

  return (
    <div style={style.container}>
      <div style={style.tabs}>
        <div
          style={style.tab(activeTab === "INFO")}
          onClick={() => setActiveTab("INFO")}
        >
          <FaInfoCircle style={{ marginRight: "8px" }} />
          Información General
        </div>
        <div
          style={style.tab(activeTab === "PERMISOS")}
          onClick={() => setActiveTab("PERMISOS")}
        >
          <FaCalendarAlt style={{ marginRight: "8px" }} />
          Permisos y Asistencia
        </div>
        <div
          style={style.tab(activeTab === "ADELANTOS")}
          onClick={() => setActiveTab("ADELANTOS")}
        >
          <FaHandHoldingUsd style={{ marginRight: "8px" }} />
          Gestión de Adelantos
        </div>
        <div
          style={style.tab(activeTab === "PAGOS")}
          onClick={() => setActiveTab("PAGOS")}
        >
          <FaMoneyBillWave style={{ marginRight: "8px" }} />
          Gestión de Pagos
        </div>
        <div
          style={style.tab(activeTab === "REGISTRAR_PERSONAL")}
          onClick={() => setActiveTab("REGISTRAR_PERSONAL")}
        >
          <FaUserGraduate style={{ marginRight: "8px" }} />
          Registrar Personal
        </div>
      </div>

      <div style={style.tabContent}>
        {/* --- Pestaña: Información General --- */}
        {activeTab === "INFO" && (
          <div>
            <h2 style={style.sectionTitle}>
              Información General del Personal Educativo
            </h2>
            {loading ? (
              <p>Cargando personal...</p>
            ) : personalEducativo.length === 0 ? (
              <p>No hay personal registrado.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "25px",
                }}
              >
                {personalEducativo.map((personal) => (
                  <div key={personal.id} style={style.card} className="card-hover-effect">
                    {personal.foto ? (
                      <img
                        src={personal.foto}
                        alt={`${personal.nombres} ${personal.apellidos}`}
                        style={style.cardImage}
                      />
                    ) : (
                      <div style={{...style.cardImage, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border, color: colors.lightText, fontSize: '60px'}}>
                          <FaUserCircle />
                      </div>
                    )}
                    <div style={style.cardContent}>
                      <h4
                        style={style.cardName}
                        className="card-name-hover"
                        onClick={() => setModalDocente(personal)}
                      >
                        {personal.nombres} {personal.apellidos}
                      </h4>
                      <p style={style.cardDetail}>DNI: {personal.dni}</p>
                      <p style={style.cardDetail}>Cargo: {personal.cargo}</p>
                      <p style={style.cardDetail}>Aula: {personal.aula}</p>
                    </div>
                    <div style={style.cardButtons} className="card-buttons-wrapper">
                      <button
                        style={{ ...style.cardButton, ...style.editButton }}
                        className="card-button edit-button"
                        onClick={() => handleEditClick(personal)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        style={{ ...style.cardButton, ...style.deleteButton }}
                        className="card-button delete-button"
                        onClick={() => handleDeletePersonal(personal.id, personal.fotoPath)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                      <button
                        style={{ ...style.cardButton, ...style.modalPdfButton }}
                        className="card-button pdf-button"
                        onClick={() => handleGeneratePdf(personal)}
                        title="Generar Ficha PDF"
                      >
                        <FaFilePdf />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- Pestaña: Permisos y Asistencia --- */}
        {activeTab === "PERMISOS" && (
          <div>
            <h2 style={style.sectionTitle}>Gestión de Permisos y Asistencia</h2>
            <div style={{ marginBottom: "30px", padding: "20px", border: `1px solid ${colors.border}`, borderRadius: "10px", backgroundColor: colors.cardBackground }}>
              <h3 style={{ fontSize: "20px", color: colors.primary, marginBottom: "15px" }}>Registrar Nuevo Permiso/Asistencia</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={style.label}>Personal (DNI):</label>
                  <select
                    name="dni"
                    value={permisoForm.dni}
                    onChange={handlePermisoChange}
                    style={style.input}
                    className="input"
                    required
                  >
                    <option value="">Selecciona un personal</option>
                    {personalEducativo.map((p) => (
                      <option key={p.id} value={p.dni}>
                        {p.apellidos}, {p.nombres} ({p.dni})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={style.label}>Tipo de Registro:</label>
                  <select
                    name="tipo"
                    value={permisoForm.tipo}
                    onChange={handlePermisoChange}
                    style={style.input}
                    className="input"
                    required
                  >
                    <option value="">Selecciona tipo</option>
                    <option value="Permiso">Permiso</option>
                    <option value="Falta">Falta</option>
                    <option value="Tardanza">Tardanza</option>
                  </select>
                </div>
                <div>
                  <label style={style.label}>Fecha:</label>
                  <input
                    type="date"
                    name="fecha"
                    value={permisoForm.fecha}
                    onChange={handlePermisoChange}
                    style={style.input}
                    className="input"
                    max={today}
                    required
                  />
                </div>
                <div>
                  <label style={style.label}>Mes:</label>
                  <select
                    name="mes"
                    value={permisoForm.mes}
                    onChange={handlePermisoChange}
                    style={style.input}
                    className="input"
                    required
                  >
                    {mesesDelAnio.map((mes) => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={style.label}>Detalle:</label>
                  <textarea
                    name="detalle"
                    value={permisoForm.detalle}
                    onChange={handlePermisoChange}
                    style={{ ...style.input, minHeight: "60px" }}
                    className="input"
                    placeholder="Ej: Permiso por cita médica, Ausencia injustificada, Tarde 15 min"
                    required
                  ></textarea>
                </div>
              </div>
              <button onClick={registrarPermiso} style={style.button} className="button-hover-effect">
                Registrar Permiso/Asistencia
              </button>
            </div>

            <h3 style={{ fontSize: "20px", color: colors.primary, marginBottom: "15px", marginTop: "40px" }}>Historial de Permisos/Asistencia por Personal</h3>
            {Object.keys(permisos).length === 0 ? (
              <p>No hay registros de permisos o asistencia.</p>
            ) : (
              <div>
                {personalEducativo.map((personal) => (
                  permisos[personal.dni] && permisos[personal.dni].length > 0 && (
                    <div key={personal.dni} style={style.historyCard} className="history-card">
                      <h4 style={{ color: colors.text, marginBottom: "10px" }}>
                        {personal.apellidos}, {personal.nombres} (DNI: {personal.dni})
                      </h4>
                      <table style={style.historyDetailTable}>
                        <thead style={style.historyTableHead}>
                          <tr>
                            <th style={style.historyTableCell}>Fecha</th>
                            <th style={style.historyTableCell}>Mes</th>
                            <th style={style.historyTableCell}>Tipo</th>
                            <th style={style.historyTableCell}>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permisos[personal.dni]
                            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                            .map((permiso, index) => (
                              <tr key={index}>
                                <td style={style.historyTableCell}>{permiso.fecha}</td>
                                <td style={style.historyTableCell}>{permiso.mes}</td>
                                <td style={style.historyTableCell}>{permiso.tipo}</td>
                                <td style={style.historyTableCell}>{permiso.detalle}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- Pestaña: Gestión de Adelantos --- */}
        {activeTab === "ADELANTOS" && (
          <div>
            <h2 style={style.sectionTitle}>Gestión de Adelantos</h2>
            <div style={{ marginBottom: "30px", padding: "20px", border: `1px solid ${colors.border}`, borderRadius: "10px", backgroundColor: colors.cardBackground }}>
              <h3 style={{ fontSize: "20px", color: colors.primary, marginBottom: "15px" }}>Registrar Nuevo Adelanto</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={style.label}>Personal (DNI):</label>
                  <select
                    name="dni"
                    value={adelantoForm.dni}
                    onChange={handleAdelantoChange}
                    style={style.input}
                    className="input"
                    required
                  >
                    <option value="">Selecciona un personal</option>
                    {personalEducativo.map((p) => (
                      <option key={p.id} value={p.dni}>
                        {p.apellidos}, {p.nombres} ({p.dni})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={style.label}>Fecha del Adelanto:</label>
                  <input
                    type="date"
                    name="fechaAdelanto"
                    value={adelantoForm.fechaAdelanto}
                    onChange={handleAdelantoChange}
                    style={style.input}
                    className="input"
                    max={today}
                    required
                  />
                </div>
                <div>
                  <label style={style.label}>Monto del Adelanto (S/):</label>
                  <input
                    type="number"
                    name="montoAdelanto"
                    value={adelantoForm.montoAdelanto}
                    onChange={handleAdelantoChange}
                    style={style.input}
                    className="input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label style={style.label}>Mes de Aplicación (Descuento):</label>
                  <select
                    name="mesAplicacion"
                    value={adelantoForm.mesAplicacion}
                    onChange={handleAdelantoChange}
                    style={style.input}
                    className="input"
                    required
                  >
                    {mesesDelAnio.map((mes) => (
                      <option key={mes} value={mes}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={style.label}>Motivo del Adelanto:</label>
                  <textarea
                    name="motivo"
                    value={adelantoForm.motivo}
                    onChange={handleAdelantoChange}
                    style={{ ...style.input, minHeight: "60px" }}
                    className="input"
                    placeholder="Ej: Emergencia familiar, Necesidad personal"
                    required
                  ></textarea>
                </div>
              </div>
              <button onClick={registrarAdelanto} style={style.button} className="button-hover-effect">
                Registrar Adelanto
              </button>
            </div>

            <h3 style={{ fontSize: "20px", color: colors.primary, marginBottom: "15px", marginTop: "40px" }}>Historial de Adelantos por Personal</h3>
            {adelantos.length === 0 ? (
              <p>No hay adelantos registrados.</p>
            ) : (
              <div>
                {personalEducativo.map((personal) => {
                  const adelantosDelPersonal = adelantos.filter(a => a.dni === personal.dni);
                  return adelantosDelPersonal.length > 0 && (
                    <div key={personal.dni} style={style.historyCard} className="history-card">
                      <h4 style={{ color: colors.text, marginBottom: "10px" }}>
                        {personal.apellidos}, {personal.nombres} (DNI: {personal.dni})
                      </h4>
                      <table style={style.historyDetailTable}>
                        <thead style={style.historyTableHead}>
                          <tr>
                            <th style={style.historyTableCell}>Fecha Adelanto</th>
                            <th style={style.historyTableCell}>Monto (S/)</th>
                            <th style={style.historyTableCell}>Mes Aplicación</th>
                            <th style={style.historyTableCell}>Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adelantosDelPersonal
                            .sort((a, b) => new Date(b.fechaAdelanto) - new Date(a.fechaAdelanto))
                            .map((adelanto, index) => (
                              <tr key={index}>
                                <td style={style.historyTableCell}>{adelanto.fechaAdelanto}</td>
                                <td style={style.historyTableCell}>{Number(adelanto.montoAdelanto).toFixed(2)}</td>
                                <td style={style.historyTableCell}>{adelanto.mesAplicacion}</td>
                                <td style={style.historyTableCell}>{adelanto.motivo}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

{/* --- Pestaña: Gestión de Pagos --- */}
{activeTab === "PAGOS" && (
  <div>
    <h2 style={style.sectionTitle}>Gestión de Pagos</h2>
    <div style={{ marginBottom: "30px", padding: "20px", border: `1px solid ${colors.border}`, borderRadius: "10px", backgroundColor: colors.cardBackground }}>
      <h3 style={{ fontSize: "20px", color: colors.primary, marginBottom: "15px" }}>Registrar Nuevo Pago</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <label style={style.label}>Personal (DNI):</label>
          <select
            name="dni"
            value={pagoForm.dni}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            required
          >
            <option value="">Selecciona un personal</option>
            {personalEducativo.map((p) => (
              <option key={p.id} value={p.dni}>
                {p.apellidos}, {p.nombres} ({p.dni})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={style.label}>Mes Correspondiente:</label>
          <select
            name="mes"
            value={pagoForm.mes}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            required
            disabled={!pagoForm.dni} // Deshabilitar si no hay docente seleccionado
          >
            <option value="">Selecciona un mes</option>
            {mesesDisponiblesPago.map((mes) => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={style.label}>Monto Base (S/):</label>
          <input
            type="number"
            name="monto"
            value={pagoForm.monto}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            step="0.01"
            min="0"
            // ELIMINADO: readOnly // Esto es lo que queremos cambiar
          />
        </div>
        <div>
          <label style={style.label}>Fecha de Pago:</label>
          <input
            type="date"
            name="fechaPago"
            value={pagoForm.fechaPago}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            max={today}
            required
          />
        </div>

        {/* Gratificación en Julio y Diciembre */}
        {(pagoForm.mes === "Julio" || pagoForm.mes === "Diciembre") && (
          <>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
              <input
                type="checkbox"
                name="incluirGratificacion"
                checked={pagoForm.incluirGratificacion}
                onChange={handlePagoFormChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              <label style={style.label}>Incluir Gratificación</label>
            </div>
            <div>
              <label style={style.label}>Monto Gratificación (S/):</label>
              <input
                type="number"
                name="gratificacion"
                value={pagoForm.gratificacion}
                onChange={handlePagoFormChange}
                style={style.input}
                className="input"
                step="0.01"
                min="0"
                disabled={!pagoForm.incluirGratificacion}
              />
            </div>
          </>
        )}

        <div>
          <label style={style.label}>Descuento Adicional (S/):</label>
          <input
            type="number"
            name="descuentoAdicional"
            value={pagoForm.descuentoAdicional}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label style={style.label}>Motivo del Descuento Adicional:</label>
          <input
            type="text"
            name="motivoDescuentoAdicional"
            value={pagoForm.motivoDescuentoAdicional}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            placeholder="Ej: Préstamo, + adelanto"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={style.label}>Medio de Pago:</label>
          <select
            name="medioPago"
            value={pagoForm.medioPago}
            onChange={handlePagoFormChange}
            style={style.input}
            className="input"
            required
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia Bancaria</option>
            <option value="Yape">Yape</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1", textAlign: "right", fontSize: "22px", fontWeight: "bold", color: colors.text }}>
          Monto Final a Pagar: S/ {calcularMontoFinal().toFixed(2)}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
  {/* Botón Registrar Pago */}
  <button
    onClick={registrarPago}
    style={style.button}
    className="button-hover-effect"
  >
    Registrar Pago
  </button>

  {/* 🚀 Botón nuevo: REPORTE GENERAL PDF con icono 📊 */}
  <button
    onClick={handleGenerateReporteGeneralPagosPdf}
    className="button-hover-effect"
    style={{
      ...style.button,
      backgroundColor: colors.success, // Color diferente para destacar
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: "8px", // Espacio entre icono y texto
    }}
  >
    <FaChartBar size={18} /> {/* 📊 Icono */}
    REPORTE GENERAL PDF
  </button>
</div>

    </div>


    {/* Resto del historial de pagos... */}
    <h3 style={{ fontSize: "20px", color: colors.primary, marginBottom: "15px", marginTop: "40px" }}>Historial de Pagos</h3>
    {personalEducativo.length === 0 ? (
      <p>No hay personal registrado para ver el historial de pagos.</p>
    ) : (
      <div>
        {personalEducativo.map((personal) => {
          const pagosDelPersonal = pagosProfesores.filter((p) => p.dni === personal.dni);
          return (
            pagosDelPersonal.length > 0 && (
              <div key={personal.id} style={style.historyCard} className="history-card">
                <h4 style={{ color: colors.text, marginBottom: "10px" }}>
                  {personal.apellidos}, {personal.nombres} (DNI: {personal.dni})
                </h4>
                <button
                  onClick={() => {
                    setSelectedDocentePagoHistory(personal);
                    setShowPagoHistoryModal(true);
                  }}
                  style={{
                    ...style.button,
                    marginTop: "10px",
                    backgroundColor: colors.info,
                    padding: "8px 15px",
                    fontSize: "14px",
                  }}
                  className="button-hover-effect"
                >
                  Ver Historial Completo
                </button>
              </div>
            )
          );
        })}
        {pagosProfesores.length === 0 && <p style={{ textAlign: "center", marginTop: "20px", color: colors.lightText }}>No hay pagos registrados.</p>}
      </div>
    )}
    
  </div>
)}

        {/* Modal de Detalle de Personal */}
        {modalDocente && (
          <div style={style.modalOverlay}>
            <div style={style.modalContent}>
              <button
                onClick={() => setModalDocente(null)}
                style={style.closeButton}
                className="close-button"
              >
                &times;
              </button>
              <h2 style={{ ...style.sectionTitle, textAlign: "center", marginBottom: "20px" }}>
                Detalles del Personal
              </h2>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {modalDocente.foto ? (
                  <img
                    src={modalDocente.foto}
                    alt={`${modalDocente.nombres} ${modalDocente.apellidos}`}
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `4px solid ${colors.secondary}`,
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      backgroundColor: colors.border,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      margin: "0 auto",
                      fontSize: "60px",
                      color: colors.lightText,
                      border: `4px solid ${colors.secondary}`,
                    }}
                  >
                    <FaUserCircle /> {/* Icono de usuario para la foto faltante */}
                  </div>
                )}
                <h3 style={{ fontSize: "24px", color: colors.primary, marginTop: "15px" }}>
                  {modalDocente.nombres} {modalDocente.apellidos}
                </h3>
                <p style={{ fontSize: "16px", color: colors.lightText }}>
                  {modalDocente.cargo}
                </p>
              </div>

              <div style={style.modalInfo}>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>DNI:</span>
                  <span style={style.modalInfoText}>{modalDocente.dni}</span>
                </div>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Fecha de Nacimiento:</span>
                  <span style={style.modalInfoText}>
                    {modalDocente.nacimiento || "N/A"}
                  </span>
                </div>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Dirección:</span>
                  <span style={style.modalInfoText}>
                    {modalDocente.direccion || "N/A"}
                  </span>
                </div>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Fecha de Ingreso:</span>
                  <span style={style.modalInfoText}>{modalDocente.ingreso}</span>
                </div>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Teléfono:</span>
                  <span style={style.modalInfoText}>
                    {modalDocente.telefono || "N/A"}
                  </span>
                </div>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Email:</span>
                  <span style={style.modalInfoText}>
                    {modalDocente.email || "N/A"}
                  </span>
                </div>
                <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Aula Asignada:</span>
                  <span style={style.modalInfoText}>{modalDocente.aula}</span>
                </div>
                {/* Salario Base retirado de la vista previa del PDF */}
                {/* <div style={style.modalInfoBlock}>
                  <span style={style.modalInfoTitle}>Salario Base:</span>
                  <span style={style.modalInfoText}>
                    S/ {modalDocente.salarioBase ? modalDocente.salarioBase.toFixed(2) : "N/A"}
                  </span>
                </div> */}
                <div style={{ ...style.modalInfoBlock, gridColumn: "1 / -1" }}>
                  <span style={style.modalInfoTitle}>Observaciones:</span>
                  <span style={style.modalInfoText}>
                    {modalDocente.observaciones || "Ninguna"}
                  </span>
                </div>
              </div>

              <div style={style.modalActions}>
                <button
                  onClick={() => handleGeneratePdf(modalDocente)}
                  style={{ ...style.modalActionButton, ...style.modalPdfButton }}
                  className="modal-action-button modal-pdf-button"
                >
                  <FaFilePdf style={{ marginRight: "8px" }} />
                  Generar PDF
                </button>
                <button
                  onClick={() => {
                    handleEditClick(modalDocente);
                    setModalDocente(null);
                  }}
                  style={{ ...style.modalActionButton, ...style.modalEditButton }}
                  className="modal-action-button modal-edit-button"
                >
                  <FaEdit style={{ marginRight: "8px" }} />
                  Editar
                </button>
                <button
                  onClick={() => {
                    handleDeletePersonal(modalDocente.id, modalDocente.fotoPath);
                    setModalDocente(null);
                  }}
                  style={{ ...style.modalActionButton, ...style.modalDeleteButton }}
                  className="modal-action-button modal-delete-button"
                >
                  <FaTrash style={{ marginRight: "8px" }} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

{activeTab === "REGISTRAR_PERSONAL" && (
  <div>
    <h2 style={style.sectionTitle}>
      {isEditingRegistro ? "Editar Docente" : "Registro de Nuevo Docente"}
    </h2>

    <form onSubmit={handleSubmitRegistro}>
      <label style={style.label} htmlFor="apellidos">Apellidos *</label>
      <input
        style={style.input}
        id="apellidos"
        name="apellidos"
        type="text"
        value={registroFormData.apellidos}
        onChange={handleRegistroFormChange}
        required
      />

      <label style={style.label} htmlFor="nombres">Nombres *</label>
      <input
        style={style.input}
        id="nombres"
        name="nombres"
        type="text"
        value={registroFormData.nombres}
        onChange={handleRegistroFormChange}
        required
      />

      <label style={style.label} htmlFor="dni">DNI *</label>
      <input
        style={style.input}
        id="dni"
        name="dni"
        type="text"
        inputMode="numeric"
        pattern="\d{8}"
        maxLength={8}
        value={registroFormData.dni}
        onChange={handleRegistroFormChange}
        placeholder="Solo números, 8 dígitos"
        required
        disabled={isEditingRegistro}
      />

      <label style={style.label} htmlFor="direccion">Dirección</label>
      <input
        style={style.input}
        id="direccion"
        name="direccion"
        type="text"
        value={registroFormData.direccion}
        onChange={handleRegistroFormChange}
      />

      <label style={style.label} htmlFor="nacimiento">Fecha de Nacimiento</label>
      <input
        style={style.input}
        id="nacimiento"
        name="nacimiento"
        type="date"
        max={today}
        value={registroFormData.nacimiento}
        onChange={handleRegistroFormChange}
      />

      <label style={style.label} htmlFor="cargo">Cargo *</label>
      <select
        style={style.input}
        id="cargo"
        name="cargo"
        value={registroFormData.cargo}
        onChange={handleRegistroFormChange}
        required
      >
        <option value="">-- Seleccione cargo --</option>
        <option value="Promotor">Promotor</option>
        <option value="Docente Titular">Docente Titular</option>
        <option value="Docente Auxiliar">Docente Auxiliar</option>
        <option value="Directivo">Directivo</option>
        <option value="Personal Servicio">Personal Servicio</option>
        <option value="Administrativo">Administrativo</option>
        <option value="Otro">Otro</option>
      </select>

      <label style={style.label} htmlFor="ingreso">Fecha de Ingreso *</label>
      <input
        style={style.input}
        id="ingreso"
        name="ingreso"
        type="date"
        max={today}
        value={registroFormData.ingreso}
        onChange={handleRegistroFormChange}
        required
      />

      <label style={style.label} htmlFor="telefono">Teléfono</label>
      <input
        style={style.input}
        id="telefono"
        name="telefono"
        type="tel"
        value={registroFormData.telefono}
        onChange={handleRegistroFormChange}
      />

      <label style={style.label} htmlFor="email">E-mail</label>
      <input
        style={style.input}
        id="email"
        name="email"
        type="email"
        value={registroFormData.email}
        onChange={handleRegistroFormChange}
      />

      <label style={style.label} htmlFor="aula">Aula *</label>
      <select
        style={style.input}
        id="aula"
        name="aula"
        value={registroFormData.aula}
        onChange={handleRegistroFormChange}
        required
      >
        <option value="">-- Seleccione Aula* --</option>
        <option value="Inicial 3 Años">Inicial 3 Años</option>
        <option value="Inicial 4 Años">Inicial 4 Años</option>
        <option value="Inicial 5 Años">Inicial 5 Años</option>
        <option value="1° Grado Primaria">1° Grado Primaria</option>
        <option value="2° Grado Primaria">2° Grado Primaria</option>
        <option value="3° Grado Primaria">3° Grado Primaria</option>
        <option value="4° Grado Primaria">4° Grado Primaria</option>
        <option value="5° Grado Primaria">5° Grado Primaria</option>
        <option value="Computación">Computación</option>
        <option value="Música">Música</option>
        <option value="Otro">Otro</option>
      </select>

      <label style={style.label} htmlFor="observaciones">Observaciones</label>
      <textarea
        style={{ ...style.input, height: 60, resize: "vertical" }}
        id="observaciones"
        name="observaciones"
        value={registroFormData.observaciones}
        onChange={handleRegistroFormChange}
      />

      <label style={style.label} htmlFor="foto">Foto</label>
      <input
        style={style.input}
        id="foto"
        name="foto"
        type="file"
        accept="image/*"
        onChange={handleRegistroFormChange}
        ref={fileInputRef}
      />

      {(previewURL || (isEditingRegistro && editRegistroFormData?.foto)) && (
        <img
          src={previewURL || editRegistroFormData.foto}
          alt="Previsualización"
          style={{ maxWidth: "100%", maxHeight: 200, marginBottom: 15, borderRadius: 8, objectFit: "contain" }}
        />
      )}

      <button
        type="submit"
        className="button-hover-effect"
        style={{
          ...style.button,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
        disabled={loading}
      >
        {loading
          ? (isEditingRegistro ? "Actualizando..." : "Registrando...")
          : (isEditingRegistro ? "Guardar Cambios" : "Registrar Docente")}
      </button>

      {isEditingRegistro && (
        <button
          type="button"
          className="button-hover-effect"
          style={{ ...style.button, backgroundColor: colors.lightText, marginLeft: 10 }}
          onClick={() => {
            setIsEditingRegistro(false);
            setEditRegistroFormData(null);
            setRegistroFormData({
              apellidos: "", nombres: "", dni: "", direccion: "", nacimiento: "",
              cargo: "", ingreso: "", telefono: "", email: "", aula: "",
              observaciones: "", salarioBase: "", foto: null, fotoPath: "",
            });
            setPreviewURL(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          Cancelar Edición
        </button>
      )}
    </form>
  </div>
)}


        {/* Modal de Historial de Pagos por Personal */}
        {showPagoHistoryModal && selectedDocentePagoHistory && (
          <div style={style.modalOverlay}>
            <div style={style.modalContent}>
              <button
                onClick={() => setShowPagoHistoryModal(false)}
                style={style.closeButton}
                className="close-button"
              >
                &times;
              </button>
              <h2 style={{ ...style.sectionTitle, textAlign: "center", marginBottom: "20px" }}>
                Historial de Pagos de {selectedDocentePagoHistory.nombres} {selectedDocentePagoHistory.apellidos}
              </h2>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table style={style.historyDetailTable}>
                  <thead style={style.historyTableHead}>
                    <tr>
                      <th style={style.historyTableCell}>Fecha Pago</th>
                      <th style={style.historyTableCell}>Mes</th>
                      <th style={style.historyTableCell}>Monto Base (S/)</th>
                      <th style={style.historyTableCell}>Gratificación (S/)</th>
                      <th style={style.historyTableCell}>Adelantos (S/)</th>
                      <th style={style.historyTableCell}>Desc. Adicional (S/)</th>
                      <th style={style.historyTableCell}>Monto Final (S/)</th>
                      <th style={style.historyTableCell}>Medio Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosProfesores
                      .filter((pago) => pago.dni === selectedDocentePagoHistory.dni)
                      .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))
                      .map((pago, index) => {
                        const adelantosMes = adelantos
                          .filter(
                            (a) => a.dni === pago.dni && a.mesAplicacion === pago.mes
                          )
                          .reduce((sum, a) => sum + parseFloat(a.montoAdelanto || 0), 0);
                        return (
                          <tr key={index}>
                            <td style={style.historyTableCell}>{pago.fechaPago}</td>
                            <td style={style.historyTableCell}>{pago.mes}</td>
                            <td style={style.historyTableCell}>
                              {Number(pago.montoOriginal).toFixed(2)}
                            </td>
                            <td style={style.historyTableCell}>
                              {pago.gratificacion ? Number(pago.gratificacion).toFixed(2) : "0.00"}
                            </td>
                            <td style={style.historyTableCell}>
                              {adelantosMes.toFixed(2)}
                            </td>
                            <td style={style.historyTableCell}>
                              {pago.descuentoAdicional ? Number(pago.descuentoAdicional).toFixed(2) : "0.00"}
                            </td>
                            <td style={style.historyTableCell}>
                              {Number(pago.montoFinalPagado).toFixed(2)}
                            </td>
                            <td style={style.historyTableCell}>{pago.medioPago}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {pagosProfesores.filter((pago) => pago.dni === selectedDocentePagoHistory.dni).length === 0 && (
                  <p style={{ textAlign: "center", marginTop: "20px", color: colors.lightText }}>No hay pagos registrados para este personal.</p>
                )}
              </div>
              <div style={style.modalActions}>
                <button
                  onClick={() =>
                    handleGeneratePagoHistoryPdf(
                      selectedDocentePagoHistory,
                      pagosProfesores.filter((pago) => pago.dni === selectedDocentePagoHistory.dni)
                    )
                  }
                  style={{ ...style.modalActionButton, ...style.modalPdfButton }}
                  className="modal-action-button modal-pdf-button"
                >
                  <FaFilePdf style={{ marginRight: "8px" }} />
                  Generar PDF de Historial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalEducativo;