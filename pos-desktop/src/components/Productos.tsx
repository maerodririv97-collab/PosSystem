import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Categoria } from "./Categorias";

interface Producto {
  id_producto: number;
  categoria: number;
  codigo_barras: string;
  nombre: string;
  costo: number;
  valor: number;
  stock: number;
  servicio: boolean;
  tipo_venta: string;
  imagen: string;
  estado: string;
}

interface Props {
  onError: (msg: string) => void;
}

const NUEVO_FORM = {
  categoria: 0,
  codigo_barras: "",
  nombre: "",
  costo: "",
  valor: "",
  stock: "",
  servicio: false,
  tipo_venta: "Unidad",
  imagen: "",
  estado: "Activo",
};

export default function Productos({ onError }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(NUEVO_FORM);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Producto | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);

  async function cargar() {
    try {
      const [ps, cs] = await Promise.all([
        invoke<Producto[]>("listar_productos"),
        invoke<Categoria[]>("listar_categorias"),
      ]);
      setProductos(ps);
      setCategorias(cs);
      if (cs.length && !form.categoria) {
        setForm((f) => ({ ...f, categoria: cs[0].id_categoria }));
      }
      if (cs.length && categoriaActiva === null) {
        setCategoriaActiva(cs[0].id_categoria);
      }
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.categoria) return;
    try {
      await invoke("crear_producto", {
        producto: {
          categoria: form.categoria,
          codigo_barras: form.codigo_barras || "N/A",
          nombre: form.nombre,
          costo: Number(form.costo) || 0,
          valor: Number(form.valor) || 0,
          stock: Number(form.stock) || 0,
          servicio: form.servicio,
          tipo_venta: form.tipo_venta,
          imagen: form.imagen,
          estado: form.estado,
        },
      });
      setForm((f) => ({ ...NUEVO_FORM, categoria: f.categoria }));
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  function iniciarEdicion(p: Producto) {
    setEditandoId(p.id_producto);
    setEdit({ ...p });
  }

  async function guardarEdicion() {
    if (!edit) return;
    try {
      await invoke("actualizar_producto", { producto: edit });
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
        <select
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: Number(e.currentTarget.value) })}
        >
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })}
        />
        <input
          placeholder="Código de barras"
          value={form.codigo_barras}
          onChange={(e) => setForm({ ...form, codigo_barras: e.currentTarget.value })}
        />
        <input
          placeholder="Costo"
          type="number"
          value={form.costo}
          onChange={(e) => setForm({ ...form, costo: e.currentTarget.value })}
        />
        <input
          placeholder="Valor venta"
          type="number"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.currentTarget.value })}
        />
        <button type="submit">Agregar</button>
      </form>

      <nav className="tabs">
        {categorias.map((c) => (
          <button
            key={c.id_categoria}
            className={categoriaActiva === c.id_categoria ? "tab-activo" : ""}
            onClick={() => setCategoriaActiva(c.id_categoria)}
          >
            {c.nombre}
          </button>
        ))}
      </nav>

      <div className="grid-tarjetas">
        {productos
          .filter((p) => p.categoria === categoriaActiva)
          .map((p) =>
            editandoId === p.id_producto && edit ? (
              <div key={p.id_producto} className="tarjeta tarjeta-edicion">
                <input value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.currentTarget.value })} />
                <select
                  value={edit.categoria}
                  onChange={(e) => setEdit({ ...edit, categoria: Number(e.currentTarget.value) })}
                >
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={edit.valor}
                  onChange={(e) => setEdit({ ...edit, valor: Number(e.currentTarget.value) })}
                />
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
              <div key={p.id_producto} className="tarjeta">
                <span>{p.nombre}</span>
                <small>
                  ${p.valor.toLocaleString()} · stock {p.stock} ({p.estado})
                </small>
                <div className="row-acciones">
                  <button onClick={() => iniciarEdicion(p)}>Editar</button>
                </div>
              </div>
            ),
          )}
      </div>
    </section>
  );
}
