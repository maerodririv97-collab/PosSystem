import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ConceptoOperacion {
  id_concepto_operacion: number;
  nombre: string;
  descripcion: string;
}

interface Props {
  onError: (msg: string) => void;
}

export default function ConceptosOperaciones({ onError }: Props) {
  const [conceptos, setConceptos] = useState<ConceptoOperacion[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  async function cargar() {
    try {
      setConceptos(await invoke<ConceptoOperacion[]>("listar_conceptos_operaciones"));
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    try {
      await invoke("crear_concepto_operacion", { concepto: { nombre, descripcion } });
      setNombre("");
      setDescripcion("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function eliminar(id: number) {
    try {
      await invoke("eliminar_concepto_operacion", { idConceptoOperacion: id });
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <form className="row" onSubmit={crear}>
        <input placeholder="Nombre del concepto" value={nombre} onChange={(e) => setNombre(e.currentTarget.value)} />
        <input
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.currentTarget.value)}
        />
        <button type="submit">Agregar</button>
      </form>

      <div className="grid-tarjetas">
        {conceptos.map((c) => (
          <div key={c.id_concepto_operacion} className="tarjeta">
            <span>{c.nombre}</span>
            <small>{c.descripcion}</small>
            <button className="btn-eliminar" onClick={() => eliminar(c.id_concepto_operacion)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
