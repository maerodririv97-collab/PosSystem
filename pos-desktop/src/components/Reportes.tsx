import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import DetalleDia from "./DetalleDia";

interface VentaDia {
  fecha: string;
  total: number;
}

interface Props {
  onError: (msg: string) => void;
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NOMBRES_MES = [
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Reportes({ onError }: Props) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1); // 1-12
  const [ventasPorDia, setVentasPorDia] = useState<Record<string, number>>({});
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  async function cargar() {
    try {
      const lista = await invoke<VentaDia[]>("resumen_ventas_mes", { anio, mes });
      const mapa: Record<string, number> = {};
      for (const v of lista) mapa[v.fecha] = v.total;
      setVentasPorDia(mapa);
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
  }, [anio, mes]);

  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function mesSiguiente() {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  }

  const primerDiaMes = new Date(anio, mes - 1, 1);
  const diasEnMes = new Date(anio, mes, 0).getDate();
  // getDay(): 0=domingo..6=sábado. Queremos semana Lun..Dom -> offset 0=lunes.
  const offsetInicio = (primerDiaMes.getDay() + 6) % 7;

  const celdas: (number | null)[] = [
    ...Array(offsetInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const fechaHoy = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

  return (
    <section>
      <div className="cabecera-venta">
        <button onClick={mesAnterior}>← Mes anterior</button>
        <span>
          {NOMBRES_MES[mes - 1]} {anio}
        </span>
        <button onClick={mesSiguiente}>Mes siguiente →</button>
      </div>

      <div className="calendario">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="calendario-encabezado">
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={i} className="calendario-celda calendario-vacia" />;
          const fecha = `${anio}-${pad(mes)}-${pad(dia)}`;
          const total = ventasPorDia[fecha];
          return (
            <button
              key={i}
              className={`calendario-celda ${fecha === fechaHoy ? "calendario-hoy" : ""}`}
              onClick={() => setDiaSeleccionado(fecha)}
            >
              <span className="calendario-numero">{dia}</span>
              {total !== undefined && (
                <small className="calendario-total">${Math.round(total).toLocaleString()}</small>
              )}
            </button>
          );
        })}
      </div>

      {diaSeleccionado && (
        <DetalleDia fecha={diaSeleccionado} onCerrar={() => setDiaSeleccionado(null)} onError={onError} />
      )}
    </section>
  );
}
