import { useRef } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import logoPrinter from "../assets/logotipo_cliente_printer.png";
import { ajustarLinea, centrar, normalizarParaImpresora, raya } from "../lib/textoImpresion";

interface Producto {
  id_producto: number;
  categoria: number;
  nombre: string;
  stock: number;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  tipo: string;
}

interface Props {
  productos: Producto[];
  categorias: Categoria[];
  onCerrar: () => void;
}

function construirTextoInventario(fecha: string, categorias: Categoria[], productos: Producto[]): string {
  const lineas: string[] = [centrar("Maison du Café"), centrar("Inventario"), fecha, raya()];

  for (const c of categorias.filter((c) => c.tipo === "Contable")) {
    const productosCategoria = productos.filter((p) => p.categoria === c.id_categoria);
    if (productosCategoria.length === 0) continue;
    lineas.push(c.nombre);
    for (const p of productosCategoria) {
      lineas.push(ajustarLinea(p.nombre, String(p.stock)));
    }
    lineas.push(raya());
  }

  lineas.push(centrar("Maison du Café"), "\n\n\n");
  return lineas.join("\n");
}

export default function ImprimirInventario({ productos, categorias, onCerrar }: Props) {
  const fecha = new Date().toLocaleString("es-CO");
  const imprimiendo = useRef(false);

  async function imprimir() {
    if (imprimiendo.current) return;
    imprimiendo.current = true;
    try {
      const texto = normalizarParaImpresora(construirTextoInventario(fecha, categorias, productos));
      await invoke("imprimir_recibo_termico", { texto, conLogo: true });
    } catch (e) {
      console.error(e);
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
        <div className="recibo">
          <img src={logoPrinter} alt="Maison du Café" className="recibo-logo" />
          <div className="recibo-encabezado">
            <span>Inventario</span>
            <span>{fecha}</span>
          </div>

          {categorias
            .filter((c) => c.tipo === "Contable")
            .map((c) => {
              const productosCategoria = productos.filter((p) => p.categoria === c.id_categoria);
              if (productosCategoria.length === 0) return null;
              return (
                <div key={c.id_categoria}>
                  <p className="recibo-mesa recibo-categoria">
                    <strong>{c.nombre}</strong>
                  </p>
                  <div className="recibo-tabla-header">
                    <span className="recibo-col-desc">Producto</span>
                    <span className="recibo-col-valor">Stock</span>
                  </div>
                  {productosCategoria.map((p) => (
                    <div key={p.id_producto} className="recibo-fila">
                      <span className="recibo-col-desc">{p.nombre}</span>
                      <span className="recibo-col-valor">{p.stock}</span>
                    </div>
                  ))}
                </div>
              );
            })}

          <p className="recibo-footer">Maison du Café</p>
        </div>

        <div className="row-acciones no-imprimir">
          <button onClick={imprimir}>Imprimir</button>
          <button onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>,
    contenedor,
  );
}
