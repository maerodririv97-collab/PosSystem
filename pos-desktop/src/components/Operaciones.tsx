import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TecladoNumerico from "./TecladoNumerico";
import ConceptosOperaciones, { ConceptoOperacion } from "./ConceptosOperaciones";

interface Operacion {
  id_operacion: number;
  tipo_concepto: number;
  nombre_concepto: string;
  turno: number;
  administrador: number;
  tipo: string;
  valor: number;
  fecha: string;
  concepto: string;
}

interface Props {
  idTurno: number;
  actorId: number;
  onError: (msg: string) => void;
}

export default function Operaciones({ idTurno, actorId, onError }: Props) {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoOperacion[]>([]);
  const [tipo, setTipo] = useState<"Ingreso" | "Egreso">("Ingreso");
  const [idConcepto, setIdConcepto] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [valor, setValor] = useState<number | null>(null);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [mostrarConceptos, setMostrarConceptos] = useState(false);

  async function cargar() {
    try {
      setOperaciones(await invoke<Operacion[]>("listar_operaciones", { idTurno }));
    } catch (e) {
      onError(String(e));
    }
  }

  async function cargarConceptos() {
    try {
      const lista = await invoke<ConceptoOperacion[]>("listar_conceptos_operaciones");
      setConceptos(lista);
      if (lista.length > 0 && idConcepto === null) setIdConcepto(lista[0].id_concepto_operacion);
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
    cargarConceptos();
  }, [idTurno]);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!idConcepto || !valor) return;
    try {
      await invoke("crear_operacion", {
        operacion: {
          tipo_concepto: idConcepto,
          turno: idTurno,
          administrador: actorId,
          tipo,
          valor,
          concepto: observaciones,
        },
      });
      setValor(null);
      setObservaciones("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <form className="row form-productos" onSubmit={registrar}>
        <select value={tipo} onChange={(e) => setTipo(e.currentTarget.value as "Ingreso" | "Egreso")}>
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
        </select>
        <select
          value={idConcepto ?? ""}
          onChange={(e) => setIdConcepto(Number(e.currentTarget.value))}
        >
          {conceptos.map((c) => (
            <option key={c.id_concepto_operacion} value={c.id_concepto_operacion}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setMostrarConceptos(true)}>
          + Conceptos
        </button>
        <input
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.currentTarget.value)}
        />
        <button type="button" onClick={() => setMostrarTeclado(true)}>
          {valor === null ? "Valor" : `$${valor.toLocaleString()}`}
        </button>
        <button type="submit" disabled={!idConcepto || !valor}>
          Registrar
        </button>
      </form>

      {conceptos.length === 0 && (
        <p className="ayuda">No hay conceptos de operación creados. Creá uno en "Conceptos de Operación".</p>
      )}

      <div className="grid-tarjetas">
        {operaciones.map((o) => (
          <div key={o.id_operacion} className="tarjeta">
            <span>
              {o.tipo}: {o.nombre_concepto}
            </span>
            <small>${o.valor.toLocaleString()}</small>
            <small>{o.fecha}</small>
            {o.concepto && <small>{o.concepto}</small>}
          </div>
        ))}
      </div>

      {mostrarTeclado && (
        <TecladoNumerico
          titulo="Valor de la operación"
          valorInicial={valor ?? undefined}
          onConfirmar={(v) => {
            setValor(v);
            setMostrarTeclado(false);
          }}
          onCancelar={() => setMostrarTeclado(false)}
        />
      )}

      {mostrarConceptos && (
        <div className="modal-fondo" onClick={() => setMostrarConceptos(false)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3>Conceptos de Operación</h3>
            <ConceptosOperaciones onError={onError} />
            <div className="row-acciones">
              <button
                onClick={() => {
                  setMostrarConceptos(false);
                  cargarConceptos();
                }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
