import { useState } from "react";

interface Props {
  nombreProducto: string;
  valorUnitario: number;
  /** Stock disponible (productos contables); sin límite si no se indica. */
  maximo?: number;
  onConfirmar: (cantidad: number) => void;
  onCancelar: () => void;
}

export default function SeleccionCantidad({ nombreProducto, valorUnitario, maximo, onConfirmar, onCancelar }: Props) {
  const [cantidad, setCantidad] = useState("1");

  function presionar(digito: number) {
    const nuevo = cantidad === "1" ? String(digito) : (cantidad + digito).slice(0, 3);
    setCantidad(nuevo.replace(/^0+(?=\d)/, ""));
  }

  function borrar() {
    setCantidad((c) => (c.length > 1 ? c.slice(0, -1) : "1"));
  }

  function confirmar() {
    const valor = Number(cantidad) || 1;
    if (valor > 0 && !excede) onConfirmar(valor);
  }

  const total = (Number(cantidad) || 0) * valorUnitario;
  const excede = maximo !== undefined && (Number(cantidad) || 1) > maximo;

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal-caja modal-teclado" onClick={(e) => e.stopPropagation()}>
        <h3>{nombreProducto}</h3>
        <p className="ayuda">${valorUnitario.toLocaleString()} c/u</p>

        <div className="pin-display">{cantidad}</div>
        <p className="total-venta">Total: ${total.toLocaleString()}</p>
        {maximo !== undefined && (
          <p className={excede ? "error" : "ayuda"}>
            {excede ? `Solo hay ${maximo} en stock.` : `Disponibles: ${maximo}`}
          </p>
        )}

        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className="tecla-pin" onClick={() => presionar(n)}>
              {n}
            </button>
          ))}
          <button className="tecla-pin tecla-borrar" onClick={borrar}>
            ⌫
          </button>
          <button className="tecla-pin" onClick={() => presionar(0)}>
            0
          </button>
          <div />
        </div>

        <div className="row-acciones">
          <button onClick={confirmar} disabled={excede}>
            Agregar
          </button>
          <button className="btn-eliminar" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
