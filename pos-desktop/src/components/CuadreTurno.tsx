import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TecladoNumerico from "./TecladoNumerico";
import { ajustarLinea, centrar, normalizarParaImpresora, raya } from "../lib/textoImpresion";

export interface DesglosePago {
  forma_pago: string;
  total: number;
}

export interface ResumenTurno {
  valor_inicial: number;
  total_ventas: number;
  total_propinas: number;
  total_ingresos: number;
  total_egresos: number;
  efectivo_esperado: number;
  desglose: DesglosePago[];
  desglose_propinas: DesglosePago[];
}

/** Cómo abrió el turno, contra lo que dejó el anterior (null si no se sabe). */
export interface AperturaInfo {
  baseEsperada: number | null;
  diferenciaApertura: number | null;
  motivoApertura: string;
}

interface Props {
  idTurno: number;
  apertura: string;
  aperturaInfo: AperturaInfo;
  actorId: number;
  nombreUsuario: string;
  onCerrado: () => void;
  onCancelar: () => void;
  onError: (msg: string) => void;
}

function porForma(desglose: DesglosePago[], forma: string): number {
  return desglose.find((d) => d.forma_pago === forma)?.total ?? 0;
}

export function construirTextoCierreTurno(
  idTurno: number,
  apertura: string,
  cierre: string,
  nombreUsuario: string,
  resumen: ResumenTurno,
  valorFinal: number,
  /** null en turnos cerrados antes de registrar retiros. */
  retiro: number | null,
  aperturaInfo: AperturaInfo,
): string {
  const difApertura = aperturaInfo.diferenciaApertura ?? 0;
  const diferencia = valorFinal - resumen.efectivo_esperado;
  const estadoDiferencia = diferencia === 0 ? "(cuadra)" : diferencia > 0 ? "(sobra)" : "(falta)";

  return [
    centrar("Maison du Café"),
    centrar("Reporte de cierre de turno"),
    raya(),
    `Turno #${idTurno}`,
    `Apertura: ${apertura}`,
    `Cierre:   ${cierre}`,
    ...(nombreUsuario ? [`Cerrado por: ${nombreUsuario}`] : []),
    ...(difApertura !== 0
      ? [
          raya(),
          centrar("*** ALERTA DE APERTURA ***"),
          ajustarLinea("Dejo el turno anterior:", `$${(aperturaInfo.baseEsperada ?? 0).toLocaleString()}`),
          ajustarLinea("Diferencia apertura:", `$${difApertura.toLocaleString()} ${difApertura > 0 ? "(sobra)" : "(falta)"}`),
          ...(aperturaInfo.motivoApertura ? [`Motivo: ${aperturaInfo.motivoApertura}`] : []),
        ]
      : []),
    raya(),
    ajustarLinea("Valor inicial:", `$${resumen.valor_inicial.toLocaleString()}`),
    ...resumen.desglose.map((d) => ajustarLinea(`${d.forma_pago}:`, `$${d.total.toLocaleString()}`)),
    raya(),
    ajustarLinea("Propinas efectivo:", `$${porForma(resumen.desglose_propinas, "Efectivo").toLocaleString()}`),
    ajustarLinea(
      "Propinas transfer.:",
      `$${porForma(resumen.desglose_propinas, "Transferencia").toLocaleString()}`,
    ),
    ajustarLinea("Total propinas:", `$${resumen.total_propinas.toLocaleString()}`),
    raya(),
    ajustarLinea("Total ventas:", `$${resumen.total_ventas.toLocaleString()}`),
    ajustarLinea("Ingresos de caja:", `$${resumen.total_ingresos.toLocaleString()}`),
    ajustarLinea("Egresos de caja:", `$${resumen.total_egresos.toLocaleString()}`),
    raya(),
    ajustarLinea("Efectivo esperado:", `$${resumen.efectivo_esperado.toLocaleString()}`),
    ajustarLinea("Efectivo contado:", `$${valorFinal.toLocaleString()}`),
    ajustarLinea("Diferencia:", `$${diferencia.toLocaleString()} ${estadoDiferencia}`),
    ...(retiro === null
      ? []
      : [
          raya(),
          ajustarLinea("Retiro:", `$${retiro.toLocaleString()}`),
          ajustarLinea("Queda en caja:", `$${(valorFinal - retiro).toLocaleString()}`),
        ]),
    "",
    centrar("Maison du Café"),
    "\n\n\n",
  ].join("\n");
}

