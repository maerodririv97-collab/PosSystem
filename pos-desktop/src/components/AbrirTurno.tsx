import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TecladoNumerico from "./TecladoNumerico";

export interface Turno {
  id_turno: number;
  apertura: string;
  cierre: string | null;
  valor_inicial: number;
  estado: string;
}

interface Props {
  onTurnoAbierto: (turno: Turno) => void;
  onError: (msg: string) => void;
}

export default function AbrirTurno({ onTurnoAbierto, onError }: Props) {
  const [valorInicial, setValorInicial] = useState<number | null>(null);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);

  async function abrir(e: React.FormEvent) {
    e.preventDefault();
    if (valorInicial === null) return;
    try {
      const turno = await invoke<Turno>("abrir_turno", { valorInicial });
      onTurnoAbierto(turno);
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <main className="container">
      <h1>Abrir turno</h1>
      <p className="ayuda">No hay un turno abierto. Registra el valor inicial de caja para comenzar a vender.</p>
      <form className="row form-productos" onSubmit={abrir}>
        <button type="button" onClick={() => setMostrarTeclado(true)}>
          {valorInicial === null ? "Valor inicial de caja" : `$${valorInicial.toLocaleString()}`}
        </button>
        <button type="submit" disabled={valorInicial === null}>
          Abrir turno
        </button>
      </form>
      {valorInicial === null && (
        <p className="ayuda">Debes contar y registrar el efectivo con el que arranca la caja antes de abrir el turno.</p>
      )}

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
    </main>
  );
}
