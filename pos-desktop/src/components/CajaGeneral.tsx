import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import TecladoNumerico from "./TecladoNumerico";
import ConceptosOperaciones, { ConceptoOperacion } from "./ConceptosOperaciones";

interface Operacion {
  id_operacion: number;
  tipo_concepto: number;
  nombre_concepto: string;
  turno: number;
  administrador: number;
  tipo: string;
  valor: number;
  fecha: string;
  concepto: string;
  caja: string;
  forma_pago: string;
}

interface ResumenCajaGeneral {
  total_ventas: number;
  ventas_efectivo: number;
  ventas_transferencia: number;
  total_propinas: number;
  total_egresos: number;
  egresos_efectivo: number;
  egresos_transferencia: number;
  total_retiros: number;
  ganancia: number;
}

interface RetiroTurno {
  id_turno: number;
  cierre: string;
  nombre_cerrado_por: string | null;
  valor_retirado: number;
}

interface AlertaCaja {
  id_turno: number;
  apertura: string;
  cierre: string | null;
  nombre_abierto_por: string | null;
  nombre_cerrado_por: string | null;
  base_esperada: number | null;
  valor_inicial: number;
  diferencia_apertura: number | null;
  motivo_apertura: string;
  diferencia: number | null;
}

type FormaPago = "Efectivo" | "Transferencia";

function estado(v: number) {
  return v > 0 ? "sobran" : "faltan";
}

