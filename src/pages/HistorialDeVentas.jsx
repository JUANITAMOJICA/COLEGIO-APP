import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Button, Table, Form, Row, Col } from "react-bootstrap";
import { numeroALetras } from "../utils"; // Asegúrate que esta función exista y convierte números a letras
const HistorialDeVentas = ({ ventas, alumnos }) => {
  // Estados para control de carga, filtro y búsqueda
  const [loading, setLoading] = useState(true);
  const [filtroTipoRecibo, setFiltroTipoRecibo] = useState("");
  const [busquedaRecibo, setBusquedaRecibo] = useState("");
  const [recibosFiltrados, setRecibosFiltrados] = useState([]);

  useEffect(() => {
    if (ventas.length > 0) {
      setLoading(false);
      setRecibosFiltrados(ventas);
    }
  }, [ventas]);

  // Función para filtrar recibos según tipo y número
  const filtrarRecibos = () => {
    const filtrados = ventas.filter((r) => {
      const coincideTipo = filtroTipoRecibo ? r.tipoPago === filtroTipoRecibo : true;
      const coincideNumero = busquedaRecibo
        ? r.numeroRecibo?.toString().includes(busquedaRecibo)
        : true;
      return coincideTipo && coincideNumero;
    });
    setRecibosFiltrados(filtrados);
  };

  // Buscar alumno por id en lista de alumnos
  const obtenerAlumno = (alumnoId) => alumnos.find((a) => a.id === alumnoId) || {};

  // Maneja clic en botón de descarga PDF
  const handleDescargarRecibo = async (recibo) => {
    const alumno = obtenerAlumno(recibo.alumnoId);
    await generarPDFRecibo(recibo, alumno);
  };

  return (
    <div className="container mt-4">
      <h2>Historial de Ventas</h2>

      <Form className="mb-3">
        <Row>
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Buscar número de recibo"
              value={busquedaRecibo}
              onChange={(e) => setBusquedaRecibo(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Select
              value={filtroTipoRecibo}
              onChange={(e) => setFiltroTipoRecibo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="Pensión">Pensión</option>
              <option value="Otros">Otros</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Button onClick={filtrarRecibos}>Filtrar</Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Tipo de Pago</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recibosFiltrados.map((recibo) => {
              const alumno = obtenerAlumno(recibo.alumnoId);
              return (
                <tr key={recibo.id}>
                  <td>{new Date(recibo.fechaPago).toLocaleDateString()}</td>
                  <td>{`${alumno.nombre || "-"} ${alumno.apellido || "-"}`}</td>
                  <td>{recibo.tipoPago}</td>
                 <td>S/. {(typeof recibo.monto === 'number' ? recibo.monto : 0).toFixed(2)}</td>
                  <td>
                    <Button onClick={() => handleDescargarRecibo(recibo)}>
                      Descargar Recibo
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
};

const generarPDFRecibo = async (recibo, alumno) => {
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
  doc.text(
    "Centro Poblado Victor Raúl Haya de la Torre Mz 57 - Lote 01 - HUANCHACO",
    marginLeft + 70,
    cursorY + 56
  );

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
  const alumnoNombre = `${alumno.nombre || "-"} ${alumno.apellido || "-"}`;
  const fecha = new Date(recibo.fechaPago).toLocaleDateString();
  const tipo = recibo.tipoPago || "-";
  const medio = recibo.medioPago || "-";
  const descripcion =
    tipo === "Pensión"
      ? `Mes: ${recibo.mesPension || "-"}` 
      : tipo === "Otros"
      ? recibo.descripcionOtros || "-"
      : "-";
  const operacion = recibo.numOperacion || "-";
  const monto = `S/. ${recibo.monto?.toFixed(2) || "0.00"}`;
  const montoTexto = numeroALetras(recibo.monto || 0);

  const info = [
    ["N° de Recibo", recibo.numeroRecibo || "-"],
    ["Fecha", fecha],
    ["Alumno", alumnoNombre],
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
  const nombreAlumno = `${alumno.nombre || "Alumno"}_${alumno.apellido || ""}`.replace(/\s+/g, "_");
  const numeroRecibo = recibo.numeroRecibo || recibo.id || "0000";
  doc.save(`Recibo_${nombreAlumno}_R${numeroRecibo}.pdf`);
};

export default HistorialDeVentas;
export { generarPDFRecibo };
