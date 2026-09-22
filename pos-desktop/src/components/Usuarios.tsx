import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Usuario {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  pin: number;
  perfil: string;
  estado: string;
}

interface Props {
  actorId: number;
  onError: (msg: string) => void;
}

const PERFILES = ["Administrador", "Mesero", "Barista", "Cajero"];

export default function Usuarios({ actorId, onError }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [pin, setPin] = useState("");
  const [perfil, setPerfil] = useState(PERFILES[0]);
  const [editando, setEditando] = useState<Usuario | null>(null);

  async function cargar() {
    try {
      setUsuarios(await invoke<Usuario[]>("listar_usuarios"));
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombres.trim() || !pin) return;
    try {
      await invoke("crear_usuario", {
        usuario: { nombres, apellidos, pin: Number(pin), perfil, estado: "Activo" },
      });
      setNombres("");
      setApellidos("");
      setPin("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function eliminar(id: number) {
    try {
      await invoke("eliminar_usuario", { idUsuario: id });
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    try {
      await invoke("actualizar_usuario", { actorId, usuario: editando });
      setEditando(null);
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <form className="row form-productos" onSubmit={crear}>
        <input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.currentTarget.value)} />
        <input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.currentTarget.value)} />
        <input
          placeholder="PIN"
          type="number"
          value={pin}
          onChange={(e) => setPin(e.currentTarget.value)}
        />
        <select value={perfil} onChange={(e) => setPerfil(e.currentTarget.value)}>
          {PERFILES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="submit">Agregar</button>
      </form>

      {editando && (
        <form className="row form-productos" onSubmit={guardarEdicion}>
          <input
            placeholder="Nombres"
            value={editando.nombres}
            onChange={(e) => setEditando({ ...editando, nombres: e.currentTarget.value })}
          />
          <input
            placeholder="Apellidos"
            value={editando.apellidos}
            onChange={(e) => setEditando({ ...editando, apellidos: e.currentTarget.value })}
          />
          <input
            placeholder="PIN"
            type="number"
            value={editando.pin}
            onChange={(e) => setEditando({ ...editando, pin: Number(e.currentTarget.value) })}
          />
          <select
            value={editando.perfil}
            onChange={(e) => setEditando({ ...editando, perfil: e.currentTarget.value })}
          >
            {PERFILES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={editando.estado}
            onChange={(e) => setEditando({ ...editando, estado: e.currentTarget.value })}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <button type="submit">Guardar</button>
          <button type="button" onClick={() => setEditando(null)}>
            Cancelar
          </button>
        </form>
      )}

      <div className="grid-tarjetas">
        {usuarios.map((u) => (
          <div key={u.id_usuario} className="tarjeta">
            <span>
              {u.nombres} {u.apellidos}
            </span>
            <small>{u.perfil}</small>
            <small>PIN: {u.pin}</small>
            <button onClick={() => setEditando(u)}>Editar</button>
            <button className="btn-eliminar" onClick={() => eliminar(u.id_usuario)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
