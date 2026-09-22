import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Categoria {
  id_categoria: number;
  nombre: string;
  tipo: string;
}

interface Props {
  onError: (msg: string) => void;
}

const TIPOS = ["Contable", "Sin Stock"];

export default function Categorias({ onError }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Categoria | null>(null);

  async function cargar() {
    try {
      setCategorias(await invoke<Categoria[]>("listar_categorias"));
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
      await invoke("crear_categoria", { categoria: { nombre, tipo } });
      setNombre("");
      setTipo(TIPOS[0]);
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function eliminar(id: number) {
    try {
      await invoke("eliminar_categoria", { idCategoria: id });
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  function iniciarEdicion(c: Categoria) {
    setEditandoId(c.id_categoria);
    setEdit({ ...c });
  }

  async function guardarEdicion() {
    if (!edit) return;
    try {
      await invoke("actualizar_categoria", { categoria: edit });
      setEditandoId(null);
      setEdit(null);
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <form className="row form-productos" onSubmit={crear}>
        <input
          placeholder="Nombre de la categoría"
          value={nombre}
          onChange={(e) => setNombre(e.currentTarget.value)}
        />
        <select value={tipo} onChange={(e) => setTipo(e.currentTarget.value)}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit">Agregar</button>
      </form>
      <p className="ayuda" style={{ padding: "0 1.5rem" }}>
        "Contable" lleva control de stock en Inventario; "Sin Stock" son categorías de preparación (bebidas,
        etc.) que no se inventarían.
      </p>

      <div className="grid-tarjetas">
        {categorias.map((c) =>
          editandoId === c.id_categoria && edit ? (
            <div key={c.id_categoria} className="tarjeta tarjeta-edicion">
              <input value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.currentTarget.value })} />
              <select value={edit.tipo} onChange={(e) => setEdit({ ...edit, tipo: e.currentTarget.value })}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="row-acciones">
                <button onClick={guardarEdicion}>Guardar</button>
                <button
                  className="btn-eliminar"
                  onClick={() => {
                    setEditandoId(null);
                    setEdit(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div key={c.id_categoria} className="tarjeta">
              <span>{c.nombre}</span>
              <small>{c.tipo}</small>
              <div className="row-acciones">
                <button onClick={() => iniciarEdicion(c)}>Editar</button>
                <button className="btn-eliminar" onClick={() => eliminar(c.id_categoria)}>
                  Eliminar
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
