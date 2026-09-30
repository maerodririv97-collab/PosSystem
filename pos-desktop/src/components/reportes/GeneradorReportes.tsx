import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { FileText, FileSpreadsheet, Download, Mail, Settings, X } from "lucide-react";
import { DatosReporte, TipoReporte, descripcionPeriodo, nombreArchivo } from "./datos";
import ConfigCorreo, { ConfigCorreoData } from "./ConfigCorreo";

interface Props {
  onError: (msg: string) => void;
}

interface ReporteGenerado {
  tipo: TipoReporte;
  desde: string;
  hasta: string;
  archivo: string;
  url: string;
}

function iso(f: Date) {
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

const ATAJOS: { etiqueta: string; rango: () => [Date, Date] }[] = [
  { etiqueta: "Hoy", rango: () => [new Date(), new Date()] },
  {
    etiqueta: "Últimos 7 días",
    rango: () => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return [d, new Date()];
    },
  },
  {
    etiqueta: "Este mes",
    rango: () => {
      const h = new Date();
      return [new Date(h.getFullYear(), h.getMonth(), 1), h];
    },
  },
  {
    etiqueta: "Mes anterior",
    rango: () => {
      const h = new Date();
      return [new Date(h.getFullYear(), h.getMonth() - 1, 1), new Date(h.getFullYear(), h.getMonth(), 0)];
    },
  },
  {
    etiqueta: "Este año",
    rango: () => {
      const h = new Date();
      return [new Date(h.getFullYear(), 0, 1), h];
    },
  },
];

