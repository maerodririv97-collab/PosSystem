import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Categoria } from "./Categorias";
import ImprimirInventario from "./ImprimirInventario";

interface Producto {
  id_producto: number;
  categoria: number;
  nombre: string;
  costo: number;
  valor: number;
  stock: number;
  estado: string;
}

interface MovimientoInventario {
  id_movimiento: number;
  producto: number;
  nombre_producto: string;
  usuario: number;
  nombre_usuario: string;
  tipo: string;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
  fecha: string;
}

interface Props {
  actorId: number;
  onError: (msg: string) => void;
}

export default function Inventario({ actorId, onError }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productoAjuste, setProductoAjuste] = useState<Producto | null>(null);
  const [motivoAjuste, setMotivoAjuste] = useState("");
  const [nuevoStock, setNuevoStock] = useState("");
  const [productoBaja, setProductoBaja] = useState<Producto | null>(null);
  const [cantidadBaja, setCantidadBaja] = useState("");
  const [motivoBaja, setMotivoBaja] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarImprimir, setMostrarImprimir] = useState(false);

  async function cargar() {
    try {
      const [ps, cs, movs] = await Promise.all([
        invoke<Producto[]>("listar_productos"),
        invoke<Categoria[]>("listar_categorias"),
        invoke<MovimientoInventario[]>("listar_movimientos_inventario"),
      ]);
      setProductos(ps);
      setCategorias(cs);
      setMovimientos(movs);
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

  async function confirmarAjuste(e: React.FormEvent) {
    e.preventDefault();
    if (!productoAjuste || nuevoStock === "") return;
    try {
      await invoke("ajustar_stock", {
        idProducto: productoAjuste.id_producto,
        nuevoStock: Number(nuevoStock),
        motivo: motivoAjuste,
        actorId,
      });
      setProductoAjuste(null);
      setMotivoAjuste("");
      setNuevoStock("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function confirmarBaja(e: React.FormEvent) {
    e.preventDefault();
    if (!productoBaja || cantidadBaja === "") return;
    try {
      await invoke("dar_de_baja_stock", {
        idProducto: productoBaja.id_producto,
        cantidad: Number(cantidadBaja),
        motivo: motivoBaja,
        actorId,
      });
      setProductoBaja(null);
      setCantidadBaja("");
      setMotivoBaja("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  function renderTarjeta(p: Producto) {
    return (
      <button
        key={p.id_producto}
        className="tarjeta tarjeta-boton"
        onClick={() => setProductoSeleccionado(p)}
      >
        <span>{p.nombre}</span>
        <small>stock {p.stock}</small>
      </button>
    );
  }

  return (
    <section>
      <div className="cabecera-venta">
        <h3>Inventario</h3>
        <button onClick={() => setMostrarImprimir(true)}>Imprimir inventario</button>
      </div>

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
        {productos.filter((p) => p.categoria === categoriaActiva).map(renderTarjeta)}
      </div>

      <h3>Historial de movimientos</h3>
      <div className="lista-pedido">
        {movimientos.map((m) => (
          <div key={m.id_movimiento} className="fila-detalle">
            <span>
              {m.tipo} · {m.nombre_producto}
            </span>
            <span>
              {m.stock_anterior} → {m.stock_nuevo}
            </span>
            <span>{m.motivo}</span>
            <small>
              {m.nombre_usuario} · {m.fecha}
            </small>
          </div>
        ))}
      </div>

      {productoSeleccionado && (
        <div className="modal-fondo" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3>{productoSeleccionado.nombre}</h3>
            <p className="ayuda">Stock actual: {productoSeleccionado.stock}</p>
            <div className="row-acciones">
              <button
                onClick={() => {
                  setNuevoStock(String(productoSeleccionado.stock));
                  setProductoAjuste(productoSeleccionado);
                  setProductoSeleccionado(null);
                }}
              >
                Ajustar stock
              </button>
              <button
                className="btn-eliminar"
                onClick={() => {
                  setProductoBaja(productoSeleccionado);
                  setProductoSeleccionado(null);
                }}
              >
                Baja de stock
              </button>
            </div>
            <div className="row-acciones">
              <button type="button" onClick={() => setProductoSeleccionado(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {productoAjuste && (
        <div className="modal-fondo" onClick={() => setProductoAjuste(null)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3>Ajustar stock: {productoAjuste.nombre}</h3>
            <form className="row form-productos" onSubmit={confirmarAjuste}>
              <input
                type="number"
                placeholder="Nuevo stock"
                value={nuevoStock}
                onChange={(e) => setNuevoStock(e.currentTarget.value)}
              />
              <input
                placeholder="Motivo del ajuste"
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.currentTarget.value)}
              />
              <div className="row-acciones">
                <button type="submit" disabled={nuevoStock === "" || !motivoAjuste.trim()}>
                  Guardar
                </button>
                <button type="button" onClick={() => setProductoAjuste(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productoBaja && (
        <div className="modal-fondo" onClick={() => setProductoBaja(null)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3>Baja de stock: {productoBaja.nombre}</h3>
            <p className="ayuda">Stock actual: {productoBaja.stock}. Descontá la cantidad perdida (rotura, vencimiento, etc).</p>
            <form className="row form-productos" onSubmit={confirmarBaja}>
              <input
                type="number"
                placeholder="Cantidad a dar de baja"
                value={cantidadBaja}
                onChange={(e) => setCantidadBaja(e.currentTarget.value)}
              />
              <input
                placeholder="Motivo de la baja"
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.currentTarget.value)}
              />
              <div className="row-acciones">
                <button
                  type="submit"
                  className="btn-eliminar"
                  disabled={cantidadBaja === "" || !motivoBaja.trim()}
                >
                  Confirmar baja
                </button>
                <button type="button" onClick={() => setProductoBaja(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarImprimir && (
        <ImprimirInventario
          productos={productos}
          categorias={categorias}
          onCerrar={() => setMostrarImprimir(false)}
        />
      )}
    </section>
  );
}
