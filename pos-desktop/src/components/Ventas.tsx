import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Coffee,
  Armchair,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Landmark,
  Croissant,
  CupSoda,
  IceCream2,
  Sandwich,
  Cookie,
  Soup,
  Utensils,
  Pizza,
  Candy,
  Salad,
  Milk,
  GlassWater,
  Leaf,
  Martini,
  Flame,
  Egg,
  Citrus,
  Package,
  Droplet,
  Sparkles,
  Popsicle,
  Wine,
  Beer,
  CakeSlice,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { UsuarioSesion } from "./Login";
import SeleccionCantidad from "./SeleccionCantidad";
import TecladoNumerico from "./TecladoNumerico";
import Recibo, { DatosRecibo } from "./Recibo";
import tasaCafe from "../assets/tasa_cafe.png";

// Coincidencias específicas primero (nombres reales del negocio), luego genéricas.
// El orden importa: la primera clave que calce define el ícono.
const ICONOS_CATEGORIA: { claves: string[]; icono: LucideIcon }[] = [
  { claves: ["momento latte", "latte", "macchiato", "moka"], icono: Milk },
  { claves: ["frappe", "frappé", "granizado"], icono: IceCream2 },
  { claves: ["barra fria", "barra fría", "smoothie"], icono: GlassWater },
  { claves: ["esp de origen", "de origen", "origen"], icono: Leaf },
  { claves: ["infusion", "infusiones", "cafe", "café", "espresso", "capuchino", "tinto"], icono: Coffee },
  { claves: ["coctel", "cocktail", "vino", "licor", "trago", "coctelería", "cocteleria"], icono: Martini },
  { claves: ["horno", "asado", "tostado"], icono: Flame },
  { claves: ["brunch", "desayuno"], icono: Egg },
  { claves: ["frutal", "frutales", "extracto", "citrico", "cítrico"], icono: Citrus },
  { claves: ["limonada", "soda", "gaseosa", "refresco"], icono: CupSoda },
  { claves: ["bakery", "reposteria", "repostería", "panaderia", "panadería", "croissant"], icono: Croissant },
  { claves: ["adicion", "adiciones", "extra", "extras", "topping"], icono: Plus },
  { claves: ["llevar", "domicilio", "empacado"], icono: ShoppingBag },
  { claves: ["varios", "otros", "general"], icono: Package },
  { claves: ["bebida", "bebidas", "agua"], icono: Droplet },
  { claves: ["postre", "helado", "torta", "pastel"], icono: IceCream2 },
  { claves: ["dulce", "chocolate", "confite"], icono: Candy },
  { claves: ["galleta"], icono: Cookie },
  { claves: ["sandwich", "sándwich", "hamburguesa", "burger"], icono: Sandwich },
  { claves: ["pizza"], icono: Pizza },
  { claves: ["ensalada", "vegetariano", "vegano"], icono: Salad },
  { claves: ["sopa", "caldo"], icono: Soup },
];

// Reserva de íconos para categorías que no calcen con ninguna clave anterior.
// Se elige por hash del nombre para que no todas las categorías nuevas
// terminen mostrando el mismo ícono genérico.
const ICONOS_RESERVA: LucideIcon[] = [Utensils, Sparkles, Package, Coffee];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function iconoParaCategoria(nombre: string): LucideIcon {
  const normalizado = normalizar(nombre);
  for (const grupo of ICONOS_CATEGORIA) {
    if (grupo.claves.some((clave) => normalizado.includes(normalizar(clave)))) {
      return grupo.icono;
    }
  }
  let hash = 0;
  for (let i = 0; i < normalizado.length; i++) hash = (hash * 31 + normalizado.charCodeAt(i)) >>> 0;
  return ICONOS_RESERVA[hash % ICONOS_RESERVA.length];
}

