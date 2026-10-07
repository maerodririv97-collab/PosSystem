import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { construirTextoCierreTurno, ResumenTurno } from "./CuadreTurno";
import { normalizarParaImpresora } from "../lib/textoImpresion";
import ImprimirVentasDia from "./ImprimirVentasDia";

interface DesglosePago {
  forma_pago: string;
  total: number;
}

interface VentaDetalle {
  id_venta: number;
  numero_mesa: string;
  nombre_mesero: string;
  forma_pago: string;
  valor_propina: number;
  total: number;
  fecha: string;
}

interface DetalleDiaData {
  fecha: string;
  total_ventas: number;
  total_propinas: number;
  desglose: DesglosePago[];
  ventas: VentaDetalle[];
}

interface TurnoDia {
  id_turno: number;
  apertura: string;
  cierre: string | null;
  valor_inicial: number;
  estado: string;
  valor_final: number | null;
  diferencia: number | null;
  cerrado_por: number | null;
  nombre_cerrado_por: string | null;
  valor_retirado: number | null;
  base_esperada: number | null;
  diferencia_apertura: number | null;
  nombre_abierto_por: string | null;
  motivo_apertura: string;
}

interface Props {
  fecha: string;
  onCerrar: () => void;
  onError: (msg: string) => void;
}

export default function DetalleDia({ fecha, onCerrar, onError }: Props) {
  const [detalle, setDetalle] = useState<DetalleDiaData | null>(null);
  const [turnos, setTurnos] = useState<TurnoDia[]>([]);
  const [reimprimiendo, setReimprimiendo] = useState<number | null>(null);
  const [mostrarImprimirVentas, setMostrarImprimirVentas] = useState(false);

  useEffect(() => {
    invoke<DetalleDiaData>("detalle_dia", { fecha })
      .then(setDetalle)
      .catch((e) => onError(String(e)));
    invoke<TurnoDia[]>("listar_turnos_dia", { fecha })
      .then(setTurnos)
      .catch((e) => onError(String(e)));
  }, [fecha]);

  async function reimprimirReporte(t: TurnoDia) {
    if (reimprimiendo !== null) return;
    setReimprimiendo(t.id_turno);
    try {
      const resumen = await invoke<ResumenTurno>("resumen_turno", { idTurno: t.id_turno });
      const texto = normalizarParaImpresora(
        construirTextoCierreTurno(
          t.id_turno,
          t.apertura,
          t.cierre ?? "",
          t.nombre_cerrado_por ?? "",
          resumen,
          t.valor_final ?? 0,
          t.valor_retirado,
          {
            baseEsperada: t.base_esperada,
            diferenciaApertura: t.diferencia_apertura,
            motivoApertura: t.motivo_apertura,
          },
        ),
      );
      await invoke("imprimir_recibo_termico", { texto, conLogo: true });
    } catch (e) {
      onError(String(e));
    } finally {
      setReimprimiendo(null);
    }
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <h3>Detalle del {fecha}</h3>

        {!detalle && <p className="ayuda">Cargando…</p>}

        {detalle && (
          <>
            <p>
              <strong>Total del día: ${Math.round(detalle.total_ventas).toLocaleString()}</strong>
            </p>
            {detalle.desglose.map((d) => (
              <p key={d.forma_pago}>
                {d.forma_pago}: ${d.total.toLocaleString()}
              </p>
            ))}
            <p>Propinas: ${Math.round(detalle.total_propinas).toLocaleString()}</p>
            <p>Cantidad de ventas: {detalle.ventas.length}</p>
          </>
        )}

        {turnos.length > 0 && (
          <div className="detalle-campana">
            <p>
              <strong>Turnos cerrados</strong>
            </p>
            {turnos.map((t) => (
              <div key={t.id_turno} className="fila-detalle">
                <span>
                  Turno #{t.id_turno} · {t.apertura} → {t.cierre}
                  {t.nombre_cerrado_por ? ` · ${t.nombre_cerrado_por}` : ""}
                  {(t.diferencia_apertura ?? 0) !== 0 && (
                    <small className="error" style={{ display: "block" }}>
                      Abrió con ${(t.diferencia_apertura ?? 0).toLocaleString()}{" "}
                      {(t.diferencia_apertura ?? 0) > 0 ? "de más" : "de menos"}
                      {t.nombre_abierto_por ? ` (${t.nombre_abierto_por})` : ""}
                      {t.motivo_apertura ? ` · ${t.motivo_apertura}` : ""}
                    </small>
                  )}
                  {(t.diferencia ?? 0) !== 0 && (
                    <small className="error" style={{ display: "block" }}>
                      Cerró con diferencia de ${(t.diferencia ?? 0).toLocaleString()}{" "}
                      {(t.diferencia ?? 0) > 0 ? "(sobra)" : "(falta)"}
                    </small>
                  )}
                </span>
                <button onClick={() => reimprimirReporte(t)} disabled={reimprimiendo === t.id_turno}>
                  Reimprimir reporte
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="row-acciones">
          <button onClick={() => setMostrarImprimirVentas(true)} disabled={!detalle}>
            Imprimir reporte de ventas del día
          </button>
          <button onClick={onCerrar}>Cerrar</button>
        </div>

        {mostrarImprimirVentas && detalle && (
          <ImprimirVentasDia
            fecha={fecha}
            ventas={detalle.ventas}
            onCerrar={() => setMostrarImprimirVentas(false)}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}
