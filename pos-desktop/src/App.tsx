import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Coffee,
  LayoutGrid,
  Package,
  Boxes,
  Users,
  Armchair,
  Settings,
  BarChart3,
  Database,
  User,
  Clock,
  DoorOpen,
  LogOut,
} from "lucide-react";
import Login, { UsuarioSesion } from "./components/Login";
import AbrirTurno, { Turno } from "./components/AbrirTurno";
import Categorias from "./components/Categorias";
import Productos from "./components/Productos";
import Usuarios from "./components/Usuarios";
import MiPerfil from "./components/MiPerfil";
import Mesas from "./components/Mesas";
import Ventas from "./components/Ventas";
import CuadreTurno from "./components/CuadreTurno";
import Operaciones from "./components/Operaciones";
import Inventario from "./components/Inventario";
import Reportes from "./components/Reportes";
import BaseDeDatos from "./components/BaseDeDatos";
import logo from "./assets/logotipo_cliente.png";
import "./App.css";

type Tab =
  | "ventas"
  | "catalogo"
  | "gestion"
  | "mi-perfil"
  | "operaciones"
  | "inventario"
  | "reportes"
  | "base-de-datos";

function esAdmin(perfil: string) {
  return perfil === "Administrador" || perfil === "Desarrollador";
}

const TABS_ADMIN: { id: Tab; label: string; icono: typeof Coffee }[] = [
  { id: "ventas", label: "Ventas", icono: Coffee },
  { id: "catalogo", label: "Catálogo", icono: Package },
  { id: "inventario", label: "Inventario", icono: Boxes },
  { id: "gestion", label: "Gestión", icono: Users },
  { id: "operaciones", label: "Operaciones", icono: Settings },
  { id: "reportes", label: "Reportes", icono: BarChart3 },
];

const TABS_OPERATIVO: { id: Tab; label: string; icono: typeof Coffee }[] = [
  { id: "ventas", label: "Ventas", icono: Coffee },
];

type SubTabCatalogo = "categorias" | "productos";
type SubTabGestion = "mesas" | "usuarios";

function App() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [turno, setTurno] = useState<Turno | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("ventas");
  const [subTabCatalogo, setSubTabCatalogo] = useState<SubTabCatalogo>("categorias");
  const [subTabGestion, setSubTabGestion] = useState<SubTabGestion>("mesas");
  const [error, setError] = useState("");
  const [cuadreAbierto, setCuadreAbierto] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    invoke<Turno | null>("obtener_turno_abierto")
      .then(setTurno)
      .catch((e) => setError(String(e)));
  }, [usuario]);

  function cerrarSesion() {
    setUsuario(null);
    setTurno(undefined);
    setTab("ventas");
  }

  if (!usuario) {
    return <Login onIngreso={setUsuario} />;
  }

  if (turno === undefined) {
    return (
      <main className="container">
        <p className="ayuda">Cargando…</p>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  if (turno === null) {
    return <AbrirTurno onTurnoAbierto={setTurno} onError={setError} />;
  }

  if (cuadreAbierto) {
    return (
      <CuadreTurno
        idTurno={turno.id_turno}
        onCerrado={() => {
          setCuadreAbierto(false);
          setTurno(null);
        }}
        onCancelar={() => setCuadreAbierto(false)}
        onError={setError}
      />
    );
  }

  const esDesarrollador = usuario.perfil === "Desarrollador";
  const tabsDisponibles = [
    ...(esAdmin(usuario.perfil) ? TABS_ADMIN : TABS_OPERATIVO),
    ...(esDesarrollador ? [{ id: "base-de-datos" as Tab, label: "Base de Datos", icono: Database }] : []),
  ];

  return (
    <main className="container">
      <div className="barra-superior">
        <div className="marca">
          <img src={logo} alt="Maison du Café" className="marca-logo" />
          <h1>Maison du Café</h1>
        </div>
        <div className="info-sesion">
          <button
            className={`info-item btn-usuario ${tab === "mi-perfil" ? "btn-usuario-activo" : ""}`}
            onClick={() => setTab("mi-perfil")}
          >
            <User size={16} />
            {usuario.nombres} · {usuario.perfil}
          </button>
          <span className="info-item ayuda">
            <Clock size={16} />
            Turno desde {turno.apertura}
          </span>
          {esAdmin(usuario.perfil) && (
            <button className="btn-pill" onClick={() => setCuadreAbierto(true)}>
              <DoorOpen size={16} />
              Cerrar turno
            </button>
          )}
          <button className="btn-pill" onClick={cerrarSesion}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>

      <nav className="tabs">
        {tabsDisponibles.map((t) => {
          const Icono = t.icono;
          return (
            <button key={t.id} className={tab === t.id ? "tab-activo" : ""} onClick={() => setTab(t.id)}>
              <Icono size={18} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {error && <p className="error">{error}</p>}

      <div className={`panel-contenido ${tab === "ventas" ? "panel-contenido-ventas" : ""}`}>
        {tab === "ventas" && <Ventas usuario={usuario} idTurno={turno.id_turno} onError={setError} />}

        {tab === "catalogo" && (
          <section>
            <nav className="subtabs">
              <button
                className={subTabCatalogo === "categorias" ? "tab-activo" : ""}
                onClick={() => setSubTabCatalogo("categorias")}
              >
                <LayoutGrid size={16} />
                Categorías
              </button>
              <button
                className={subTabCatalogo === "productos" ? "tab-activo" : ""}
                onClick={() => setSubTabCatalogo("productos")}
              >
                <Package size={16} />
                Productos
              </button>
            </nav>
            {subTabCatalogo === "categorias" && <Categorias onError={setError} />}
            {subTabCatalogo === "productos" && <Productos onError={setError} />}
          </section>
        )}

        {tab === "inventario" && <Inventario actorId={usuario.id_usuario} onError={setError} />}

        {tab === "gestion" && (
          <section>
            <nav className="subtabs">
              <button
                className={subTabGestion === "mesas" ? "tab-activo" : ""}
                onClick={() => setSubTabGestion("mesas")}
              >
                <Armchair size={16} />
                Mesas
              </button>
              <button
                className={subTabGestion === "usuarios" ? "tab-activo" : ""}
                onClick={() => setSubTabGestion("usuarios")}
              >
                <Users size={16} />
                Usuarios
              </button>
            </nav>
            {subTabGestion === "mesas" && <Mesas onError={setError} />}
            {subTabGestion === "usuarios" && <Usuarios actorId={usuario.id_usuario} onError={setError} />}
          </section>
        )}

        {tab === "operaciones" && (
          <Operaciones idTurno={turno.id_turno} actorId={usuario.id_usuario} onError={setError} />
        )}
        {tab === "reportes" && <Reportes onError={setError} />}
        {tab === "base-de-datos" && esDesarrollador && (
          <BaseDeDatos actorId={usuario.id_usuario} onError={setError} />
        )}
        {tab === "mi-perfil" && <MiPerfil usuario={usuario} onActualizado={setUsuario} onError={setError} />}
      </div>
    </main>
  );
}

export default App;
