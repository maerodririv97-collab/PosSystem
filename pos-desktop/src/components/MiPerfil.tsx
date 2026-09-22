import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { UsuarioSesion } from "./Login";

interface Props {
  usuario: UsuarioSesion;
  onActualizado: (usuario: UsuarioSesion) => void;
  onError: (msg: string) => void;
}

export default function MiPerfil({ usuario, onActualizado, onError }: Props) {
  const [nombres, setNombres] = useState(usuario.nombres);
  const [apellidos, setApellidos] = useState(usuario.apellidos);
  const [pin, setPin] = useState(String(usuario.pin));
  const [guardado, setGuardado] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombres.trim() || !pin) return;
    try {
      const actualizado = await invoke<UsuarioSesion>("actualizar_mis_datos", {
        idUsuario: usuario.id_usuario,
        nombres,
        apellidos,
        pin: Number(pin),
      });
      onActualizado(actualizado);
      setGuardado(true);
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <form className="row form-productos" onSubmit={guardar}>
        <input
          placeholder="Nombres"
          value={nombres}
          onChange={(e) => {
            setNombres(e.currentTarget.value);
            setGuardado(false);
          }}
        />
        <input
          placeholder="Apellidos"
          value={apellidos}
          onChange={(e) => {
            setApellidos(e.currentTarget.value);
            setGuardado(false);
          }}
        />
        <input
          placeholder="PIN"
          type="number"
          value={pin}
          onChange={(e) => {
            setPin(e.currentTarget.value);
            setGuardado(false);
          }}
        />
        <button type="submit">Guardar</button>
      </form>
      {guardado && <p className="ayuda">Datos actualizados.</p>}
      <p className="ayuda">El perfil solo puede ser modificado por un Administrador.</p>
    </section>
  );
}
