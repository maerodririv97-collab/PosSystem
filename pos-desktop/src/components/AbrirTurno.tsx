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
    try {
      const turno = await invoke<Turno>("abrir_turno", { valorInicial: valorInicial ?? 0 });
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
        <button type="submit">Abrir turno</button>
      </form>

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