// Íconos por producto: más específicos que el de categoría, para que cosas como
// una paleta dentro de "BAKERY" no hereden el ícono de croissant de la categoría.
// Si ningún producto de la lista calza, se usa el ícono de su categoría (no uno
// genérico único), así solo comparten ícono los productos que de verdad se parecen.
const ICONOS_PRODUCTO: { claves: string[]; icono: LucideIcon }[] = [
  { claves: ["paleta"], icono: Popsicle },
  { claves: ["vino", "sangria", "sangría"], icono: Wine },
  { claves: ["mojito", "margarita", "amaretto", "ron blanco", "whisky", "tequila"], icono: Martini },
  { claves: ["cerveza", "cervaza", "michelada"], icono: Beer },
  { claves: ["leche", "flat white", "irlandes"], icono: Milk },
  { claves: ["huevo"], icono: Egg },
  {
    claves: [
      "cafe", "café", "expresso", "espresso", "americano", "capuchino", "carajillo", "affogato",
      "aromatica", "infusion", "mocca", "mocaccino", "bombon", "bomba", "campesino", "cold brew",
      "aeropress", "chemex", "origami", "prensa francesa", "sifon", "v60", "chai", "latte", "matcha",
      "cortado",
    ],
    icono: Coffee,
  },
  { claves: ["croissant"], icono: Croissant },
  { claves: ["galleta", "alfajor"], icono: Cookie },
  { claves: ["trufa", "brownie", "chocolate", "caramelo", "chantilly", "vainilla", "salsa de", "oreo", "milo"], icono: Candy },
  { claves: ["torta"], icono: CakeSlice },
  { claves: ["jugo", "zumo"], icono: Citrus },
  { claves: ["limonada", "soda", "coca cola", "coca-cola", "redbull", "fuze", "hatsu", "ginger"], icono: CupSoda },
  { claves: ["agua"], icono: Droplet },
  { claves: ["derretido", "sanduche"], icono: Sandwich },
  { claves: ["pan "], icono: Wheat },
  { claves: ["lasa"], icono: Utensils },
];

function iconoParaProducto(nombreProducto: string, nombreCategoria: string): LucideIcon {
  const normalizado = normalizar(nombreProducto);
  for (const grupo of ICONOS_PRODUCTO) {
    if (grupo.claves.some((clave) => normalizado.includes(normalizar(clave)))) {
      return grupo.icono;
    }
  }
  return iconoParaCategoria(nombreCategoria);
}

interface Mesa {
  id_mesa: number;
  numero: string;
  tipo: string;
  estado: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  tipo: string; // 'Contable' lleva inventario; 'Sin Stock' no
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

interface VentaProducto {
  producto: number;
  total_vendido: number;
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

const PORCENTAJE_PROPINA = 10;

type PasoCobro = "metodo" | "efectivo";

export default function Ventas({ usuario, idTurno, onError }: Props) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [ventasAbiertas, setVentasAbiertas] = useState<VentaAbierta[]>([]);
  const [ventaActiva, setVentaActiva] = useState<VentaAbierta | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [ventasPorProducto, setVentasPorProducto] = useState<Record<number, number>>({});
  const [pasoCobro, setPasoCobro] = useState<PasoCobro | null>(null);
  const [cobrando, setCobrando] = useState(false);
  const [incluyePropina, setIncluyePropina] = useState(false);
  const [stockInsuficiente, setStockInsuficiente] = useState<{ nombre: string; stock: number } | null>(null);
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