interface Props {
  idTurno: number;
  actorId: number;
  onError: (msg: string) => void;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dinero(v: number) {
  return `$${v.toLocaleString()}`;
}

// Caja general: gastos del negocio y retiros de efectivo (solo administrador).
// No afecta el cuadre del turno; se compara contra las ventas del período para
// ver la ganancia y cuánto dinero debería haber en efectivo y en la cuenta.
export default function CajaGeneral({ idTurno, actorId, onError }: Props) {
  const hoy = new Date();
  const [desde, setDesde] = useState(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(iso(hoy));
  const [resumen, setResumen] = useState<ResumenCajaGeneral | null>(null);
  const [egresos, setEgresos] = useState<Operacion[]>([]);
  const [retiros, setRetiros] = useState<RetiroTurno[]>([]);
  const [alertas, setAlertas] = useState<AlertaCaja[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoOperacion[]>([]);
  const [idConcepto, setIdConcepto] = useState<number | null>(null);
  const [formaPago, setFormaPago] = useState<FormaPago>("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [valor, setValor] = useState<number | null>(null);
  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [mostrarConceptos, setMostrarConceptos] = useState(false);

  async function cargar() {
    if (desde > hasta) return;
    try {
      const args = { actorId, desde, hasta };
      const [r, listaEgresos, listaRetiros, listaAlertas] = await Promise.all([
        invoke<ResumenCajaGeneral>("resumen_caja_general", args),
        invoke<Operacion[]>("listar_operaciones_caja_general", args),
        invoke<RetiroTurno[]>("listar_retiros_caja_general", args),
        invoke<AlertaCaja[]>("listar_alertas_caja", args),
      ]);
      setResumen(r);
      setEgresos(listaEgresos);
      setRetiros(listaRetiros);
      setAlertas(listaAlertas);
    } catch (e) {
      onError(String(e));
    }
  }

  async function cargarConceptos() {
    try {
      const lista = await invoke<ConceptoOperacion[]>("listar_conceptos_operaciones");
      setConceptos(lista);
      if (lista.length > 0 && idConcepto === null) setIdConcepto(lista[0].id_concepto_operacion);
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  useEffect(() => {
    cargarConceptos();
  }, []);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!idConcepto || !valor) return;
    try {
      await invoke("crear_operacion", {
        operacion: {
          tipo_concepto: idConcepto,
          turno: idTurno,
          administrador: actorId,
          tipo: "Egreso",
          valor,
          concepto: observaciones,
          caja: "General",
          forma_pago: formaPago,
        },
      });
      setValor(null);
      setObservaciones("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <form className="row form-productos" onSubmit={(e) => e.preventDefault()}>
        <label>
          Desde
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </form>

      {alertas.length > 0 && (
        <div className="alertas-caja">
          <h3>⚠ Alertas de caja ({alertas.length})</h3>
          {alertas.map((a) => (
            <div key={a.id_turno} className="alerta-caja">
              <strong>
                Turno #{a.id_turno} · {a.apertura}
              </strong>
              {(a.diferencia_apertura ?? 0) !== 0 && (
                <span>
                  Al abrir {estado(a.diferencia_apertura ?? 0)} {dinero(Math.abs(a.diferencia_apertura ?? 0))}: el
                  turno anterior dejó {dinero(a.base_esperada ?? 0)} y abrió con {dinero(a.valor_inicial)}
                  {a.nombre_abierto_por ? ` (${a.nombre_abierto_por})` : ""}.
                  {a.motivo_apertura && ` Motivo: ${a.motivo_apertura}`}
                </span>
              )}
              {(a.diferencia ?? 0) !== 0 && (
                <span>
                  Al cerrar {estado(a.diferencia ?? 0)} {dinero(Math.abs(a.diferencia ?? 0))} contra lo esperado
                  {a.nombre_cerrado_por ? ` (${a.nombre_cerrado_por})` : ""}.
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {resumen && (
        <div className="resumen-caja-general">
          <div className="tarjeta">
            <small>Total ventas</small>
            <strong>{dinero(resumen.total_ventas)}</strong>
            <small>Efectivo {dinero(resumen.ventas_efectivo)}</small>
            <small>Transferencia {dinero(resumen.ventas_transferencia)}</small>
            <small>Sin propinas ({dinero(resumen.total_propinas)} aparte)</small>
          </div>
          <div className="tarjeta">
            <small>Total egresos</small>
            <strong>{dinero(resumen.total_egresos)}</strong>
            <small>Efectivo {dinero(resumen.egresos_efectivo)}</small>
            <small>Transferencia {dinero(resumen.egresos_transferencia)}</small>
          </div>
          <div className="tarjeta">
            <small>Ganancia</small>
            <strong className={resumen.ganancia < 0 ? "error" : ""}>{dinero(resumen.ganancia)}</strong>
            <small>Ventas − egresos</small>
          </div>
          <div className="tarjeta">
            <small>Retiros de efectivo</small>
            <strong>{dinero(resumen.total_retiros)}</strong>
            <small>{retiros.length} retiros al cerrar turno</small>
          </div>
          <div className="tarjeta">
            <small>Debería haber</small>
            <small>
              Efectivo retirado − gastado:{" "}
              <strong className={resumen.total_retiros - resumen.egresos_efectivo < 0 ? "error" : ""}>
                {dinero(resumen.total_retiros - resumen.egresos_efectivo)}
              </strong>
            </small>
            <small>
              Transferencias recibidas − gastadas:{" "}
              <strong className={resumen.ventas_transferencia - resumen.egresos_transferencia < 0 ? "error" : ""}>
                {dinero(resumen.ventas_transferencia - resumen.egresos_transferencia)}
              </strong>
            </small>
          </div>
        </div>
      )}

      <h3>Registrar egreso</h3>
      <form className="row form-productos" onSubmit={registrar}>
        <select value={idConcepto ?? ""} onChange={(e) => setIdConcepto(Number(e.currentTarget.value))}>
          {conceptos.map((c) => (
            <option key={c.id_concepto_operacion} value={c.id_concepto_operacion}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setMostrarConceptos(true)}>
          + Conceptos
        </button>
        <select value={formaPago} onChange={(e) => setFormaPago(e.currentTarget.value as FormaPago)}>
          <option value="Efectivo">Pagado en efectivo</option>
          <option value="Transferencia">Pagado por transferencia</option>
        </select>
        <input
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.currentTarget.value)}
        />
        <button type="button" onClick={() => setMostrarTeclado(true)}>
          {valor === null ? "Valor" : dinero(valor)}
        </button>
        <button type="submit" disabled={!idConcepto || !valor}>
          Registrar egreso
        </button>
      </form>

      {conceptos.length === 0 && (
        <p className="ayuda">No hay conceptos de operación creados. Creá uno en "+ Conceptos".</p>
      )}

      <h3>Egresos</h3>
      {egresos.length === 0 && <p className="ayuda">No hay egresos registrados en este período.</p>}
      <div className="grid-tarjetas">
        {egresos.map((o) => (
          <div key={o.id_operacion} className="tarjeta">
            <span>{o.nombre_concepto}</span>
            <small>
              {dinero(o.valor)} · {o.forma_pago}
            </small>
            <small>{o.fecha}</small>
            {o.concepto && <small>{o.concepto}</small>}
          </div>
        ))}
      </div>

      <h3>Retiros de efectivo</h3>
      {retiros.length === 0 && <p className="ayuda">No hay retiros registrados en este período.</p>}
      <div className="grid-tarjetas">
        {retiros.map((r) => (
          <div key={r.id_turno} className="tarjeta">
            <span>Turno #{r.id_turno}</span>
            <small>{dinero(r.valor_retirado)}</small>
            <small>{r.cierre}</small>
            {r.nombre_cerrado_por && <small>Retiró: {r.nombre_cerrado_por}</small>}
          </div>
        ))}
      </div>

      {mostrarTeclado && (
        <TecladoNumerico
          titulo="Valor del egreso"
          valorInicial={valor ?? undefined}
          onConfirmar={(v) => {
            setValor(v);
            setMostrarTeclado(false);
          }}
          onCancelar={() => setMostrarTeclado(false)}
        />
      )}

      {mostrarConceptos && (
        <div className="modal-fondo" onClick={() => setMostrarConceptos(false)}>
          <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
            <h3>Conceptos de Operación</h3>
            <ConceptosOperaciones onError={onError} />
            <div className="row-acciones">
              <button
                onClick={() => {
                  setMostrarConceptos(false);
                  cargarConceptos();
                }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
