import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Coffee, Armchair, ShoppingBag, ChevronRight } from "lucide-react";
import type { UsuarioSesion } from "./Login";
import SeleccionCantidad from "./SeleccionCantidad";
import TecladoNumerico from "./TecladoNumerico";
import Recibo, { DatosRecibo } from "./Recibo";
import tasaCafe from "../assets/tasa_cafe.png";

interface Mesa {
  id_mesa: number;
  numero: string;
  tipo: string;
  estado: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
}

interface Producto {
  id_producto: number;
  categoria: number;
  nombre: string;
  valor: number;
  stock: number;
  estado: string;
}

interface VentaAbierta {
  id_venta: number;
  mesa: number;
  numero_mesa: string;
  mesero: number;
  nombre_mesero: string;
  fecha: string;
  total: number;
}

interface Pedido {
  id_pedido: number;
  producto: number;
  nombre_producto: string;
  venta: number;
  valor: number;
  cantidad: number;
}

interface Props {
  usuario: UsuarioSesion;
  idTurno: number;
  onError: (msg: string) => void;
}

const FORMAS_PAGO = ["Efectivo", "Tarjeta", "Transferencia"];

export default function Ventas({ usuario, idTurno, onError }: Props) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [ventasAbiertas, setVentasAbiertas] = useState<VentaAbierta[]>([]);
  const [ventaActiva, setVentaActiva] = useState<VentaAbierta | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [formaPago, setFormaPago] = useState(FORMAS_PAGO[0]);
  const [incluyePropina, setIncluyePropina] = useState(false);
  const [porcentajePropina, setPorcentajePropina] = useState(8);
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [mostrarTecladoEfectivo, setMostrarTecladoEfectivo] = useState(false);
  const [productoParaCantidad, setProductoParaCantidad] = useState<Producto | null>(null);
  const [reciboVenta, setReciboVenta] = useState<DatosRecibo | null>(null);
  const [mostrarCerradas, setMostrarCerradas] = useState(false);
  const [ventasCerradas, setVentasCerradas] = useState<DatosRecibo[]>([]);

  async function cargarMesas() {
    try {
      const [m, v] = await Promise.all([
        invoke<Mesa[]>("listar_mesas"),
        invoke<VentaAbierta[]>("listar_ventas_abiertas"),
      ]);
      setMesas(m);
      setVentasAbiertas(v);
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargarMesas();
  }, []);

  function ventaDeMesa(idMesa: number) {
    return ventasAbiertas.find((v) => v.mesa === idMesa) ?? null;
  }

  async function abrirVentaDesdeMesa(mesa: Mesa) {
    const existente = ventaDeMesa(mesa.id_mesa);
    if (existente) {
      await entrarAVenta(existente);
      return;
    }
    try {
      await invoke("abrir_venta", { mesa: mesa.id_mesa, mesero: usuario.id_usuario, turno: idTurno });
      await cargarMesas();
      const nuevas = await invoke<VentaAbierta[]>("listar_ventas_abiertas");
      const creada = nuevas.find((v) => v.mesa === mesa.id_mesa);
      if (creada) await entrarAVenta(creada);
    } catch (e) {
      onError(String(e));
    }
  }

  async function entrarAVenta(venta: VentaAbierta) {
    setVentaActiva(venta);
    try {
      const [cs, ps, peds] = await Promise.all([
        invoke<Categoria[]>("listar_categorias"),
        invoke<Producto[]>("listar_productos"),
        invoke<Pedido[]>("listar_pedidos", { idVenta: venta.id_venta }),
      ]);
      setCategorias(cs);
      setProductos(ps);
      setPedidos(peds);
      setCategoriaActiva(null);
    } catch (e) {
      onError(String(e));
    }
  }

  async function refrescarPedidos() {
    if (!ventaActiva) return;
    try {
      setPedidos(await invoke<Pedido[]>("listar_pedidos", { idVenta: ventaActiva.id_venta }));
      const ps = await invoke<Producto[]>("listar_productos");
      setProductos(ps);
    } catch (e) {
      onError(String(e));
    }
  }

  async function confirmarCantidad(cantidad: number) {
    if (!ventaActiva || !productoParaCantidad) return;
    try {
      await invoke("agregar_pedido", {
        idVenta: ventaActiva.id_venta,
        idProducto: productoParaCantidad.id_producto,
        cantidad,
      });
      setProductoParaCantidad(null);
      await refrescarPedidos();
    } catch (e) {
      onError(String(e));
    }
  }

  async function quitarPedido(id: number) {
    try {
      await invoke("eliminar_pedido", { idPedido: id });
      await refrescarPedidos();
    } catch (e) {
      onError(String(e));
    }
  }

  async function cancelarVenta() {
    if (!ventaActiva) return;
    try {
      await invoke("cancelar_venta", { idVenta: ventaActiva.id_venta });
      setVentaActiva(null);
      setPedidos([]);
      await cargarMesas();
    } catch (e) {
      onError(String(e));
    }
  }

  async function cerrarVenta(e: React.FormEvent) {
    e.preventDefault();
    if (!ventaActiva || !puedeCobrar) return;
    try {
      await invoke("cerrar_venta", {
        cierre: { id_venta: ventaActiva.id_venta, forma_pago: formaPago, valor_propina: propina },
      });
      setReciboVenta({
        id_venta: ventaActiva.id_venta,
        numero_mesa: ventaActiva.numero_mesa,
        nombre_mesero: ventaActiva.nombre_mesero,
        forma_pago: formaPago,
        valor_propina: propina,
        total: totalConPropina,
        fecha: new Date().toLocaleString("es-CO"),
      });
      setVentaActiva(null);
      setPedidos([]);
      setIncluyePropina(false);
      setPorcentajePropina(8);
      setEfectivoRecibido("");
      await cargarMesas();
    } catch (e) {
      onError(String(e));
    }
  }

  async function abrirVentasCerradas() {
    try {
      setVentasCerradas(await invoke<DatosRecibo[]>("listar_ventas_cerradas_turno", { idTurno }));
      setMostrarCerradas(true);
    } catch (e) {
      onError(String(e));
    }
  }

  const total = pedidos.reduce((acc, p) => acc + p.valor, 0);
  const propina = incluyePropina ? Math.round((total * porcentajePropina) / 100) : 0;
  const totalConPropina = total + propina;
  const esEfectivo = formaPago === "Efectivo";
  const vueltas = (Number(efectivoRecibido) || 0) - totalConPropina;
  const puedeCobrar = pedidos.length > 0 && (!esEfectivo || vueltas >= 0);

  if (ventaActiva) {
    const productosFiltrados = productos.filter((p) => p.categoria === categoriaActiva);
    return (
      <section className="venta-caja">
        <div className="cabecera-venta">
          <button onClick={() => setVentaActiva(null)}>← Volver a mesas</button>
          <span>
            Mesa {ventaActiva.numero_mesa} · {ventaActiva.nombre_mesero}
          </span>
          {pedidos.length === 0 && (
            <button className="btn-eliminar" onClick={cancelarVenta}>
              Cancelar venta
            </button>
          )}
        </div>

        <div className="layout-venta">
          <div className="columna-productos">
            {categoriaActiva === null ? (
              <div className="grid-mesas">
                {categorias.map((c) => (
                  <button
                    key={c.id_categoria}
                    className="mesa-boton mesa-activa mesa-boton-categoria"
                    onClick={() => setCategoriaActiva(c.id_categoria)}
                  >
                    <span>{c.nombre}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="cabecera-venta cabecera-productos">
                  <button onClick={() => setCategoriaActiva(null)}>← Categorías</button>
                  <span>{categorias.find((c) => c.id_categoria === categoriaActiva)?.nombre}</span>
                </div>
                <div className="grid-tarjetas">
                  {productosFiltrados.map((p) => (
                    <button
                      key={p.id_producto}
                      className="boton-producto"
                      onClick={() => setProductoParaCantidad(p)}
                    >
                      <span>{p.nombre}</span>
                      <small>${p.valor.toLocaleString()}</small>
                      <small className={p.stock <= 0 ? "stock-bajo" : ""}>stock {p.stock}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="columna-pedido">
            <h3>Pedido</h3>
            <div className="lista-pedido">
              {pedidos.map((p) => (
                <div key={p.id_pedido} className="fila-detalle">
                  <span>
                    {p.cantidad} × {p.nombre_producto}
                  </span>
                  <span>${p.valor.toLocaleString()}</span>
                  <button className="btn-eliminar" onClick={() => quitarPedido(p.id_pedido)}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <p className="total-venta">Total: ${total.toLocaleString()}</p>

            <form className="form-cobro" onSubmit={cerrarVenta}>
              <select value={formaPago} onChange={(e) => setFormaPago(e.currentTarget.value)}>
                {FORMAS_PAGO.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <label className="check-propina">
                <input
                  type="checkbox"
                  checked={incluyePropina}
                  onChange={(e) => setIncluyePropina(e.currentTarget.checked)}
                />
                Incluir propina
              </label>

              {incluyePropina && (
                <div className="row porcentajes-propina">
                  {[5, 8, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={porcentajePropina === pct ? "tab-activo" : ""}
                      onClick={() => setPorcentajePropina(pct)}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}

              {incluyePropina && <p className="ayuda">Propina ({porcentajePropina}%): ${propina.toLocaleString()}</p>}

              <p className="total-venta">Total a pagar: ${totalConPropina.toLocaleString()}</p>

              {esEfectivo && (
                <>
                  <button type="button" onClick={() => setMostrarTecladoEfectivo(true)}>
                    {efectivoRecibido === ""
                      ? "¿Con cuánto paga?"
                      : `Paga con $${Number(efectivoRecibido).toLocaleString()}`}
                  </button>
                  {efectivoRecibido !== "" && (
                    <p className={vueltas < 0 ? "error" : "ayuda"}>
                      {vueltas < 0
                        ? `Falta $${Math.abs(vueltas).toLocaleString()}`
                        : `Vueltas: $${vueltas.toLocaleString()}`}
                    </p>
                  )}
                </>
              )}

              <button type="submit" disabled={!puedeCobrar}>
                Cobrar y cerrar
              </button>
            </form>
          </div>
        </div>

        {productoParaCantidad && (
          <SeleccionCantidad
            nombreProducto={productoParaCantidad.nombre}
            valorUnitario={productoParaCantidad.valor}
            onConfirmar={confirmarCantidad}
            onCancelar={() => setProductoParaCantidad(null)}
          />
        )}

        {mostrarTecladoEfectivo && (
          <TecladoNumerico
            titulo="¿Con cuánto paga?"
            valorInicial={Number(efectivoRecibido) || undefined}
            onConfirmar={(v) => {
              setEfectivoRecibido(String(v));
              setMostrarTecladoEfectivo(false);
            }}
            onCancelar={() => setMostrarTecladoEfectivo(false)}
          />
        )}
      </section>
    );
  }

  const mesasNormales = mesas.filter((m) => m.tipo !== "Para Llevar");
  const mesasParaLlevar = mesas.filter((m) => m.tipo === "Para Llevar");

  function renderMesa(m: Mesa) {
    const ocupada = ventaDeMesa(m.id_mesa);
    const disponible = !ocupada && m.estado === "Activa";
    const clase = ocupada ? "mesa-ocupada" : disponible ? "mesa-activa" : "mesa-inactiva";
    const Icono = m.tipo === "Para Llevar" ? ShoppingBag : Armchair;
    return (
      <button key={m.id_mesa} className={`mesa-boton ${clase}`} onClick={() => abrirVentaDesdeMesa(m)}>
        <div className="mesa-boton-info">
          <Icono size={22} />
          <span className="mesa-numero">{m.numero}</span>
          <small>{m.tipo === "Para Llevar" ? "Para Llevar" : "Mesa"}</small>
          <small className="mesa-estado">
            <span className={`punto-estado ${disponible ? "punto-disponible" : ocupada ? "punto-ocupada" : ""}`} />
            {ocupada ? `$${ocupada.total.toLocaleString()}` : m.estado === "Activa" ? "Disponible" : "Inactiva"}
          </small>
        </div>
        <ChevronRight size={18} className="mesa-flecha" />
      </button>
    );
  }

  return (
    <section className="ventas-landing">
      <div className="ventas-contenido">
        <div className="cabecera-venta cabecera-seccion">
          <div className="titulo-seccion">
            <Coffee size={26} />
            <div>
              <h3>Ventas</h3>
              <p className="ayuda">Selecciona una mesa para tomar el pedido o ver su estado.</p>
            </div>
          </div>
        </div>

        <div className="grid-mesas">{mesasNormales.map(renderMesa)}</div>

        {mesasParaLlevar.length > 0 && (
          <>
            <h3>Para Llevar</h3>
            <div className="grid-mesas">{mesasParaLlevar.map(renderMesa)}</div>
          </>
        )}
      </div>

      <div className="ventas-decoracion">
        <Coffee size={44} strokeWidth={1.6} className="decoracion-icono" />
        <p className="decoracion-titulo">
          ¡Todo listo
          <br />
          para servir!
        </p>
        <p className="decoracion-texto">
          Gestiona tus mesas, pedidos
          <br />y productos de forma rápida
          <br />y sencilla.
        </p>
        <span className="decoracion-raya" />
        <button className="btn-pill btn-pill-suave" onClick={abrirVentasCerradas}>
          Ventas Cerradas
        </button>
        <img src={tasaCafe} alt="" className="decoracion-imagen" />
      </div>

      {mostrarCerradas && (
        <div className="modal-fondo" onClick={() => setMostrarCerradas(false)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3>Ventas cerradas del turno</h3>
            <div className="lista-pedido">
              {ventasCerradas.map((v) => (
                <div key={v.id_venta} className="fila-detalle">
                  <span>
                    {v.numero_mesa} · {v.nombre_mesero}
                  </span>
                  <span>{v.forma_pago}</span>
                  <span>${Math.round(v.total).toLocaleString()}</span>
                  <button
                    onClick={() => {
                      setReciboVenta(v);
                      setMostrarCerradas(false);
                    }}
                  >
                    Ver recibo
                  </button>
                </div>
              ))}
              {ventasCerradas.length === 0 && <p className="ayuda">Sin ventas cerradas todavía.</p>}
            </div>
            <div className="row-acciones">
              <button onClick={() => setMostrarCerradas(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {reciboVenta && (
        <Recibo venta={reciboVenta} onCerrar={() => setReciboVenta(null)} onError={onError} />
      )}
    </section>
  );
}
