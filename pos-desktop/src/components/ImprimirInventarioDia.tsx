import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import logoPrinter from "../assets/logotipo_cliente_printer.png";
import { ANCHO_RECIBO, ajustarLinea, centrar, normalizarParaImpresora, raya } from "../lib/textoImpresion";

interface InventarioDiaProducto {
  id_producto: number;
  categoria: number;
  nombre: string;
  vendidos: number;
  /** Suma de ajustes y bajas del día (negativo = salió stock). */
  movimientos: number;
  stock_final: number;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
}

interface Props {
  categorias: Categoria[];
  onCerrar: () => void;
}

function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Columnas numéricas del ticket: vendidos, ajustes y stock final, 6 caracteres cada una.
const COLUMNA = 6;
const columnas = (...valores: string[]) => valores.map((v) => v.padStart(COLUMNA)).join("");
const conSigno = (v: number) => (v > 0 ? `+${v}` : String(v));

function construirTexto(fecha: string, categorias: Categoria[], filas: InventarioDiaProducto[]): string {
  const anchoNombre = ANCHO_RECIBO - COLUMNA * 3 - 1;
  const lineas: string[] = [
    centrar("Maison du Café"),
    centrar("Inventario del día"),
    centrar(fecha),
    raya(),
    ajustarLinea("Producto", columnas("Vend", "Ajus", "Stock")),
  ];

  for (const c of categorias) {
    const productos = filas.filter((f) => f.categoria === c.id_categoria);
    if (productos.length === 0) continue;
    lineas.push(raya(), c.nombre);
    for (const p of productos) {
      lineas.push(
        ajustarLinea(
          p.nombre.slice(0, anchoNombre),
          columnas(String(p.vendidos), p.movimientos ? conSigno(p.movimientos) : "-", String(p.stock_final)),
        ),
      );
    }
  }

  const totalVendidos = filas.reduce((s, f) => s + f.vendidos, 0);
  lineas.push(raya(), ajustarLinea("Total unidades vendidas:", String(totalVendidos)), raya());
  lineas.push(centrar("Maison du Café"), "\n\n\n");
  return lineas.join("\n");
}

// Inventario de los productos contables en un día: lo vendido, los ajustes/bajas
// y el stock con el que terminó el día, para imprimir en la térmica.
export default function ImprimirInventarioDia({ categorias, onCerrar }: Props) {
  const [fecha, setFecha] = useState(hoyIso());
  const [filas, setFilas] = useState<InventarioDiaProducto[]>([]);
  const [soloVendidos, setSoloVendidos] = useState(false);
  const [error, setError] = useState("");
  const imprimiendo = useRef(false);

  useEffect(() => {
    if (!fecha) return;
    setError("");
    invoke<InventarioDiaProducto[]>("inventario_dia", { fecha })
      .then(setFilas)
      .catch((e) => setError(String(e)));
  }, [fecha]);

  const visibles = soloVendidos ? filas.filter((f) => f.vendidos > 0 || f.movimientos !== 0) : filas;

  async function imprimir() {
    if (imprimiendo.current) return;
    imprimiendo.current = true;
    setError("");
    try {
      const texto = normalizarParaImpresora(construirTexto(fecha, categorias, visibles));
      await invoke("imprimir_recibo_termico", { texto, conLogo: true });
    } catch (e) {
      setError(String(e));
    }
    setTimeout(() => {
      imprimiendo.current = false;
    }, 300);
  }

  const contenedor = document.getElementById("imprimir-root");
  if (!contenedor) return null;

  return createPortal(
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <form className="row form-productos no-imprimir" onSubmit={(e) => e.preventDefault()}>
          <label>
            Día
            <input type="date" value={fecha} max={hoyIso()} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label>
            <input type="checkbox" checked={soloVendidos} onChange={(e) => setSoloVendidos(e.target.checked)} />
            Solo productos con movimiento
          </label>
        </form>
        {error && <p className="error">{error}</p>}

        <div className="recibo">
          <img src={logoPrinter} alt="Maison du Café" className="recibo-logo" />
          <div className="recibo-encabezado">
            <span>Inventario del día</span>
            <span>{fecha}</span>
          </div>

          {categorias.map((c) => {
            const productos = visibles.filter((f) => f.categoria === c.id_categoria);
            if (productos.length === 0) return null;
            return (
              <div key={c.id_categoria}>
                <p className="recibo-mesa recibo-categoria">
                  <strong>{c.nombre}</strong>
                </p>
                <div className="recibo-tabla-header">
                  <span className="recibo-col-desc">Producto</span>
                  <span className="recibo-col-valor recibo-col-num">Vend.</span>
                  <span className="recibo-col-valor recibo-col-num">Ajus.</span>
                  <span className="recibo-col-valor recibo-col-num">Stock</span>
                </div>
                {productos.map((p) => (
                  <div key={p.id_producto} className="recibo-fila">
                    <span className="recibo-col-desc">{p.nombre}</span>
                    <span className="recibo-col-valor recibo-col-num">{p.vendidos}</span>
                    <span className="recibo-col-valor recibo-col-num">{p.movimientos ? conSigno(p.movimientos) : "-"}</span>
                    <span className="recibo-col-valor recibo-col-num">{p.stock_final}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {visibles.length === 0 && <p className="ayuda">No hay productos para mostrar.</p>}
          <p className="recibo-footer">
            Total unidades vendidas: {visibles.reduce((s, f) => s + f.vendidos, 0)}
          </p>
        </div>

        <div className="row-acciones no-imprimir">
          <button onClick={imprimir} disabled={visibles.length === 0}>
            Imprimir
          </button>
          <button onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>,
    contenedor,
  );
}
