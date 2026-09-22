import { useState } from "react";

interface Props {
  titulo: string;
  valorInicial?: number;
  onConfirmar: (valor: number) => void;
  onCancelar: () => void;
}

export default function TecladoNumerico({ titulo, valorInicial, onConfirmar, onCancelar }: Props) {
  const [valor, setValor] = useState(valorInicial ? String(valorInicial) : "");

  function presionar(digito: number) {
    setValor((v) => (v + digito).replace(/^0+(?=\d)/, "").slice(0, 9));
  }

  function borrar() {
    setValor((v) => v.slice(0, -1));
  }

  function limpiar() {
    setValor("");
  }

  function confirmar() {
    onConfirmar(Number(valor) || 0);
  }

  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal-caja modal-teclado" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <div className="pin-display">${(Number(valor) || 0).toLocaleString()}</div>

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
          <button className="tecla-pin tecla-borrar" onClick={limpiar}>
            C
          </button>
        </div>

        <div className="row-acciones">
          <button onClick={confirmar}>Confirmar</button>
          <button className="btn-eliminar" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
