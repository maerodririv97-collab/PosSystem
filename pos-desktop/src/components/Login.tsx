import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import logo from "../assets/logotipo_cliente.png";

export interface UsuarioSesion {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  pin: number;
  perfil: string;
  estado: string;
}

interface Props {
  onIngreso: (usuario: UsuarioSesion) => void;
}

export default function Login({ onIngreso }: Props) {
  const [pin, setPin] = useState("");
  const [mensaje, setMensaje] = useState("Ingrese su PIN");
  const [error, setError] = useState(false);

  async function intentarIngresar(pinCompleto: string) {
    try {
      const usuario = await invoke<UsuarioSesion>("login_pin", { pin: Number(pinCompleto) });
      setMensaje(`Bienvenido, ${usuario.nombres}`);
      setError(false);
      onIngreso(usuario);
    } catch (e) {
      setError(true);
      setMensaje(String(e));
      setPin("");
    }
  }

  function presionar(digito: number) {
    const nuevo = (pin + digito).slice(0, 6);
    setPin(nuevo);
    setError(false);
    setMensaje("Ingrese su PIN");
    if (nuevo.length >= 4) {
      intentarIngresar(nuevo);
    }
  }

  function borrar() {
    setPin((p) => p.slice(0, -1));
    setError(false);
  }

  return (
    <main className="container login">
      <img src={logo} alt="Maison du Café" className="login-logo" />
      <div className="pin-display">{"•".repeat(pin.length) || " "}</div>
      <p className={error ? "error" : "ayuda"}>{mensaje}</p>

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
    </main>
  );
}
