import { useState } from "react";

interface Props {
  nombreProducto: string;
  valorUnitario: number;
  onConfirmar: (cantidad: number) => void;
  onCancelar: () => void;
}

export default function SeleccionCantidad({ nombreProducto, valorUnitario, onConfirmar, onCancelar }: Props) {
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
    if (valor > 0) onConfirmar(valor);
  }

  const total = (Number(cantidad) || 0) * valorUnitario;

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal-caja modal-teclado" onClick={(e) => e.stopPropagation()}>
        <h3>{nombreProducto}</h3>
        <p className="ayuda">${valorUnitario.toLocaleString()} c/u</p>

        <div className="pin-display">{cantidad}</div>
        <p className="total-venta">Total: ${total.toLocaleString()}</p>

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
          <button onClick={confirmar}>Agregar</button>
          <button className="btn-eliminar" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