export default function CuadreTurno({ idTurno, apertura, aperturaInfo, actorId, nombreUsuario, onCerrado, onCancelar, onError }: Props) {
  const [resumen, setResumen] = useState<ResumenTurno | null>(null);
  const [valorFinal, setValorFinal] = useState<number | null>(null);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [retiro, setRetiro] = useState<number | null>(null);
  const [mostrarTecladoRetiro, setMostrarTecladoRetiro] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [cerrando, setCerrando] = useState(false);
  // El aviso general queda detrás del fondo del modal, así que el error de cierre se muestra aquí.
  const [errorCierre, setErrorCierre] = useState("");

  useEffect(() => {
    invoke<ResumenTurno>("resumen_turno", { idTurno })
      .then(setResumen)
      .catch((e) => {
        setErrorCarga(String(e));
        onError(String(e));
      });
  }, [idTurno]);

  async function confirmarCierre() {
    if (!resumen || cerrando || valorFinal === null || retiro === null || retiro > valorFinal) return;
    setCerrando(true);
    setErrorCierre("");
    try {
      await invoke("cerrar_turno", { idTurno, valorFinal, valorRetirado: retiro, actorId });
      const cierre = new Date().toLocaleString("es-CO");
      try {
        const texto = normalizarParaImpresora(
          construirTextoCierreTurno(idTurno, apertura, cierre, nombreUsuario, resumen, valorFinal, retiro, aperturaInfo),
        );
        await invoke("imprimir_recibo_termico", { texto, conLogo: true });
      } catch (e) {
        onError(String(e));
      }
      onCerrado();
    } catch (e) {
      setErrorCierre(String(e));
      setCerrando(false);
    }
  }

  const diferencia = (valorFinal ?? 0) - (resumen?.efectivo_esperado ?? 0);
  const retiroExcede = valorFinal !== null && retiro !== null && retiro > valorFinal;

  return (
    <div className="modal-fondo" onClick={cerrando ? undefined : onCancelar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <h3>Cuadre de caja</h3>

        {(aperturaInfo.diferenciaApertura ?? 0) !== 0 && (
          <p className="error">
            Este turno abrió con ${(aperturaInfo.diferenciaApertura ?? 0).toLocaleString()}{" "}
            {(aperturaInfo.diferenciaApertura ?? 0) > 0 ? "de más" : "de menos"} respecto a lo que dejó el turno
            anterior (${(aperturaInfo.baseEsperada ?? 0).toLocaleString()}).
            {aperturaInfo.motivoApertura && ` Motivo: ${aperturaInfo.motivoApertura}`}
          </p>
        )}

        {!resumen && (
          <>
            <p className="ayuda">Cargando resumen del turno…</p>
            {errorCarga && <p className="error">{errorCarga}</p>}
          </>
        )}

        {resumen && (
          <>
            <section>
              <p>Valor inicial: ${resumen.valor_inicial.toLocaleString()}</p>
              {resumen.desglose.map((d) => (
                <p key={d.forma_pago}>
                  {d.forma_pago}: ${d.total.toLocaleString()}
                </p>
              ))}
              <p>Propinas efectivo: ${porForma(resumen.desglose_propinas, "Efectivo").toLocaleString()}</p>
              <p>Propinas transferencia: ${porForma(resumen.desglose_propinas, "Transferencia").toLocaleString()}</p>
              <p>Total propinas: ${resumen.total_propinas.toLocaleString()}</p>
              <p>Total ventas: ${resumen.total_ventas.toLocaleString()}</p>
              <p>Ingresos de caja: ${resumen.total_ingresos.toLocaleString()}</p>
              <p>Egresos de caja: ${resumen.total_egresos.toLocaleString()}</p>
              <p>
                <strong>Efectivo esperado en caja: ${resumen.efectivo_esperado.toLocaleString()}</strong>
              </p>
            </section>

            <form className="row form-productos" onSubmit={(e) => e.preventDefault()}>
              <button type="button" onClick={() => setMostrarTeclado(true)} disabled={cerrando}>
                {valorFinal === null ? "Contar efectivo en caja" : `$${valorFinal.toLocaleString()}`}
              </button>
            </form>

            {valorFinal !== null && (
              <p className={diferencia === 0 ? "ayuda" : "error"}>
                Diferencia: ${diferencia.toLocaleString()}{" "}
                {diferencia === 0 ? "(cuadra)" : diferencia > 0 ? "(sobra)" : "(falta)"}
              </p>
            )}

            {valorFinal !== null && (
              <>
                <form className="row form-productos" onSubmit={(e) => e.preventDefault()}>
                  <button type="button" onClick={() => setMostrarTecladoRetiro(true)} disabled={cerrando}>
                    {retiro === null ? "¿Cuánto efectivo retiras?" : `Retiro: $${retiro.toLocaleString()}`}
                  </button>
                </form>
                {retiro !== null &&
                  (retiroExcede ? (
                    <p className="error">El retiro no puede ser mayor que el efectivo contado.</p>
                  ) : (
                    <p>
                      <strong>Queda en caja: ${(valorFinal - retiro).toLocaleString()}</strong>{" "}
                      <span className="ayuda">(base del siguiente turno)</span>
                    </p>
                  ))}
              </>
            )}
          </>
        )}

        {errorCierre && <p className="error">{errorCierre}</p>}

        <div className="row-acciones">
          <button
            onClick={confirmarCierre}
            disabled={!resumen || valorFinal === null || retiro === null || retiroExcede || cerrando}
          >
            {cerrando ? "Cerrando e imprimiendo…" : "Confirmar cierre de turno"}
          </button>
          <button className="btn-eliminar" onClick={onCancelar} disabled={cerrando}>
            Cancelar
          </button>
        </div>

        {mostrarTecladoRetiro && (
          <TecladoNumerico
            titulo="Efectivo que retiras de la caja"
            valorInicial={retiro ?? undefined}
            onConfirmar={(v) => {
              setRetiro(v);
              setMostrarTecladoRetiro(false);
            }}
            onCancelar={() => setMostrarTecladoRetiro(false)}
          />
        )}

        {mostrarTeclado && (
          <TecladoNumerico
            titulo="Efectivo contado en caja"
            valorInicial={valorFinal ?? undefined}
            onConfirmar={(v) => {
              setValorFinal(v);
              setMostrarTeclado(false);
            }}
            onCancelar={() => setMostrarTeclado(false)}
          />
        )}
      </div>
    </div>
  );
}
