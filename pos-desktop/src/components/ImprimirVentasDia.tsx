import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Banknote, Landmark } from "lucide-react";
import { ajustarLinea, centrar, normalizarParaImpresora, raya } from "../lib/textoImpresion";

export interface VentaDelDia {
  id_venta: number;
  numero_mesa: string;
  nombre_mesero: string;
  forma_pago: string;
  valor_propina: number;
  total: number; // ya incluye la propina
  fecha: string; // "YYYY-MM-DD HH:MM:SS"
}

interface Props {
  fecha: string;
  ventas: VentaDelDia[];
  onCerrar: () => void;
  onError: (msg: string) => void;
}

function construirTextoVentasDia(fecha: string, formaPago: string, ventas: VentaDelDia[]): string {
  const total = ventas.reduce((s, v) => s + v.total, 0);
  const totalPropinas = ventas.reduce((s, v) => s + v.valor_propina, 0);

  const lineasVentas = ventas.flatMap((v) => {
    const hora = v.fecha.slice(11, 16);
    const lineas = [ajustarLinea(`#${v.id_venta} Mesa ${v.numero_mesa} ${hora}`, `$${v.total.toLocaleString()}`)];
    if (v.valor_propina > 0) {
      lineas.push(ajustarLinea("   incluye propina", `$${v.valor_propina.toLocaleString()}`));
    }
    return lineas;
  });

  return [
    centrar("Maison du Café"),
    centrar("Reporte de ventas del día"),
    raya(),
    `Fecha: ${fecha}`,
    `Forma de pago: ${formaPago}`,
    raya(),
    ...(lineasVentas.length > 0 ? lineasVentas : [centrar("Sin ventas")]),
    raya(),
    ajustarLinea("Cantidad de ventas:", String(ventas.length)),
    ajustarLinea("Total propinas:", `$${totalPropinas.toLocaleString()}`),
    ajustarLinea("Total con propina:", `$${total.toLocaleString()}`),
    "",
    centrar("Maison du Café"),
    "\n\n\n",
  ].join("\n");
}

export default function ImprimirVentasDia({ fecha, ventas, onCerrar, onError }: Props) {
  const [imprimiendo, setImprimiendo] = useState(false);

  async function imprimir(formaPago: string) {
    if (imprimiendo) return;
    setImprimiendo(true);
    try {
      const filtradas = ventas.filter((v) => v.forma_pago === formaPago);
      const texto = normalizarParaImpresora(construirTextoVentasDia(fecha, formaPago, filtradas));
      await invoke("imprimir_recibo_termico", { texto, conLogo: true });
      onCerrar();
    } catch (e) {
      onError(String(e));
      setImprimiendo(false);
    }
  }

  return (
    <div className="modal-fondo" onClick={() => !imprimiendo && onCerrar()}>
      <div className="modal-caja modal-cobro" onClick={(e) => e.stopPropagation()}>
        <h3>¿Qué ventas desea imprimir?</h3>
        <p className="ayuda">Ventas del {fecha}</p>
        <div className="opciones-pago">
          <button className="opcion-pago" onClick={() => imprimir("Efectivo")} disabled={imprimiendo}>
            <Banknote size={34} strokeWidth={1.6} />
            Efectivo
          </button>
          <button className="opcion-pago" onClick={() => imprimir("Transferencia")} disabled={imprimiendo}>
            <Landmark size={34} strokeWidth={1.6} />
            Transferencia
          </button>
        </div>
        <div className="row-acciones">
          <button onClick={onCerrar} disabled={imprimiendo}>
            {imprimiendo ? "Imprimiendo…" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}
