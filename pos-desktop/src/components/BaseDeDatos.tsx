import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Database } from "lucide-react";

interface Props {
  actorId: number;
  onError: (msg: string) => void;
}

export default function BaseDeDatos({ actorId, onError }: Props) {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [importando, setImportando] = useState(false);

  async function seleccionarArchivo() {
    try {
      const seleccion = await open({
        multiple: false,
        filters: [{ name: "Script SQL", extensions: ["sql"] }],
      });
      if (typeof seleccion === "string") {
        setArchivo(seleccion);
        setMensaje("");
      }
    } catch (e) {
      onError(String(e));
    }
  }

  async function importar() {
    if (!archivo) return;
    setImportando(true);
    setMensaje("");
    try {
      const resultado = await invoke<string>("importar_desde_archivo", { path: archivo, actorId });
      setMensaje(resultado);
    } catch (e) {
      onError(String(e));
    } finally {
      setImportando(false);
    }
  }

  return (
    <section>
      <div className="titulo-seccion" style={{ padding: "0 1.5rem" }}>
        <Database size={26} />
        <div>
          <h3>Base de Datos</h3>
          <p className="ayuda">
            Cargá el script .sql exportado del sistema real. Reemplaza categorías, productos, usuarios, mesas
            y todo el histórico de ventas/turnos actuales de esta instalación.
          </p>
        </div>
      </div>

      <div className="row-acciones" style={{ padding: "1rem 1.5rem" }}>
        <button onClick={seleccionarArchivo}>{archivo ? "Cambiar archivo" : "Seleccionar archivo .sql"}</button>
        <button className="btn-principal" onClick={importar} disabled={!archivo || importando}>
          {importando ? "Importando…" : "Importar"}
        </button>
      </div>

      {archivo && <p className="ayuda" style={{ padding: "0 1.5rem" }}>Archivo: {archivo}</p>}
      {mensaje && <p className="ayuda" style={{ padding: "0 1.5rem" }}>{mensaje}</p>}
    </section>
  );
}
