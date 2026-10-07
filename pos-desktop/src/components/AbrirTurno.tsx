import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TecladoNumerico from "./TecladoNumerico";

export interface Turno {
  id_turno: number;
  apertura: string;
  cierre: string | null;
  valor_inicial: number;
  estado: string;
  valor_retirado: number | null;
  base_esperada: number | null;
  diferencia_apertura: number | null;
  abierto_por: number | null;
  nombre_abierto_por: string | null;
  motivo_apertura: string;
}

interface Props {
  actorId: number;
  onTurnoAbierto: (turno: Turno) => void;
  onError: (msg: string) => void;
}

export default function AbrirTurno({ actorId, onTurnoAbierto, onError }: Props) {
  // Lo que dejó en caja el turno anterior (contado − retiro); null si no se sabe.
  const [baseEsperada, setBaseEsperada] = useState<number | null>(null);
  const [valorInicial, setValorInicial] = useState<number | null>(null);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [confirmandoDiferencia, setConfirmandoDiferencia] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [abriendo, setAbriendo] = useState(false);
  // Esta pantalla no muestra el aviso general de errores, así que se muestran aquí.
  const [errorApertura, setErrorApertura] = useState("");

  useEffect(() => {
    invoke<number | null>("base_esperada_turno")
      .then((b) => {
        setBaseEsperada(b);
        if (b !== null) setValorInicial(b);
      })
      .catch((e) => onError(String(e)));
  }, []);

  const diferencia = baseEsperada !== null && valorInicial !== null ? valorInicial - baseEsperada : 0;

  async function abrirTurno() {
    if (valorInicial === null || abriendo) return;
    setAbriendo(true);
    setErrorApertura("");
    try {
      const turno = await invoke<Turno>("abrir_turno", {
        valorInicial,
        actorId,
        motivo: diferencia !== 0 ? motivo : null,
      });
      onTurnoAbierto(turno);
    } catch (e) {
      setErrorApertura(String(e));
      setAbriendo(false);
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (valorInicial === null) return;
    // Abrir con un valor distinto al que dejó el turno anterior exige confirmar y dar el motivo.
    if (diferencia !== 0) {
      setConfirmandoDiferencia(true);
      return;
    }
    abrirTurno();
  }

  return (
    <main className="container">
      <h1>Abrir turno</h1>
      {baseEsperada !== null ? (
        <p className="ayuda">
          El turno anterior dejó <strong>${baseEsperada.toLocaleString()}</strong> en caja. Cuenta el efectivo y
          confirma; si no coincide, corrige el valor y quedará registrada la diferencia.
        </p>
      ) : (
        <p className="ayuda">No hay un turno abierto. Registra el valor inicial de caja para comenzar a vender.</p>
      )}
      <form className="row form-productos" onSubmit={enviar}>
        <button type="button" onClick={() => setMostrarTeclado(true)}>
          {valorInicial === null ? "Valor inicial de caja" : `$${valorInicial.toLocaleString()}`}
        </button>
        <button type="submit" disabled={valorInicial === null || abriendo}>
          Abrir turno
        </button>
      </form>
      {valorInicial === null && (
        <p className="ayuda">Debes contar y registrar el efectivo con el que arranca la caja antes de abrir el turno.</p>
      )}
      {diferencia !== 0 && (
        <p className="error">
          Diferencia contra lo que dejó el turno anterior: ${diferencia.toLocaleString()}{" "}
          {diferencia > 0 ? "(sobra)" : "(falta)"}
        </p>
      )}
      {errorApertura && !confirmandoDiferencia && <p className="error">{errorApertura}</p>}

      {mostrarTeclado && (
        <TecladoNumerico
          titulo="Valor inicial de caja"
          valorInicial={valorInicial ?? undefined}
          onConfirmar={(v) => {
            setValorInicial(v);
            setMostrarTeclado(false);
          }}
          onCancelar={() => setMostrarTeclado(false)}
        />
      )}

      {confirmandoDiferencia && baseEsperada !== null && valorInicial !== null && (
        <div className="modal-fondo" onClick={() => !abriendo && setConfirmandoDiferencia(false)}>
          <div className="modal-caja modal-cobro" onClick={(e) => e.stopPropagation()}>
            <h3>La caja no cuadra con el turno anterior</h3>
            <p>
              El turno anterior dejó <strong>${baseEsperada.toLocaleString()}</strong> y vas a abrir con{" "}
              <strong>${valorInicial.toLocaleString()}</strong>:{" "}
              <strong className="error">
                {diferencia < 0
                  ? `faltan $${Math.abs(diferencia).toLocaleString()}`
                  : `sobran $${diferencia.toLocaleString()}`}
              </strong>
              .
            </p>
            <p className="ayuda">
              Quedará registrado a tu nombre y aparecerá como alerta en el cierre del turno, la caja general y los
              reportes.
            </p>
            <input
              placeholder="Motivo de la diferencia (obligatorio)"
              value={motivo}
              onChange={(e) => setMotivo(e.currentTarget.value)}
              autoFocus
            />
            {errorApertura && <p className="error">{errorApertura}</p>}
            <div className="row-acciones">
              <button className="btn-principal" onClick={abrirTurno} disabled={!motivo.trim() || abriendo}>
                {abriendo ? "Abriendo…" : "Abrir de todas formas"}
              </button>
              <button onClick={() => setConfirmandoDiferencia(false)} disabled={abriendo}>
                Volver a contar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
