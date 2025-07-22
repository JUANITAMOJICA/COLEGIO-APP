import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  Timestamp,
  } from "firebase/firestore";
  import { increment } from "firebase/firestore";
import { app } from "../firebase/firebaseConfig";
import { jsPDF } from "jspdf";

export default function GestionPagos() {
  const { alumnoId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore(app);

  const [alumno, setAlumno] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [recibos, setRecibos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [monto, setMonto] = useState("");
  const [tipoPago, setTipoPago] = useState("");
  const [mesPension, setMesPension] = useState("");
  const [descripcionOtros, setDescripcionOtros] = useState("");
  const [medioPago, setMedioPago] = useState("");
  const [numOperacion, setNumOperacion] = useState("");


  useEffect(() => {
  const fetchAlumno = async () => {
    if (!alumnoId) return;

    try {
      const alumnoRef = doc(db, 'alumnos', alumnoId);
      const alumnoSnap = await getDoc(alumnoRef);

      if (alumnoSnap.exists()) {
        setAlumno(alumnoSnap.data());
      } else {
        console.error("Alumno no encontrado");
      }
    } catch (error) {
      console.error("Error al obtener datos del alumno:", error);
    }
  };

  fetchAlumno();
}, [alumnoId]);

  // Estado para filtro por tipo de pago
  const [filtroTipoPago, setFiltroTipoPago] = useState("");
  
  const [filtroTipoRecibo, setFiltroTipoRecibo] = useState("");
  const [busquedaRecibo, setBusquedaRecibo] = useState("");

  const tiposPago = [
    "Matrícula",
    "Cuota Aniversario",
    "Agenda",
    "Otros",
    "Pensión",
  ];

  const mediosPago = ["Efectivo", "Transferencia", "Yape", "Plin"];

  const meses = [
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Setiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  // Contraseña para confirmar eliminación (puedes cambiarla)
  const PASSWORD_ELIMINACION = "230990";

  // --- Carga pagos ---
  const cargarPagos = async () => {
    const pagosRef = collection(db, "pagos");
    const q = query(pagosRef, where("alumnoId", "==", alumnoId));
    const querySnapshot = await getDocs(q);
    const pagosLista = [];
    querySnapshot.forEach((doc) => {
      pagosLista.push({ id: doc.id, ...doc.data() });
    });
    setPagos(pagosLista);
  };

  // --- Carga recibos ---
  const cargarRecibos = async () => {
    const recibosRef = collection(db, "recibos");
    const q = query(recibosRef, where("alumnoId", "==", alumnoId));
    const querySnapshot = await getDocs(q);
    const recibosLista = [];
    querySnapshot.forEach((doc) => {
      recibosLista.push({ id: doc.id, ...doc.data() });
    });
    setRecibos(recibosLista);
  };

  useEffect(() => {
    async function fetchAlumno() {
      try {
        const alumnoRef = doc(db, "alumnos", alumnoId);
        const alumnoSnap = await getDoc(alumnoRef);
        if (alumnoSnap.exists()) {
          setAlumno(alumnoSnap.data());
        } else {
          alert("Alumno no encontrado");
          navigate(-1);
        }
      } catch (error) {
        console.error("Error al obtener el alumno:", error);
        navigate(-1);
      }
    }

    fetchAlumno();
  }, [alumnoId, db, navigate]);

  useEffect(() => {
    async function fetchDatos() {
      await cargarPagos();
      await cargarRecibos();
      setLoading(false);
    }
    fetchDatos();
  }, [alumnoId, db]);

  const mesesPagados = pagos
    .filter((p) => p.tipoPago === "Pensión" && p.mesPension)
    .map((p) => p.mesPension);

  const registrarPago = async (e) => {
  e.preventDefault();

  if (!monto || !tipoPago) {
    alert("Debe ingresar monto y seleccionar tipo de pago");
    return;
  }

  if (tipoPago === "Pensión" && !mesPension) {
    alert("Debe seleccionar un mes para la pensión");
    return;
  }

  if (tipoPago === "Otros" && !descripcionOtros.trim()) {
    alert("Debe ingresar una descripción para 'Otros'");
    return;
  }

  if (!medioPago) {
    alert("Debe seleccionar un medio de pago");
    return;
  }

  if (
    (medioPago === "Transferencia" ||
      medioPago === "Yape" ||
      medioPago === "Plin") &&
    !numOperacion.trim()
  ) {
    alert("Debe ingresar el N° de Operación");
    return;
  }

  const yaExiste = pagos.some((p) => {
    if (tipoPago !== "Otros") {
      return (
        p.tipoPago === tipoPago &&
        (tipoPago !== "Pensión" || p.mesPension === mesPension)
      );
    } else {
      return (
        p.tipoPago === "Otros" &&
        p.descripcionOtros?.toLowerCase().trim() ===
          descripcionOtros.toLowerCase().trim()
      );
    }
  });

  if (yaExiste) {
    alert(
      tipoPago === "Otros"
        ? "Ya existe un pago 'Otros' con esa misma descripción."
        : "Este tipo de pago ya ha sido registrado para este alumno."
    );
    return;
  }

  try {
    // Paso 1: Obtener número de recibo actual
    const contadorRef = doc(db, "contadores", "recibos");
    const contadorSnap = await getDoc(contadorRef);
    if (!contadorSnap.exists()) {
      alert("Error: el contador de recibos no está inicializado.");
      return;
    }
    const numeroReciboActual = contadorSnap.data().numero;

    // Paso 2: Registrar el pago en la colección "pagos"
    const pagoDocRef = await addDoc(collection(db, "pagos"), {
      alumnoId,
      monto: parseFloat(monto),
      tipoPago,
      mesPension: tipoPago === "Pensión" ? mesPension : null,
      descripcionOtros: tipoPago === "Otros" ? descripcionOtros.trim() : null,
      medioPago,
      numOperacion: numOperacion.trim() || null,
      fechaPago: Timestamp.now(),
    });

    // Paso 3: Registrar el recibo con número único
    await addDoc(collection(db, "recibos"), {
      alumnoId,
      monto: parseFloat(monto),
      tipoPago,
      mesPension: tipoPago === "Pensión" ? mesPension : null,
      descripcionOtros: tipoPago === "Otros" ? descripcionOtros.trim() : null,
      medioPago,
      numOperacion: numOperacion.trim() || null,
      fechaPago: Timestamp.now(),
      pagoId: pagoDocRef.id,
      numeroRecibo: numeroReciboActual, // << Aquí guardamos el número de recibo
    });

    // Paso 4: Incrementar el contador en 1
    await updateDoc(contadorRef, {
      numero: increment(1),
    });

    // Limpiar formulario
    setMonto("");
    setTipoPago("");
    setMesPension("");
    setDescripcionOtros("");
    setMedioPago("");
    setNumOperacion("");

    alert(`Pago registrado exitosamente. N° Recibo: ${numeroReciboActual}`);
    await cargarPagos();
    await cargarRecibos();
  } catch (error) {
    console.error("Error al registrar pago:", error);
    alert("Error al registrar pago");
  }
};

  const eliminarPago = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este pago?")) return;

    // Solicitar contraseña
    const password = window.prompt(
      "Ingrese la contraseña para confirmar la eliminación:"
    );

    if (password !== PASSWORD_ELIMINACION) {
      alert("Contraseña incorrecta. No se eliminó el pago.");
      return;
    }

    try {
      // Obtener datos del pago antes de eliminar
      const pagoRef = doc(db, "pagos", id);
      const pagoSnap = await getDoc(pagoRef);
      if (!pagoSnap.exists()) {
        alert("El pago no existe o ya fue eliminado.");
        return;
      }
      const pagoData = pagoSnap.data();

      // Agregar al historial de pagos eliminados
      await addDoc(collection(db, "pagos_eliminados"), {
        ...pagoData,
        alumnoId,
        eliminadoEn: Timestamp.now(),
      });

      // Eliminar pago
      await deleteDoc(pagoRef);

      alert("Pago eliminado correctamente y registrado en historial.");

      await cargarPagos();
      await cargarRecibos();
    } catch (error) {
      console.error("Error al eliminar pago:", error);
      alert("Error al eliminar pago");
    }
  };

  const numeroALetras = (num) => {
  // Versión simple, puedes reemplazarla con una más completa si deseas
  return `SON: ${num.toFixed(2)} NUEVOS SOLES`;
};

const generarPDFRecibo = async (recibo) => {
  if (!recibo || !alumno) {
    console.error("Faltan datos de recibo o alumno");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Colores y estilos
  const colors = {
    primary: "#1A73E8",
    darkText: "#222222",
    grayText: "#666666",
    lightGray: "#F7F9FC",
    border: "#E0E0E0",
  };

  // Cargar logo
  const loadImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => resolve(img);
    });

  const logoUrl = "https://i.imgur.com/e6wa0LQ.png";
  const logo = await loadImage(logoUrl);

  const marginLeft = 40;
  const marginRight = 555;
  let cursorY = 50;

  // Logo
  doc.addImage(logo, "PNG", marginLeft, cursorY, 50, 50);

  // Encabezado
  doc.setFontSize(12);
  doc.setTextColor(colors.darkText);
  doc.setFont("helvetica", "bold");
  doc.text("Institución Educativa Particular", marginLeft + 70, cursorY + 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Juanita Mojica", marginLeft + 70, cursorY + 28);
  doc.text("R.D.R. N° 000616-16", marginLeft + 70, cursorY + 42);
  doc.text("Centro Poblado Victor Raúl Haya de la Torre Mz 57 - Lote 01 - HUANCHACO", marginLeft + 70, cursorY + 56);

  // Línea separadora
  cursorY += 70;
  doc.setDrawColor(colors.border);
  doc.setLineWidth(1);
  doc.line(marginLeft, cursorY, marginRight, cursorY);

  // Título
  cursorY += 25;
  doc.setFontSize(16);
  doc.setTextColor(colors.primary);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE PAGO", 297.5, cursorY, null, null, "center");

  // Datos
  const alumnoNombre = `${alumno?.nombre || "-"} ${alumno?.apellido || "-"}`;
  const grado = alumno?.grado || "-";
  const fecha = recibo?.fechaPago?.toDate?.()?.toLocaleDateString?.() || "-";
  const tipo = recibo?.tipoPago || "-";
  const medio = recibo?.medioPago || "-";
  const descripcion =
    tipo === "Pensión"
      ? `Mes: ${recibo.mesPension}`
      : tipo === "Otros"
      ? recibo.descripcionOtros
      : "-";
  const operacion = recibo?.numOperacion || "-";
  const monto = `S/. ${recibo?.monto?.toFixed(2) || "0.00"}`;
  const montoTexto = numeroALetras(recibo?.monto || 0);

  const info = [
    ["N° de Recibo", recibo.numeroRecibo || "-"],
    ["Fecha", fecha],
    ["Alumno", alumnoNombre],
    ["Grado", grado],
    ["Tipo de Pago", tipo],
    ["Descripción", descripcion],
    ["Medio de Pago", medio],
    ["N° de Operación", operacion],
    ["Monto", monto],
    ["Monto en Letras", montoTexto],
  ];

  // Mostrar tabla
  const labelX = marginLeft + 10;
  const valueX = marginLeft + 140;
  const rowHeight = 22;
  let tableY = cursorY + 40;

  info.forEach(([label, value], i) => {
    const y = tableY + i * rowHeight;
    if (i % 2 === 0) {
      doc.setFillColor(colors.lightGray);
      doc.rect(marginLeft, y - 14, marginRight - marginLeft, rowHeight, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.grayText);
    doc.setFontSize(10);
    doc.text(`${label}:`, labelX, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.darkText);
    doc.text(`${value}`, valueX, y);
  });

  // Firma
  const firmaY = tableY + info.length * rowHeight + 30;
  const lineStartX = marginRight - 130;
  const lineEndX = marginRight - 20;
  doc.setDrawColor(colors.darkText);
  doc.setLineWidth(0.8);
  doc.line(lineStartX, firmaY, lineEndX, firmaY);
  doc.setFontSize(9);
  doc.setTextColor(colors.grayText);
  doc.text("Sello de Conformidad", (lineStartX + lineEndX) / 2, firmaY + 14, null, null, "center");

  // Nota
  doc.setFontSize(8);
  doc.setTextColor(colors.grayText);
  doc.text(
    "Este documento no reemplaza comprobante tributario. Es solo constancia de pago escolar.",
    297.5,
    firmaY + 30,
    null,
    null,
    "center"
  );

  // Guardar PDF
  const nombreAlumno = `${alumno?.nombre || "Alumno"}_${alumno?.apellido || ""}`.replace(/\s+/g, "_");
  const numeroRecibo = recibo?.numeroRecibo || recibo?.id || "0000";
  doc.save(`Recibo_${nombreAlumno}_R${numeroRecibo}.pdf`);
};
const generarPDFsDobles = async (recibo) => {
  const leyendas = ["Copia para el colegio", "Copia para el apoderado"];

  for (let i = 0; i < 2; i++) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const colors = {
      primary: "#1A73E8",
      darkText: "#222222",
      grayText: "#666666",
      lightGray: "#F7F9FC",
      border: "#E0E0E0",
    };

    const loadImage = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => resolve(img);
      });

    const logoUrl = "https://i.imgur.com/e6wa0LQ.png";
    const logo = await loadImage(logoUrl);

    const marginLeft = 40;
    const marginRight = 555;
    let cursorY = 50;

    doc.addImage(logo, "PNG", marginLeft, cursorY, 50, 50);
    doc.setFontSize(12);
    doc.setTextColor(colors.darkText);
    doc.setFont("helvetica", "bold");
    doc.text("Institución Educativa Particular", marginLeft + 70, cursorY + 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Juanita Mojica", marginLeft + 70, cursorY + 28);
    doc.text("R.D.R. N° 000616-16", marginLeft + 70, cursorY + 42);
    doc.text(
      "Centro Poblado Victor Raúl Haya de la Torre Mz 57 - Lote 01 - HUANCHACO",
      marginLeft + 70,
      cursorY + 56
    );

    cursorY += 70;
    doc.setDrawColor(colors.border);
    doc.setLineWidth(1);
    doc.line(marginLeft, cursorY, marginRight, cursorY);

    cursorY += 25;
    doc.setFontSize(16);
    doc.setTextColor(colors.primary);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGO", 297.5, cursorY, null, null, "center");

    // 👉 Leyenda Copia para colegio/apoderado
    doc.setFontSize(10);
    doc.setTextColor("#666666");
    doc.text(leyendas[i], 297.5, cursorY + 20, null, null, "center");

    const alumnoNombre = `${alumno?.nombre || "-"} ${alumno?.apellido || "-"}`;
    const grado = alumno?.grado || "-";
    const fecha = recibo?.fechaPago?.toDate?.()?.toLocaleDateString?.() || "-";
    const tipo = recibo?.tipoPago || "-";
    const medio = recibo?.medioPago || "-";
    const descripcion =
      tipo === "Pensión"
        ? `Mes: ${recibo.mesPension}`
        : tipo === "Otros"
        ? recibo.descripcionOtros
        : "-";
    const operacion = recibo?.numOperacion || "-";
    const monto = `S/. ${recibo?.monto?.toFixed(2) || "0.00"}`;
    const montoTexto = numeroALetras(recibo?.monto || 0);

    const info = [
      ["N° de Recibo", recibo.numeroRecibo || "-"],
      ["Fecha", fecha],
      ["Alumno", alumnoNombre],
      ["Grado", grado],
      ["Tipo de Pago", tipo],
      ["Descripción", descripcion],
      ["Medio de Pago", medio],
      ["N° de Operación", operacion],
      ["Monto", monto],
      ["Monto en Letras", montoTexto],
    ];

    const labelX = marginLeft + 10;
    const valueX = marginLeft + 140;
    const rowHeight = 22;
    let tableY = cursorY + 50;

    info.forEach(([label, value], j) => {
      const y = tableY + j * rowHeight;
      if (j % 2 === 0) {
        doc.setFillColor(colors.lightGray);
        doc.rect(marginLeft, y - 14, marginRight - marginLeft, rowHeight, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.grayText);
      doc.setFontSize(10);
      doc.text(`${label}:`, labelX, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.darkText);
      doc.text(`${value}`, valueX, y);
    });

    const firmaY = tableY + info.length * rowHeight + 30;
    const lineStartX = marginRight - 130;
    const lineEndX = marginRight - 20;
    doc.setDrawColor(colors.darkText);
    doc.setLineWidth(0.8);
    doc.line(lineStartX, firmaY, lineEndX, firmaY);
    doc.setFontSize(9);
    doc.setTextColor(colors.grayText);
    doc.text(
      "Sello de Conformidad",
      (lineStartX + lineEndX) / 2,
      firmaY + 14,
      null,
      null,
      "center"
    );

    doc.setFontSize(8);
    doc.setTextColor(colors.grayText);
    doc.text(
      "Este documento no reemplaza comprobante tributario. Es solo constancia de pago escolar.",
      297.5,
      firmaY + 30,
      null,
      null,
      "center"
    );

    const nombreAlumno = `${alumno?.nombre || "Alumno"}_${alumno?.apellido || ""}`.replace(
      /\s+/g,
      "_"
    );
    const numeroRecibo = recibo?.numeroRecibo || recibo?.id || "0000";
    const tipoArchivo = i === 0 ? "COLEGIO" : "APODERADO";
    doc.save(`Recibo_${nombreAlumno}_R${numeroRecibo}_${tipoArchivo}.pdf`);
  }
};

  if (loading) return <p>Cargando datos...</p>;
const recibosFiltrados = recibos.filter((r) => {
  const coincideTipo = filtroTipoRecibo ? r.tipoPago === filtroTipoRecibo : true;
  const coincideNumero = busquedaRecibo
    ? r.numeroRecibo?.toString().includes(busquedaRecibo)
    : true;
  return coincideTipo && coincideNumero;
});

  // Filtrar pagos según filtroTipoPago
  const pagosFiltrados = filtroTipoPago
    ? pagos.filter((p) => p.tipoPago === filtroTipoPago)
    : pagos;

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      <h1>
        Gestión de Pagos - {alumno?.nombre} {alumno?.apellido}
      </h1>

      {/* Formulario registro de pago */}
      <form onSubmit={registrarPago} style={{ marginBottom: "30px" }}>
        <h2>Registrar Nuevo Pago</h2>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Monto (S/.):{" "}
            <input
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              style={{ width: "150px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Tipo de Pago:{" "}
            <select
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value)}
              required
            >
              <option value="">--Seleccione--</option>
              {tiposPago.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>
        </div>

        {tipoPago === "Pensión" && (
          <div style={{ marginBottom: "10px" }}>
            <label>
              Mes de Pensión:{" "}
              <select
                value={mesPension}
                onChange={(e) => setMesPension(e.target.value)}
                required={tipoPago === "Pensión"}
              >
                <option value="">--Seleccione--</option>
                {meses
                  .filter((m) => !mesesPagados.includes(m))
                  .map((mes) => (
                    <option key={mes} value={mes}>
                      {mes}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        )}

        {tipoPago === "Otros" && (
          <div style={{ marginBottom: "10px" }}>
            <label>
              Descripción:{" "}
              <input
                type="text"
                value={descripcionOtros}
                onChange={(e) => setDescripcionOtros(e.target.value)}
                required={tipoPago === "Otros"}
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: "10px" }}>
          <label>
            Medio de Pago:{" "}
            <select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
              required
            >
              <option value="">--Seleccione--</option>
              {mediosPago.map((medio) => (
                <option key={medio} value={medio}>
                  {medio}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(medioPago === "Transferencia" ||
          medioPago === "Yape" ||
          medioPago === "Plin") && (
          <div style={{ marginBottom: "10px" }}>
            <label>
              N° de Operación:{" "}
              <input
                type="text"
                value={numOperacion}
                onChange={(e) => setNumOperacion(e.target.value)}
                required
              />
            </label>
          </div>
        )}

        <button type="submit" style={{ padding: "10px 20px" }}>
          Registrar Pago
        </button>
      </form>

      {/* FILTRO PAGOS */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          Filtrar por Tipo de Pago:{" "}
          <select
            value={filtroTipoPago}
            onChange={(e) => setFiltroTipoPago(e.target.value)}
          >
            <option value="">--Todos--</option>
            {tiposPago.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>
      </div>

{/* Barra de avance de tipos de pago esperados (excluyendo "Otros") */}
<div style={{ marginBottom: "30px" }}>
  <h3>Progreso de Tipos de Pago</h3>
  {(() => {
    const tiposEsperados = [
      "Matrícula",
      "Cuota Aniversario",
      "Agenda",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Setiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const completados = new Set();

    pagos.forEach((p) => {
      if (["Matrícula", "Cuota Aniversario", "Agenda"].includes(p.tipoPago)) {
        completados.add(p.tipoPago);
      }
      if (p.tipoPago === "Pensión" && p.mesPension && tiposEsperados.includes(p.mesPension)) {
        completados.add(p.mesPension);
      }
    });

    const progreso = (completados.size / tiposEsperados.length) * 100;

    const handleClickFaltante = (tipo) => {
      if (["Matrícula", "Cuota Aniversario", "Agenda"].includes(tipo)) {
        setTipoPago(tipo);
        setMesPension("");
        setDescripcionOtros("");
      } else {
        setTipoPago("Pensión");
        setMesPension(tipo);
        setDescripcionOtros("");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <>
        {/* Barra visual */}
        <div style={{ background: "#ddd", borderRadius: "10px", overflow: "hidden", height: "25px", marginBottom: "15px" }}>
          <div
            style={{
              width: `${progreso}%`,
              background: "#0b9e1d",
              color: "white",
              textAlign: "center",
              lineHeight: "25px",
              transition: "width 0.5s ease",
            }}
          >
            {Math.round(progreso)}%
          </div>
        </div>

        {/* Lista interactiva */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {tiposEsperados.map((tipo) => {
            const completo = completados.has(tipo);
            return (
              <div
                key={tipo}
                onClick={() => {
                  if (!completo) handleClickFaltante(tipo);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "5px",
                  backgroundColor: completo ? "#D5F5E3" : "#FADBD8",
                  border: `1px solid ${completo ? "#27AE60" : "#E74C3C"}`,
                  color: completo ? "#1E8449" : "#C0392B",
                  fontWeight: "bold",
                  cursor: completo ? "default" : "pointer",
                  textDecoration: completo ? "none" : "underline",
                }}
                title={completo ? "Pago ya registrado" : "Click para registrar este pago"}
              >
                {completo ? "✅" : "❌"} {tipo}
              </div>
            );
          })}
        </div>
      </>
    );
  })()}
</div>

      {/* Tabla Pagos */}
      <h2>Historial de Pagos</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "30px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <thead style={{ backgroundColor: "#2E86C1", color: "white" , textAlign: "left" }}>
          <tr>
            <th>Fecha</th>
            <th>Tipo de Pago</th>
            <th>Descripción</th>
            <th>Monto (S/.)</th>
            <th>Medio de Pago</th>
            <th>N° de Operación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pagosFiltrados.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No hay pagos registrados.
              </td>
            </tr>
          )}
          {pagosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>
                {p.fechaPago
                  ? p.fechaPago.toDate().toLocaleDateString()
                  : "-"}
              </td>
              <td>{p.tipoPago}</td>
              <td>
                {p.tipoPago === "Pensión"
                  ? p.mesPension
                  : p.tipoPago === "Otros"
                  ? p.descripcionOtros
                  : "-"}
              </td>
              <td>{p.monto?.toFixed(2)}</td>
              <td>{p.medioPago}</td>
              <td>{p.numOperacion || "-"}</td>
              <td>
                <button
                  onClick={() => eliminarPago(p.id)}
                  style={{
                    backgroundColor: "#E74C3C",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    borderRadius: "3px",
                  }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    <tr style={{ fontWeight: "bold", backgroundColor: "#f2f2f2" }}>
        <td colSpan="3" style={{ textAlign: "right" }}>Total Ingresos:</td>
        <td>S/. {pagosFiltrados.reduce((sum, p) => sum + (p.monto || 0), 0).toFixed(2)}</td>
        <td colSpan="3"></td>
    </tr>

          {/* Tabla Recibos */}


          {/* Filtros de Recibos */}
_____________________________________________________________________________
_____________________________________________________________________________
<h3>Filtrar por Recibo</h3>
<div style={{ display: "flex", gap: "30px", marginBottom: "20px" }}>
  <div>
    <label>
      Filtrar por Tipo de Pago:{" "}
      <select
        value={filtroTipoRecibo}
        onChange={(e) => setFiltroTipoRecibo(e.target.value)}
      >
        <option value="">--Todos--</option>
        {tiposPago.map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </select>
    </label>
  </div>
  <div>
    <label>
      Buscar por N° Recibo:{" "}
      <input
        type="number"
        placeholder="Ej: 1001"
        value={busquedaRecibo}
        onChange={(e) => setBusquedaRecibo(e.target.value)}
        style={{ width: "100px" }}
      />
    </label>
  </div>
</div>

    <h2>Historial de Recibos</h2>
    <table
    style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "30px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center", // Centrado del contenido
    }}
    >
    <thead style={{ backgroundColor: "#2E86C1", color: "white" }}>
        <tr>
        <th>Tipo de Pago</th>
        <th>Descripción</th>
        <th>Monto (S/.)</th>
        <th>Medio de Pago</th>
        <th>N° Recibo</th>
        <th>PDF</th>
        </tr>
    </thead>
    <tbody>
        {recibos.length === 0 ? (
        <tr>
            <td colSpan="6" style={{ textAlign: "center" }}>
            No hay recibos registrados.
            </td>
        </tr>
        ) : (
        recibosFiltrados.map((r) => (
            <tr key={r.id}>
            <td>{r.tipoPago}</td>
            <td>
                {r.tipoPago === "Pensión"
                ? r.mesPension
                : r.tipoPago === "Otros"
                ? r.descripcionOtros
                : "-"}
            </td>
            <td>{r.monto?.toFixed(2)}</td>
            <td>{r.medioPago}</td>
            <td>{r.numeroRecibo || "-"}</td>
            <td>
                <button
                onClick={() => generarPDFRecibo(r)}
                style={{
                    backgroundColor: "#2980B9",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                    borderRadius: "3px",
                }}
                >
                PDF
                </button>
            </td>
            </tr>
        ))
        )}
    </tbody>
    </table>

      {/* Botón para volver al menú anterior */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            backgroundColor: "#2E86C1",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Regresar
        </button>
      </div>
    </div>
  );
}
