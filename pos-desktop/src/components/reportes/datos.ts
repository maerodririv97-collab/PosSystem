// Tipos del comando `datos_reporte` y agrupaciones que usan los reportes PDF.

export type TipoReporte = "general" | "detallado";

export interface DiaReporte {
  fecha: string;
  n_ventas: number;
  n_turnos: number;
  total: number;
  propinas: number;
}

export interface FormaPagoReporte {
  forma_pago: string;
  n_ventas: number;
  total: number;
  propinas: number;
}

export interface ProductoPeriodo {
  periodo: string; // AAAA-MM-1 | AAAA-MM-2
  producto: string;
  categoria: string;
  unidades: number;
  ingreso: number;
}

export interface VentaHora {
  dia_semana: number; // 0 = domingo
  hora: number;
  n_ventas: number;
  total: number;
}

export interface OperacionReporte {
  fecha: string;
  tipo: string;
  concepto: string;
  observacion: string;
  valor: number;
  administrador: string;
  turno: number;
}

export interface TurnoReporte {
  id_turno: number;
  apertura: string;
  cierre: string | null;
  estado: string;
  valor_inicial: number;
  valor_final: number | null;
  diferencia: number | null;
  cerrado_por: string | null;
  n_ventas: number;
  total: number;
  propinas: number;
}

export interface MeseroReporte {
  mesero: string;
  n_ventas: number;
  total: number;
  propinas: number;
}

export interface DatosReporte {
  desde: string;
  hasta: string;
  generado: string;
  dias: DiaReporte[];
  formas_pago: FormaPagoReporte[];
  productos: ProductoPeriodo[];
  horas: VentaHora[];
  operaciones: OperacionReporte[];
  turnos: TurnoReporte[];
  meseros: MeseroReporte[];
}

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Orden de la semana en tablas y gráficas: lunes primero. */
export const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];

export function dinero(n: number): string {
  const signo = n < 0 ? "-" : "";
  return `${signo}$${Math.round(Math.abs(n)).toLocaleString("es-CO")}`;
}

export function numero(n: number): string {
  return Math.round(n).toLocaleString("es-CO");
}

export function porcentaje(parte: number, total: number): string {
  if (!total) return "0%";
  return `${((parte / total) * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })}%`;
}

/** Etiqueta corta para ejes y mapas de calor: 1,2 M · 350 k · 900. */
export function compacto(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  if (a >= 1_000) return `${Math.round(n / 1_000).toLocaleString("es-CO")} k`;
  return Math.round(n).toLocaleString("es-CO");
}

function aFecha(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
}

function aIso(f: Date): string {
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

/** "14 de mayo de 2026" */
export function fechaLarga(iso: string): string {
  const f = aFecha(iso);
  return `${f.getDate()} de ${MESES[f.getMonth()].toLowerCase()} de ${f.getFullYear()}`;
}

/** "14/05/2026" */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** "sáb 14 may" */
export function fechaDia(iso: string): string {
  const f = aFecha(iso);
  return `${DIAS_SEMANA[f.getDay()].slice(0, 3).toLowerCase()} ${f.getDate()} ${MESES[f.getMonth()].slice(0, 3).toLowerCase()}`;
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / 86_400_000) + 1;
}

// ---------------------------------------------------------------------------
// Agrupaciones
// ---------------------------------------------------------------------------

export interface Resumen {
  total: number;
  n_ventas: number;
  propinas: number;
  ticket: number;
  dias_con_venta: number;
  promedio_diario: number;
}

export function resumen(d: DatosReporte): Resumen {
  const total = d.dias.reduce((s, x) => s + x.total, 0);
  const n_ventas = d.dias.reduce((s, x) => s + x.n_ventas, 0);
  const propinas = d.dias.reduce((s, x) => s + x.propinas, 0);
  return {
    total,
    n_ventas,
    propinas,
    ticket: n_ventas ? total / n_ventas : 0,
    dias_con_venta: d.dias.length,
    promedio_diario: d.dias.length ? total / d.dias.length : 0,
  };
}

