import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface VentaProductoDia {
  dia: string;
  cantidad: number;
  total: number;
  n_ventas: number;
}

interface Props {
  idProducto: number;
  nombre: string;
  onCerrar: () => void;
}

// Ventas pagadas de un producto agrupadas por día, la más reciente primero.
export default function HistoricoProducto({ idProducto, nombre, onCerrar }: Props) {
  const [dias, setDias] = useState<VentaProductoDia[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    invoke<VentaProductoDia[]>("historico_producto", { idProducto })
      .then(setDias)
      .catch((e) => setError(String(e)));
  }, [idProducto]);

  const totalUnidades = (dias ?? []).reduce((s, d) => s + d.cantidad, 0);
  const totalValor = (dias ?? []).reduce((s, d) => s + d.total, 0);

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <h3>Histórico de ventas: {nombre}</h3>
        {error && <p className="error">{error}</p>}
        {dias === null && !error && <p className="ayuda">Cargando…</p>}
        {dias !== null && dias.length === 0 && <p className="ayuda">Este producto no tiene ventas pagadas.</p>}
        {dias !== null && dias.length > 0 && (
          <>
            <p className="ayuda">
              {totalUnidades} unidades vendidas en {dias.length} días · ${totalValor.toLocaleString()}
            </p>
            <div className="lista-pedido historico-producto">
              {dias.map((d) => (
                <div key={d.dia} className="fila-detalle">
                  <span>{d.dia}</span>
                  <span>{d.cantidad} und.</span>
                  <span>${d.total.toLocaleString()}</span>
                  <small>
                    {d.n_ventas} {d.n_ventas === 1 ? "venta" : "ventas"}
                  </small>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="row-acciones">
          <button onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
