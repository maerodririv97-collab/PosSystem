import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TecladoNumerico from "./TecladoNumerico";

interface DesglosePago {
  forma_pago: string;
  total: number;
}

interface ResumenTurno {
  valor_inicial: number;
  total_ventas: number;
  total_propinas: number;
  total_ingresos: number;
  total_egresos: number;
  efectivo_esperado: number;
  desglose: DesglosePago[];
}

interface Props {
  idTurno: number;
  onCerrado: () => void;
  onCancelar: () => void;
  onError: (msg: string) => void;
}

export default function CuadreTurno({ idTurno, onCerrado, onCancelar, onError }: Props) {
  const [resumen, setResumen] = useState<ResumenTurno | null>(null);
  const [valorFinal, setValorFinal] = useState<number | null>(null);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    invoke<ResumenTurno>("resumen_turno", { idTurno })
      .then(setResumen)
      .catch((e) => {
        setErrorCarga(String(e));
        onError(String(e));
      });
  }, [idTurno]);

  async function confirmarCierre() {
    try {
      await invoke("cerrar_turno", { idTurno, valorFinal: valorFinal ?? 0 });
      onCerrado();
    } catch (e) {
      onError(String(e));
    }
  }

  if (!resumen) {
    return (
      <main className="container">
        <p className="ayuda">Cargando resumen del turno…</p>
        {errorCarga && <p className="error">{errorCarga}</p>}
        {errorCarga && (
          <button className="btn-eliminar" onClick={onCancelar}>
            Volver
          </button>
        )}
      </main>
    );
  }

  const diferencia = (valorFinal ?? 0) - resumen.efectivo_esperado;

  return (
    <main className="container">
      <h1>Cuadre de caja</h1>

      <section>
        <p>Valor inicial: ${resumen.valor_inicial.toLocaleString()}</p>
        {resumen.desglose.map((d) => (
          <p key={d.forma_pago}>
            {d.forma_pago}: ${d.total.toLocaleString()}
          </p>
        ))}
        <p>Propinas: ${resumen.total_propinas.toLocaleString()}</p>
        <p>Total ventas: ${resumen.total_ventas.toLocaleString()}</p>
        <p>Ingresos de caja: ${resumen.total_ingresos.toLocaleString()}</p>
        <p>Egresos de caja: ${resumen.total_egresos.toLocaleString()}</p>
        <p>
          <strong>Efectivo esperado en caja: ${resumen.efectivo_esperado.toLocaleString()}</strong>
        </p>
      </section>

      <form className="row form-productos" onSubmit={(e) => e.preventDefault()}>
        <button type="button" onClick={() => setMostrarTeclado(true)}>
          {valorFinal === null ? "Contar efectivo en caja" : `$${valorFinal.toLocaleString()}`}
        </button>
      </form>

      {valorFinal !== null && (
        <p className={diferencia === 0 ? "ayuda" : "error"}>
          Diferencia: ${diferencia.toLocaleString()} {diferencia === 0 ? "(cuadra)" : diferencia > 0 ? "(sobra)" : "(falta)"}
        </p>
      )}

      <div className="row-acciones">
        <button onClick={confirmarCierre} disabled={valorFinal === null}>
          Confirmar cierre de turno
        </button>
        <button className="btn-eliminar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>

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
    </main>
  );
}
