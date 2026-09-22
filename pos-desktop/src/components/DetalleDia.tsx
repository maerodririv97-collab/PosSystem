import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface DesglosePago {
  forma_pago: string;
  total: number;
}

interface VentaDetalle {
  id_venta: number;
  numero_mesa: string;
  nombre_mesero: string;
  forma_pago: string;
  valor_propina: number;
  total: number;
  fecha: string;
}

interface DetalleDiaData {
  fecha: string;
  total_ventas: number;
  total_propinas: number;
  desglose: DesglosePago[];
  ventas: VentaDetalle[];
}

interface Props {
  fecha: string;
  onCerrar: () => void;
  onError: (msg: string) => void;
}

export default function DetalleDia({ fecha, onCerrar, onError }: Props) {
  const [detalle, setDetalle] = useState<DetalleDiaData | null>(null);

  useEffect(() => {
    invoke<DetalleDiaData>("detalle_dia", { fecha })
      .then(setDetalle)
      .catch((e) => onError(String(e)));
  }, [fecha]);

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <h3>Detalle del {fecha}</h3>

        {!detalle && <p className="ayuda">Cargando…</p>}

        {detalle && (
          <>
            <p>
              <strong>Total del día: ${Math.round(detalle.total_ventas).toLocaleString()}</strong>
            </p>
            {detalle.desglose.map((d) => (
              <p key={d.forma_pago}>
                {d.forma_pago}: ${d.total.toLocaleString()}
              </p>
            ))}
            <p>Propinas: ${Math.round(detalle.total_propinas).toLocaleString()}</p>
            <p>Cantidad de ventas: {detalle.ventas.length}</p>
          </>
        )}

        <div className="row-acciones">
          <button onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
