import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import logoPrinter from "../assets/logotipo_cliente_printer.png";

interface Pedido {
  id_pedido: number;
  nombre_producto: string;
  valor: number;
  cantidad: number;
}

export interface DatosRecibo {
  id_venta: number;
  numero_mesa: string;
  nombre_mesero: string;
  forma_pago: string;
  valor_propina: number;
  total: number;
  fecha: string;
}

interface Props {
  venta: DatosRecibo;
  onCerrar: () => void;
  onError: (msg: string) => void;
}

export default function Recibo({ venta, onCerrar, onError }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const imprimiendo = useRef(false);

  useEffect(() => {
    invoke<Pedido[]>("listar_pedidos", { idVenta: venta.id_venta })
      .then(setPedidos)
      .catch((e) => onError(String(e)));
  }, [venta.id_venta]);

  function imprimir() {
    if (imprimiendo.current) return;
    imprimiendo.current = true;
    window.print();
    setTimeout(() => {
      imprimiendo.current = false;
    }, 1000);
  }

  const subtotal = venta.total - venta.valor_propina;

  const contenedor = document.getElementById("imprimir-root");
  if (!contenedor) return null;

  return createPortal(
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <div className="recibo">
          <img src={logoPrinter} alt="Maison du Café" className="recibo-logo" />
          <p className="recibo-direccion">
            Nizza Apartamentos, Local 103
            {"\n"}La Estrella, Ant
          </p>

          <div className="recibo-encabezado">
            <span>Ticket #{venta.id_venta}</span>
            <span>{venta.fecha}</span>
          </div>
          <p className="recibo-mesa">
            {venta.numero_mesa} · {venta.nombre_mesero}
          </p>

          <div className="recibo-tabla-header">
            <span className="recibo-col-cant">Cant</span>
            <span className="recibo-col-desc">Descripción</span>
            <span className="recibo-col-valor">Valor</span>
          </div>

          {pedidos.map((p) => (
            <div key={p.id_pedido} className="recibo-fila">
              <span className="recibo-col-cant">{p.cantidad}</span>
              <span className="recibo-col-desc">{p.nombre_producto}</span>
              <span className="recibo-col-valor">${p.valor.toLocaleString()}</span>
            </div>
          ))}

          <div className="recibo-totales">
            <div className="recibo-total-linea">
              <span>Sub-Total:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="recibo-total-linea">
              <span>Servicio:</span>
              <span>${venta.valor_propina.toLocaleString()}</span>
            </div>
            <div className="recibo-total-linea recibo-total-final">
              <span>TOTAL:</span>
              <span>${venta.total.toLocaleString()}</span>
            </div>
            <div className="recibo-total-linea">
              <span>Forma de pago:</span>
              <span>{venta.forma_pago}</span>
            </div>
          </div>

          <p className="recibo-gracias">¡Gracias por su visita!</p>
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