/** Rango efectivo: no pasa de hoy (un mes en curso se marca como parcial). */
function finEfectivo(hasta: string): string {
  const hoy = aIso(new Date());
  return hasta < hoy ? hasta : hoy;
}

export interface FilaPeriodo {
  clave: string;
  etiqueta: string;
  etiquetaCorta: string;
  parcial: boolean;
  n_ventas: number;
  total: number;
  propinas: number;
  ticket: number;
}

/** Ventas por mes. Un mes que el rango no cubre completo se marca "(d1-d2, parcial)". */
export function ventasPorMes(d: DatosReporte): FilaPeriodo[] {
  const fin = finEfectivo(d.hasta);
  const grupos = new Map<string, FilaPeriodo>();
  // Recorre todos los meses del rango para mostrar también los meses sin ventas.
  const cursor = aFecha(d.desde);
  cursor.setDate(1);
  // Los meses futuros (después de hoy) no se listan.
  while (aIso(cursor).slice(0, 7) <= fin.slice(0, 7)) {
    const clave = aIso(cursor).slice(0, 7);
    const ultimo = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const ini = d.desde.slice(0, 7) === clave ? aFecha(d.desde).getDate() : 1;
    const hastaDia = fin.slice(0, 7) === clave ? aFecha(fin).getDate() : ultimo;
    const parcial = ini > 1 || hastaDia < ultimo;
    const nombre = `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    grupos.set(clave, {
      clave,
      etiqueta: parcial ? `${nombre} (${ini}-${hastaDia}, parcial)` : nombre,
      etiquetaCorta: MESES[cursor.getMonth()].slice(0, 3) + (parcial ? "*" : ""),
      parcial,
      n_ventas: 0,
      total: 0,
      propinas: 0,
      ticket: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const x of d.dias) {
    const g = grupos.get(x.fecha.slice(0, 7));
    if (!g) continue;
    g.n_ventas += x.n_ventas;
    g.total += x.total;
    g.propinas += x.propinas;
  }
  const filas = [...grupos.values()];
  for (const f of filas) f.ticket = f.n_ventas ? f.total / f.n_ventas : 0;
  return filas;
}

export function ventasPorDia(d: DatosReporte): FilaPeriodo[] {
  return d.dias.map((x) => ({
    clave: x.fecha,
    etiqueta: fechaDia(x.fecha),
    etiquetaCorta: String(aFecha(x.fecha).getDate()),
    parcial: false,
    n_ventas: x.n_ventas,
    total: x.total,
    propinas: x.propinas,
    ticket: x.n_ventas ? x.total / x.n_ventas : 0,
  }));
}

export interface FilaQuincena {
  clave: string; // AAAA-MM-1 | AAAA-MM-2
  mes: string;
  quincena: string;
  etiquetaCorta: string;
  segunda: boolean;
  n_ventas: number;
  propinas: number;
  total: number;
}

function claveQuincena(fecha: string): string {
  return `${fecha.slice(0, 7)}-${Number(fecha.slice(8, 10)) <= 15 ? 1 : 2}`;
}

export function etiquetaQuincena(clave: string, d: DatosReporte): { mes: string; quincena: string; corta: string } {
  const [a, m, q] = clave.split("-").map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  let ini = q === 1 ? 1 : 16;
  let fin = q === 1 ? 15 : ultimo;
  const mesClave = `${a}-${String(m).padStart(2, "0")}`;
  const finRango = finEfectivo(d.hasta);
  if (d.desde.slice(0, 7) === mesClave) ini = Math.max(ini, Number(d.desde.slice(8, 10)));
  if (finRango.slice(0, 7) === mesClave) fin = Math.min(fin, Number(finRango.slice(8, 10)));
  const completo = ini === (q === 1 ? 1 : 16) && fin === (q === 1 ? 15 : ultimo);
  return {
    mes: `${MESES[m - 1]} ${a}`,
    quincena: `${q === 1 ? "1ra" : "2da"} (${ini}-${fin}${completo ? "" : ", parcial"})`,
    corta: `${MESES[m - 1].slice(0, 3)} Q${q}`,
  };
}

export function propinasPorQuincena(d: DatosReporte): FilaQuincena[] {
  const grupos = new Map<string, FilaQuincena>();
  for (const x of d.dias) {
    const clave = claveQuincena(x.fecha);
    let g = grupos.get(clave);
    if (!g) {
      const e = etiquetaQuincena(clave, d);
      g = {
        clave,
        mes: e.mes,
        quincena: e.quincena,
        etiquetaCorta: e.corta,
        segunda: clave.endsWith("-2"),
        n_ventas: 0,
        propinas: 0,
        total: 0,
      };
      grupos.set(clave, g);
    }
    g.n_ventas += x.n_ventas;
    g.propinas += x.propinas;
    g.total += x.total;
  }
  return [...grupos.values()].sort((a, b) => a.clave.localeCompare(b.clave));
}

export interface FilaProducto {
  producto: string;
  categoria: string;
  unidades: number;
  ingreso: number;
}

function sumarProductos(filas: ProductoPeriodo[]): FilaProducto[] {
  const m = new Map<string, FilaProducto>();
  for (const p of filas) {
    const g = m.get(p.producto) ?? { producto: p.producto, categoria: p.categoria, unidades: 0, ingreso: 0 };
    g.unidades += p.unidades;
    g.ingreso += p.ingreso;
    m.set(p.producto, g);
  }
  return [...m.values()].sort((a, b) => b.unidades - a.unidades || b.ingreso - a.ingreso);
}

export function rankingProductos(d: DatosReporte): FilaProducto[] {
  return sumarProductos(d.productos);
}

export interface RankingQuincena {
  clave: string;
  titulo: string;
  mas: FilaProducto[];
  menos: FilaProducto[];
}

/** Top 5 más vendidos y 5 menos vendidos (con al menos 1 venta) de cada quincena. */
export function productosPorQuincena(d: DatosReporte, n = 5): RankingQuincena[] {
  const claves = [...new Set(d.productos.map((p) => p.periodo))].sort();
  return claves.map((clave) => {
    const lista = sumarProductos(d.productos.filter((p) => p.periodo === clave));
    const e = etiquetaQuincena(clave, d);
    const menos = [...lista]
      .sort((a, b) => a.unidades - b.unidades || a.ingreso - b.ingreso)
      .filter((p) => !lista.slice(0, n).includes(p))
      .slice(0, n);
    return { clave, titulo: `${e.mes.split(" ")[0]} — ${e.quincena.replace(" (", " quincena (")}`, mas: lista.slice(0, n), menos };
  });
}

export interface FilaCategoria {
  categoria: string;
  unidades: number;
  ingreso: number;
}

export function ventasPorCategoria(d: DatosReporte): FilaCategoria[] {
  const m = new Map<string, FilaCategoria>();
  for (const p of d.productos) {
    const nombre = p.categoria || "Sin categoría";
    const g = m.get(nombre) ?? { categoria: nombre, unidades: 0, ingreso: 0 };
    g.unidades += p.unidades;
    g.ingreso += p.ingreso;
    m.set(nombre, g);
  }
  return [...m.values()].sort((a, b) => b.ingreso - a.ingreso);
}

export interface FilaDiaSemana {
  dia: number;
  nombre: string;
  veces: number;
  n_ventas: number;
  total: number;
  promedio: number;
}

/** Promedio por día de la semana: total / número de días con ventas de ese día. */
export function ventasPorDiaSemana(d: DatosReporte): FilaDiaSemana[] {
  const filas = ORDEN_SEMANA.map((dia) => ({ dia, nombre: DIAS_SEMANA[dia], veces: 0, n_ventas: 0, total: 0, promedio: 0 }));
  for (const x of d.dias) {
    const f = filas.find((r) => r.dia === aFecha(x.fecha).getDay())!;
    f.veces += 1;
    f.n_ventas += x.n_ventas;
    f.total += x.total;
  }
  for (const f of filas) f.promedio = f.veces ? f.total / f.veces : 0;
  return filas;
}

export interface MapaCalor {
  horas: number[];
  /** valores[dia_semana][hora] = venta promedio en esa hora */
  valores: Record<number, Record<number, number>>;
  maximo: number;
  picos: { dia: number; hora: number; promedio: number }[];
}

export function mapaCalor(d: DatosReporte): MapaCalor {
  const veces = new Map<number, number>();
  for (const x of d.dias) {
    const dia = aFecha(x.fecha).getDay();
    veces.set(dia, (veces.get(dia) ?? 0) + 1);
  }
  const valores: MapaCalor["valores"] = {};
  let maximo = 0;
  for (const h of d.horas) {
    const prom = h.total / (veces.get(h.dia_semana) || 1);
    (valores[h.dia_semana] ??= {})[h.hora] = prom;
    maximo = Math.max(maximo, prom);
  }
  const horasUsadas = d.horas.map((h) => h.hora);
  const horas: number[] = [];
  if (horasUsadas.length) {
    for (let h = Math.min(...horasUsadas); h <= Math.max(...horasUsadas); h++) horas.push(h);
  }
  const picos = ORDEN_SEMANA.filter((dia) => valores[dia]).map((dia) => {
    const [hora, promedio] = Object.entries(valores[dia]).reduce(
      (mejor, [h, v]) => (v > mejor[1] ? [Number(h), v] : mejor),
      [0, -1] as [number, number],
    );
    return { dia, hora, promedio };
  });
  return { horas, valores, maximo, picos };
}

export function rangoHora(h: number): string {
  const f = (x: number) => {
    const h12 = x % 12 === 0 ? 12 : x % 12;
    return `${h12}:00`;
  };
  return `${f(h)} - ${f(h + 1)} ${h + 1 < 12 || h + 1 === 24 ? "a.m." : "p.m."}`;
}

export interface FilaOperacionesMes {
  clave: string;
  etiqueta: string;
  etiquetaCorta: string;
  ingresos: number;
  egresos: number;
}

export function operacionesPorMes(d: DatosReporte): FilaOperacionesMes[] {
  const meses = ventasPorMes(d);
  const filas = meses.map((m) => ({ clave: m.clave, etiqueta: m.etiqueta, etiquetaCorta: m.etiquetaCorta, ingresos: 0, egresos: 0 }));
  for (const o of d.operaciones) {
    const f = filas.find((x) => x.clave === o.fecha.slice(0, 7));
    if (!f) continue;
    if (o.tipo === "Ingreso") f.ingresos += o.valor;
    else f.egresos += o.valor;
  }
  return filas;
}

export interface FilaConcepto {
  tipo: string;
  concepto: string;
  cantidad: number;
  total: number;
}

export function operacionesPorConcepto(d: DatosReporte): FilaConcepto[] {
  const m = new Map<string, FilaConcepto>();
  for (const o of d.operaciones) {
    const clave = `${o.tipo}|${o.concepto}`;
    const g = m.get(clave) ?? { tipo: o.tipo, concepto: o.concepto, cantidad: 0, total: 0 };
    g.cantidad += 1;
    g.total += o.valor;
    m.set(clave, g);
  }
  return [...m.values()].sort((a, b) => b.tipo.localeCompare(a.tipo) || b.total - a.total);
}

/** "mayo - agosto 2026" / "14 al 20 de mayo de 2026" */
export function descripcionPeriodo(desde: string, hasta: string): string {
  if (desde === hasta) return fechaLarga(desde);
  return `${fechaLarga(desde)} al ${fechaLarga(hasta)}`;
}

export function nombreArchivo(tipo: TipoReporte, desde: string, hasta: string): string {
  const t = tipo === "general" ? "General" : "Detallado";
  return `Reporte_${t}_MaisonDuCafe_${desde}_a_${hasta}.pdf`;
}
