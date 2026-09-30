import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ConfigCorreoData {
  servidor: string;
  puerto: number;
  usuario: string;
  tiene_clave: boolean;
  nombre_remitente: string;
  destinatarios: string;
}

interface Props {
  onCerrar: () => void;
  onError: (msg: string) => void;
}

export default function ConfigCorreo({ onCerrar, onError }: Props) {
  const [config, setConfig] = useState<ConfigCorreoData | null>(null);
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    invoke<ConfigCorreoData>("obtener_config_correo")
      .then((c) =>
        setConfig({
          ...c,
          servidor: c.servidor || "smtp.gmail.com",
          nombre_remitente: c.nombre_remitente || "Maison du Café",
        }),
      )
      .catch((e) => onError(String(e)));
  }, []);

  async function guardar(probar: boolean) {
    if (!config || ocupado) return;
    setOcupado(true);
    setEstado(probar ? "Probando conexión…" : "");
    try {
      await invoke("guardar_config_correo", { config: { ...config, clave: clave || null } });
      if (clave) setConfig({ ...config, tiene_clave: true });
      setClave("");
      if (probar) {
        await invoke("probar_config_correo");
        setEstado("Conexión exitosa. La configuración quedó guardada.");
      } else {
        onCerrar();
      }
    } catch (e) {
      setEstado("");
      onError(String(e));
    } finally {
      setOcupado(false);
    }
  }

  if (!config) return null;

  return (
    <div className="modal-fondo modal-encima" onClick={() => !ocupado && onCerrar()}>
      <div className="modal-caja formulario-correo" onClick={(e) => e.stopPropagation()}>
        <h3>Configurar correo de envío</h3>
        <p className="ayuda">
          Cuenta desde la que la app envía los reportes. Con Gmail usa una <strong>contraseña de aplicación</strong>{" "}
          (Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones), no la clave normal.
        </p>
        <div className="formulario-correo-fila">
          <label>
            Servidor SMTP
            <input value={config.servidor} onChange={(e) => setConfig({ ...config, servidor: e.target.value })} />
          </label>
          <label className="campo-puerto">
            Puerto
            <select value={config.puerto} onChange={(e) => setConfig({ ...config, puerto: Number(e.target.value) })}>
              <option value={587}>587 (STARTTLS)</option>
              <option value={465}>465 (SSL)</option>
            </select>
          </label>
        </div>
        <label>
          Correo (usuario)
          <input
            type="email"
            value={config.usuario}
            onChange={(e) => setConfig({ ...config, usuario: e.target.value })}
            placeholder="reportes.maisonducafe@gmail.com"
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder={config.tiene_clave ? "•••••••• (guardada — escribe para cambiarla)" : "Contraseña de aplicación"}
          />
        </label>
        <label>
          Nombre del remitente
          <input value={config.nombre_remitente} onChange={(e) => setConfig({ ...config, nombre_remitente: e.target.value })} />
        </label>
        <label>
          Destinatarios por defecto (separados por coma)
          <input
            value={config.destinatarios}
            onChange={(e) => setConfig({ ...config, destinatarios: e.target.value })}
            placeholder="gerencia@maisonducafe.com, dueno@gmail.com"
          />
        </label>
        {estado && <p className="exito-reporte">{estado}</p>}
        <div className="row-acciones">
          <button className="btn-principal" onClick={() => guardar(false)} disabled={ocupado}>
            Guardar
          </button>
          <button onClick={() => guardar(true)} disabled={ocupado}>
            Guardar y probar conexión
          </button>
          <button onClick={onCerrar} disabled={ocupado}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