export default function GeneradorReportes({ onError }: Props) {
  const hoy = new Date();
  const [desde, setDesde] = useState(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(iso(hoy));
  const [generando, setGenerando] = useState<TipoReporte | null>(null);
  const [reporte, setReporte] = useState<ReporteGenerado | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [configAbierta, setConfigAbierta] = useState(false);
  const [envio, setEnvio] = useState<{ destinatarios: string; asunto: string; cuerpo: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Libera el blob de la vista previa al cerrarla o reemplazarla.
  useEffect(() => {
    if (!reporte) return;
    const url = reporte.url;
    return () => URL.revokeObjectURL(url);
  }, [reporte]);

  async function generar(tipo: TipoReporte) {
    if (generando) return;
    if (desde > hasta) {
      onError("La fecha de inicio no puede ser posterior a la fecha fin.");
      return;
    }
    setGenerando(tipo);
    setMensaje("");
    try {
      const datos = await invoke<DatosReporte>("datos_reporte", { desde, hasta });
      const { generarPdf } = await import("./pdf/ReportePDF");
      const blob = await generarPdf(datos, tipo);
      const archivo = nombreArchivo(tipo, desde, hasta);
      await invoke("guardar_reporte_pdf", new Uint8Array(await blob.arrayBuffer()), {
        headers: { "nombre-archivo": archivo },
      });
      setReporte({ tipo, desde, hasta, archivo, url: URL.createObjectURL(blob) });
    } catch (e) {
      onError(String(e));
    } finally {
      setGenerando(null);
    }
  }

  async function guardarEnPc() {
    if (!reporte) return;
    try {
      const destino = await save({
        title: "Guardar reporte",
        defaultPath: reporte.archivo,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!destino) return;
      await invoke("exportar_reporte_pdf", { nombreArchivo: reporte.archivo, destino });
      setMensaje(`Reporte guardado en ${destino}`);
    } catch (e) {
      onError(String(e));
    }
  }

  async function prepararEnvio() {
    if (!reporte) return;
    try {
      const config = await invoke<ConfigCorreoData>("obtener_config_correo");
      if (!config.servidor || !config.usuario || !config.tiene_clave) {
        setMensaje("Primero configura la cuenta de correo desde donde se enviarán los reportes.");
        setConfigAbierta(true);
        return;
      }
      const nombre = reporte.tipo === "general" ? "Reporte General" : "Reporte Detallado";
      const periodo = descripcionPeriodo(reporte.desde, reporte.hasta);
      setEnvio({
        destinatarios: config.destinatarios,
        asunto: `${nombre} de Ventas — Maison du Café (${periodo})`,
        cuerpo: `Hola,\n\nAdjunto el ${nombre.toLowerCase()} de ventas de Maison du Café correspondiente al período del ${periodo}.\n\nSaludos,\nMaison du Café`,
      });
    } catch (e) {
      onError(String(e));
    }
  }

  async function enviar() {
    if (!reporte || !envio || enviando) return;
    setEnviando(true);
    try {
      await invoke("enviar_reporte_correo", { nombreArchivo: reporte.archivo, ...envio });
      setMensaje(`Reporte enviado a ${envio.destinatarios}`);
      setEnvio(null);
    } catch (e) {
      onError(String(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="reportes-generador">
      <div className="reportes-generador-cabecera">
        <div>
          <h3>Reportes de ventas</h3>
          <p className="ayuda">Elige el rango de fechas y genera el reporte en PDF para guardarlo o enviarlo por correo.</p>
        </div>
        <button className="btn-pill-suave" onClick={() => setConfigAbierta(true)}>
          <Settings size={16} />
          Configurar correo
        </button>
      </div>

      <div className="reportes-rango">
        <label>
          Fecha inicio
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Fecha fin
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <div className="reportes-atajos">
          {ATAJOS.map((a) => (
            <button
              key={a.etiqueta}
              className="btn-atajo"
              onClick={() => {
                const [d, h] = a.rango();
                setDesde(iso(d));
                setHasta(iso(h));
              }}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="reportes-botones">
        <button className="btn-principal btn-reporte" onClick={() => generar("general")} disabled={generando !== null}>
          <FileText size={22} />
          <span>
            <strong>{generando === "general" ? "Generando…" : "Reporte general"}</strong>
            <small>Resumen: ventas, pagos, propinas, productos top, días y caja</small>
          </span>
        </button>
        <button className="btn-principal btn-reporte" onClick={() => generar("detallado")} disabled={generando !== null}>
          <FileSpreadsheet size={22} />
          <span>
            <strong>{generando === "detallado" ? "Generando…" : "Reporte detallado"}</strong>
            <small>Todo lo anterior + turnos, quincenas, meseros, horarios y operaciones</small>
          </span>
        </button>
      </div>

      {mensaje && <p className="exito-reporte">{mensaje}</p>}

      {reporte && (
        <div className="modal-fondo" onClick={() => setReporte(null)}>
          <div className="modal-caja modal-reporte" onClick={(e) => e.stopPropagation()}>
            <div className="modal-reporte-cabecera">
              <h3>
                {reporte.tipo === "general" ? "Reporte general" : "Reporte detallado"} ·{" "}
                {descripcionPeriodo(reporte.desde, reporte.hasta)}
              </h3>
              <div className="row-acciones">
                <button className="btn-principal" onClick={guardarEnPc}>
                  <Download size={16} />
                  Guardar en el PC
                </button>
                <button className="btn-principal" onClick={prepararEnvio}>
                  <Mail size={16} />
                  Enviar por correo
                </button>
                <button onClick={() => setReporte(null)} aria-label="Cerrar">
                  <X size={16} />
                </button>
              </div>
            </div>
            {mensaje && <p className="exito-reporte">{mensaje}</p>}
            <iframe className="visor-pdf" src={reporte.url} title="Vista previa del reporte" />
          </div>
        </div>
      )}

      {envio && (
        <div className="modal-fondo modal-encima" onClick={() => !enviando && setEnvio(null)}>
          <div className="modal-caja formulario-correo" onClick={(e) => e.stopPropagation()}>
            <h3>Enviar reporte por correo</h3>
            <label>
              Para (separa varios correos con coma)
              <input
                value={envio.destinatarios}
                onChange={(e) => setEnvio({ ...envio, destinatarios: e.target.value })}
                placeholder="gerencia@maisonducafe.com"
              />
            </label>
            <label>
              Asunto
              <input value={envio.asunto} onChange={(e) => setEnvio({ ...envio, asunto: e.target.value })} />
            </label>
            <label>
              Mensaje
              <textarea rows={6} value={envio.cuerpo} onChange={(e) => setEnvio({ ...envio, cuerpo: e.target.value })} />
            </label>
            <p className="ayuda">Adjunto: {reporte?.archivo}</p>
            <div className="row-acciones">
              <button className="btn-principal" onClick={enviar} disabled={enviando || !envio.destinatarios.trim()}>
                <Mail size={16} />
                {enviando ? "Enviando…" : "Enviar"}
              </button>
              <button onClick={() => setEnvio(null)} disabled={enviando}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {configAbierta && <ConfigCorreo onCerrar={() => setConfigAbierta(false)} onError={onError} />}
    </div>
  );
}
