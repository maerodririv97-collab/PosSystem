import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Armchair, ShoppingBag } from "lucide-react";

interface Mesa {
  id_mesa: number;
  numero: string;
  tipo: string;
  estado: string;
}

interface Props {
  onError: (msg: string) => void;
}

const TIPOS = ["Mesa", "Barra", "Isla", "Para Llevar"];

export default function Mesas({ onError }: Props) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);

  async function cargar() {
    try {
      setMesas(await invoke<Mesa[]>("listar_mesas"));
    } catch (e) {
      onError(String(e));
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!numero.trim()) return;
    try {
      await invoke("crear_mesa", { mesa: { numero, tipo, estado: "Activa" } });
      setNumero("");
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function alternarActiva(m: Mesa) {
    const siguiente = m.estado === "Activa" ? "Inactiva" : "Activa";
    try {
      await invoke("actualizar_mesa", { mesa: { ...m, estado: siguiente } });
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  async function eliminar(id: number) {
    try {
      await invoke("eliminar_mesa", { idMesa: id });
      await cargar();
    } catch (e) {
      onError(String(e));
    }
  }

  return (
    <section>
      <p className="ayuda">
        Activa/Inactiva habilita o deshabilita la mesa para venta. La ocupación (mesa en uso) se ve en la
        pestaña Ventas y se calcula sola según si hay una venta abierta.
      </p>
      <form className="row form-productos" onSubmit={crear}>
        <input placeholder="Número" value={numero} onChange={(e) => setNumero(e.currentTarget.value)} />
        <select value={tipo} onChange={(e) => setTipo(e.currentTarget.value)}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit">Agregar</button>
      </form>

      <div className="grid-mesas">
        {mesas.map((m) => {
          const Icono = m.tipo === "Para Llevar" ? ShoppingBag : Armchair;
          return (
            <div key={m.id_mesa} className="mesa-admin">
              <button
                className={`mesa-boton ${m.estado === "Activa" ? "mesa-activa" : "mesa-inactiva"}`}
                onClick={() => alternarActiva(m)}
              >
                <div className="mesa-boton-info">
                  <Icono size={22} />
                  <span className="mesa-numero">{m.numero}</span>
                  <small>{m.tipo}</small>
                  <small>{m.estado}</small>
                </div>
              </button>
              <button className="btn-eliminar" onClick={() => eliminar(m.id_mesa)}>
                Eliminar
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