  async function cargarRankingVentas() {
    try {
      const ranking = await invoke<VentaProducto[]>("ranking_ventas_productos");
      const mapa: Record<number, number> = {};
      for (const r of ranking) mapa[r.producto] = r.total_vendido;
      setVentasPorProducto(mapa);
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
      setCatalogoAbierto(false);
      await cargarRankingVentas();
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
      const msg = String(e);
      if (msg.startsWith("STOCK_INSUFICIENTE|")) {
        // El aviso general queda detrás del modal: se cierra y se avisa con el de stock.
        setStockInsuficiente({ nombre: productoParaCantidad.nombre, stock: Number(msg.split("|")[1]) });
        setProductoParaCantidad(null);
        await refrescarPedidos();
      } else {
        onError(msg);
      }
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

  /** Botones +/− del resumen: suma o resta una unidad a la línea del pedido. */
  async function cambiarCantidad(pedido: Pedido, delta: 1 | -1) {
    if (delta < 0 && pedido.cantidad <= 1) {
      await quitarPedido(pedido.id_pedido);
      return;
    }
    try {
      await invoke("cambiar_cantidad_pedido", { idPedido: pedido.id_pedido, delta });
      await refrescarPedidos();
    } catch (e) {
      const msg = String(e);
      if (msg.startsWith("STOCK_INSUFICIENTE|")) {
        setStockInsuficiente({ nombre: pedido.nombre_producto, stock: Number(msg.split("|")[1]) });
      } else {
        onError(msg);
      }
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

  function iniciarCobro() {
    if (pedidos.length === 0) return;
    setEfectivoRecibido("");
    setPasoCobro("metodo");
  }

  async function cerrarVenta(formaPago: string) {
    if (!ventaActiva || cobrando) return;
    if (formaPago === "Efectivo" && !efectivoAlcanza) return;
    setCobrando(true);
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
      setEfectivoRecibido("");
      setPasoCobro(null);
      await cargarMesas();
    } catch (e) {
      onError(String(e));
    } finally {
      setCobrando(false);
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
  const propina = incluyePropina ? Math.round((total * PORCENTAJE_PROPINA) / 100) : 0;
  const totalConPropina = total + propina;
  const vueltas = (Number(efectivoRecibido) || 0) - totalConPropina;
  // "¿Con cuánto paga?" es opcional: si pagan con el valor exacto no hay nada que calcular.
  // Solo bloqueamos el cobro si SÍ registraron un efectivo recibido y no alcanza.
  const efectivoAlcanza = efectivoRecibido === "" || vueltas >= 0;

  function unidadesVendidas(idProducto: number): number {
    return ventasPorProducto[idProducto] ?? 0;
  }

  function ordenarPorVentas<T>(lista: T[], vendidos: (item: T) => number, nombre: (item: T) => string): T[] {
    return [...lista].sort((a, b) => {
      const diferencia = vendidos(b) - vendidos(a);
      if (diferencia !== 0) return diferencia;
      return nombre(a).localeCompare(nombre(b), "es");
    });
  }

  if (ventaActiva) {
    const categoriasOrdenadas = ordenarPorVentas(
      categorias,
      (c) => productos.filter((p) => p.categoria === c.id_categoria).reduce((acc, p) => acc + unidadesVendidas(p.id_producto), 0),
      (c) => c.nombre,
    );
    const productosFiltrados = ordenarPorVentas(
      productos.filter((p) => p.categoria === categoriaActiva),
      (p) => unidadesVendidas(p.id_producto),
      (p) => p.nombre,
    );
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

        <div className="layout-venta layout-venta-solo-pedido">
          <div className="columna-pedido columna-pedido-full">
            <div className="cabecera-pedido">
              <h3>Pedido</h3>
              <button className="btn-pill btn-agregar-productos" onClick={() => setCatalogoAbierto(true)}>
                <Plus size={18} />
                Agregar productos
              </button>
            </div>
            <div className="lista-pedido">
              {pedidos.map((p) => (
                <div key={p.id_pedido} className="fila-detalle fila-pedido">
                  <span className="fila-pedido-nombre">{p.nombre_producto}</span>
                  <div className="control-cantidad">
                    <button
                      aria-label={p.cantidad <= 1 ? "Quitar producto" : "Quitar una unidad"}
                      onClick={() => cambiarCantidad(p, -1)}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="control-cantidad-valor">{p.cantidad}</span>
                    <button aria-label="Agregar una unidad" onClick={() => cambiarCantidad(p, 1)}>
                      <Plus size={18} />
                    </button>
                  </div>
                  <span className="fila-pedido-valor">${p.valor.toLocaleString()}</span>
                  <button className="btn-eliminar" aria-label="Quitar producto" onClick={() => quitarPedido(p.id_pedido)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <p className="total-venta">Total: ${total.toLocaleString()}</p>

            <div className="form-cobro">
              <label className="check-propina">
                <input
                  type="checkbox"
                  checked={incluyePropina}
                  onChange={(e) => setIncluyePropina(e.currentTarget.checked)}
                />
                Incluir propina ({PORCENTAJE_PROPINA}%)
              </label>

              {incluyePropina && <p className="ayuda">Propina: ${propina.toLocaleString()}</p>}

              <p className="total-venta">Total a pagar: ${totalConPropina.toLocaleString()}</p>

              <button className="btn-principal" onClick={iniciarCobro} disabled={pedidos.length === 0}>
                Cobrar
              </button>
            </div>
          </div>
        </div>

        {catalogoAbierto && (
          <div className="modal-fondo modal-fondo-catalogo">
            <div className="modal-catalogo">
              <div className="cabecera-catalogo">
                {categoriaActiva !== null ? (
                  <button className="btn-volver-catalogo" onClick={() => setCategoriaActiva(null)}>
                    <ChevronLeft size={20} />
                    Categorías
                  </button>
                ) : (
                  <span className="titulo-catalogo">Elige una categoría</span>
                )}
                <button
                  className="btn-cerrar-catalogo"
                  onClick={() => {
                    setCatalogoAbierto(false);
                    setCategoriaActiva(null);
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              {categoriaActiva === null ? (
                <div className="grid-categorias-modal">
                  {categoriasOrdenadas.map((c) => {
                    const Icono = iconoParaCategoria(c.nombre);
                    return (
                      <button
                        key={c.id_categoria}
                        className="tarjeta-categoria-modal"
                        onClick={() => setCategoriaActiva(c.id_categoria)}
                      >
                        <Icono size={36} strokeWidth={1.6} />
                        <span>{c.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <p className="titulo-catalogo titulo-catalogo-productos">
                    {categorias.find((c) => c.id_categoria === categoriaActiva)?.nombre}
                  </p>
                  {(() => {
                    const categoriaSeleccionada = categorias.find((c) => c.id_categoria === categoriaActiva);
                    const nombreCategoriaActiva = categoriaSeleccionada?.nombre ?? "";
                    const categoriaContable = categoriaSeleccionada?.tipo !== "Sin Stock";
                    return (
                      <div className="grid-tarjetas grid-productos-modal">
                        {productosFiltrados.map((p) => {
                          const IconoProducto = iconoParaProducto(p.nombre, nombreCategoriaActiva);
                          const agotado = categoriaContable && p.stock <= 0;
                          return (
                            <button
                              key={p.id_producto}
                              className="boton-producto"
                              onClick={() => setProductoParaCantidad(p)}
                              disabled={agotado}
                            >
                              <IconoProducto size={28} strokeWidth={1.6} />
                              <span>{p.nombre}</span>
                              {categoriaContable && (
                                <small className={p.stock <= 0 ? "stock-bajo" : ""}>
                                  {agotado ? "Agotado" : `stock ${p.stock}`}
                                </small>
                              )}
                            </button>
                          );
                        })}
                        {productosFiltrados.length === 0 && (
                          <p className="ayuda">Esta categoría no tiene productos todavía.</p>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {productoParaCantidad && (
          <SeleccionCantidad
            nombreProducto={productoParaCantidad.nombre}
            valorUnitario={productoParaCantidad.valor}
            maximo={
              categorias.find((c) => c.id_categoria === productoParaCantidad.categoria)?.tipo !== "Sin Stock"
                ? productoParaCantidad.stock
                : undefined
            }
            onConfirmar={confirmarCantidad}
            onCancelar={() => setProductoParaCantidad(null)}
          />
        )}

        {pasoCobro === "metodo" && (
          <div className="modal-fondo" onClick={() => !cobrando && setPasoCobro(null)}>
            <div className="modal-caja modal-cobro" onClick={(e) => e.stopPropagation()}>
              <h3>¿Cómo paga el cliente?</h3>
              <p className="total-venta">Total a pagar: ${totalConPropina.toLocaleString()}</p>
              <div className="opciones-pago">
                <button className="opcion-pago" onClick={() => setPasoCobro("efectivo")} disabled={cobrando}>
                  <Banknote size={34} strokeWidth={1.6} />
                  Efectivo
                </button>
                <button className="opcion-pago" onClick={() => cerrarVenta("Transferencia")} disabled={cobrando}>
                  <Landmark size={34} strokeWidth={1.6} />
                  Transferencia
                </button>
              </div>
              <div className="row-acciones">
                <button onClick={() => setPasoCobro(null)} disabled={cobrando}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {pasoCobro === "efectivo" && (
          <div className="modal-fondo" onClick={() => !cobrando && setPasoCobro(null)}>
            <div className="modal-caja modal-cobro" onClick={(e) => e.stopPropagation()}>
              <h3>Pago en efectivo</h3>
              <p className="total-venta">Total a pagar: ${totalConPropina.toLocaleString()}</p>
              <button type="button" onClick={() => setMostrarTecladoEfectivo(true)}>
                {efectivoRecibido === ""
                  ? "¿Con cuánto paga?"
                  : `Paga con $${Number(efectivoRecibido).toLocaleString()}`}
              </button>
              {efectivoRecibido !== "" && (
                <p className={vueltas < 0 ? "error" : "vueltas"}>
                  {vueltas < 0 ? `Falta $${Math.abs(vueltas).toLocaleString()}` : `Vueltas: $${vueltas.toLocaleString()}`}
                </p>
              )}
              <div className="row-acciones">
                <button
                  className="btn-principal"
                  onClick={() => cerrarVenta("Efectivo")}
                  disabled={!efectivoAlcanza || cobrando}
                >
                  {cobrando ? "Cobrando…" : "Cobrar y cerrar"}
                </button>
                <button onClick={() => setPasoCobro("metodo")} disabled={cobrando}>
                  Cambiar método
                </button>
              </div>
            </div>
          </div>
        )}

        {stockInsuficiente && (
          <div className="modal-fondo" onClick={() => setStockInsuficiente(null)}>
            <div className="modal-caja modal-cobro" onClick={(e) => e.stopPropagation()}>
              <h3>Stock insuficiente</h3>
              <p>
                <strong>{stockInsuficiente.nombre}</strong>{" "}
                {stockInsuficiente.stock <= 0
                  ? "no tiene stock disponible."
                  : `solo tiene ${stockInsuficiente.stock} en stock.`}
              </p>
              <p className="ayuda">Registra la entrada en Inventario para poder venderlo.</p>
              <div className="row-acciones">
                <button className="btn-principal" onClick={() => setStockInsuficiente(null)}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
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
