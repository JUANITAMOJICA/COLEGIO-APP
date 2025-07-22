import React from "react";
import { Bar } from "react-chartjs-2";
import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CategoriaChart({ alumnos, pagos }) {
  if (!alumnos || alumnos.length === 0 || !pagos || pagos.length === 0) {
    return null;
  }

  // Calcular monto total pagado por cada alumno (solo pagos en la categoría filtrada)
  // Para evitar confusión, asumo que "pagos" ya está filtrado por categoría afuera
  // Ordeno alumnos por monto descendente para el gráfico
  const alumnosConMonto = alumnos
    .map((alumno) => {
      const montoTotal = pagos
        .filter((pago) => pago.alumnoId === alumno.id)
        .reduce((acc, pago) => acc + parseFloat(pago.monto || 0), 0);
      return { ...alumno, montoTotal };
    })
    .filter((a) => a.montoTotal > 0) // solo alumnos con pagos
    .sort((a, b) => b.montoTotal - a.montoTotal);

  const labels = alumnosConMonto.map((a) => `${a.nombre} ${a.apellido}`);

  const dataValues = alumnosConMonto.map((a) => a.montoTotal);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Monto Pagado (S/.)",
        data: dataValues,
        backgroundColor: "#1976d2",
        borderRadius: 4, // esquinas redondeadas
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // permite controlar altura manualmente
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const monto = context.parsed.y.toFixed(2);
            const alumno = context.label;
            return `${alumno}: S/ ${monto}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 90,
          minRotation: 45,
          autoSkip: false,
          maxTicksLimit: 20,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 50,
        },
      },
    },
  };

  return (
    <Box sx={{ mt: 4, height: 400, overflowX: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Gráfico de Montos Pagados por Alumno
      </Typography>
      <div style={{ minWidth: labels.length * 60 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Box>
  );
}
