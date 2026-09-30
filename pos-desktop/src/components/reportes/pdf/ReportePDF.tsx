// Documento PDF de los reportes General y Detallado de Maison du Café.
// Se carga de forma diferida (import dinámico) porque @react-pdf/renderer es pesado.
import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import {
  DatosReporte,
  TipoReporte,
  compacto,
  descripcionPeriodo,
  diasEntre,
  dinero,
  fechaCorta,
  fechaDia,
  fechaLarga,
  numero,
  operacionesPorConcepto,
  operacionesPorMes,
  porcentaje,
  productosPorQuincena,
  propinasPorQuincena,
  rangoHora,
  rankingProductos,
  resumen,
  ventasPorCategoria,
  ventasPorDia,
  ventasPorDiaSemana,
  ventasPorMes,
  mapaCalor,
  DIAS_SEMANA,
  ORDEN_SEMANA,
} from "../datos";
import { GraficoColumnas, GraficoColumnasPares, GraficoMapaCalor } from "./graficos";
import { COLOR, FUENTE, LOGO, registrarFuentes } from "./tema";

const ALTO_A4 = 841.89;

const s = StyleSheet.create({
  pagina: {
    paddingTop: 34,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: FUENTE.cuerpo,
    fontSize: 8.5,
    color: COLOR.texto,
    lineHeight: 1.4,
  },
  portada: {
    marginTop: -34,
    marginHorizontal: -40,
    paddingVertical: 22,
    paddingHorizontal: 40,
    backgroundColor: COLOR.primario,
    borderBottomWidth: 3,
    borderBottomColor: COLOR.dorado,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: { width: 70, height: 70, marginRight: 18 },
  titulo: { fontFamily: FUENTE.titulo, fontWeight: 700, fontSize: 22, color: COLOR.doradoSuave, lineHeight: 1.4 },
  subtitulo: { color: "#cbd6cd", fontSize: 9, marginTop: 2 },
  periodo: { color: COLOR.dorado, fontSize: 9, fontWeight: 600, marginTop: 6 },
  kpis: { flexDirection: "row", marginTop: 16, marginBottom: 4 },
  kpi: {
    flex: 1,
    backgroundColor: COLOR.crema,
    borderWidth: 1,
    borderColor: COLOR.borde,
    borderTopWidth: 3,
    borderTopColor: COLOR.dorado,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  kpiEtiqueta: { fontSize: 6.8, color: COLOR.textoSuave, textTransform: "uppercase", letterSpacing: 0.6 },
  kpiValor: { fontSize: 15, fontWeight: 700, color: COLOR.primario, marginTop: 3, lineHeight: 1.3 },
  kpiNota: { fontSize: 6.8, color: COLOR.textoSuave, marginTop: 2 },
  seccion: { marginTop: 18 },
  seccionTitulo: { fontFamily: FUENTE.titulo, fontWeight: 700, fontSize: 14, color: COLOR.primario, lineHeight: 1.5 },
  seccionRaya: { width: 36, height: 2, backgroundColor: COLOR.dorado, marginTop: 2, marginBottom: 6 },
  descripcion: { color: COLOR.textoSuave, marginBottom: 8 },
  nota: { fontFamily: FUENTE.titulo, fontStyle: "italic", fontWeight: 400, color: COLOR.textoSuave, fontSize: 8.5, marginTop: 6 },
  subtitulo2: { fontSize: 9.5, fontWeight: 600, color: COLOR.primario, marginTop: 10, marginBottom: 4 },
  // Sin borderRadius: react-pdf falla al partir entre páginas una vista con bordes redondeados.
  tabla: { borderWidth: 1, borderColor: COLOR.borde, marginTop: 4 },
  filaEncabezado: { flexDirection: "row", backgroundColor: COLOR.primario },
  celdaEncabezado: { paddingVertical: 5, paddingHorizontal: 6, color: COLOR.doradoSuave, fontSize: 7.2, fontWeight: 600 },
  fila: { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLOR.borde },
  celda: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 7.8 },
  bloqueQuincena: { marginTop: 8 },
  bloqueQuincenaTitulo: {
    backgroundColor: COLOR.dorado,
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 8.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  vacio: { marginTop: 30, padding: 20, backgroundColor: COLOR.crema, borderRadius: 6, textAlign: "center", color: COLOR.textoSuave },
  // Pie con top/height fijos: con `bottom` react-pdf calcula mal la posición en documentos largos.
  pie: {
    position: "absolute",
    top: ALTO_A4 - 38,
    height: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLOR.borde,
    paddingTop: 5,
    fontSize: 7,
    color: COLOR.textoSuave,
  },
  paginacion: { position: "absolute", top: ALTO_A4 - 32, right: 40, fontSize: 7, color: COLOR.textoSuave },
});

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------

interface Columna {
  titulo: string;
  ancho: number; // proporción (flex)
  alinear?: "left" | "right" | "center";
}

interface FilaTabla {
  celdas: string[];
  total?: boolean;
  fondo?: string;
}

function Tabla({ columnas, filas }: { columnas: Columna[]; filas: FilaTabla[] }) {
  return (
    <View style={s.tabla}>
      <View style={s.filaEncabezado} fixed minPresenceAhead={60}>
        {columnas.map((c, i) => (
          <Text key={i} style={[s.celdaEncabezado, { flex: c.ancho, textAlign: c.alinear ?? "left" }]}>
            {c.titulo}
          </Text>
        ))}
      </View>
      {filas.map((f, r) => (
        <View
          key={r}
          wrap={false}
          style={[s.fila, { backgroundColor: f.fondo ?? (f.total ? COLOR.superficieSuave : r % 2 ? COLOR.crema : "#ffffff") }]}
        >
          {f.celdas.map((texto, i) => (
            <Text
              key={i}
              style={[
                s.celda,
                { flex: columnas[i].ancho, textAlign: columnas[i].alinear ?? "left" },
                f.total ? { fontWeight: 700 } : {},
              ]}
            >
              {texto}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Título + descripción + contenido. El encabezado nunca queda solo al final de una página. */
function Seccion({
  n,
  titulo,
  descripcion,
  grafico,
  children,
}: {
  n: number;
  titulo: string;
  descripcion?: string;
  /** Gráfica que va pegada al título (nunca se separan entre páginas). */
  grafico?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={s.seccion}>
      <View minPresenceAhead={140} wrap={false}>
        <Text style={s.seccionTitulo}>{`${n}. ${titulo}`}</Text>
        <View style={s.seccionRaya} />
        {descripcion && <Text style={s.descripcion}>{descripcion}</Text>}
        {grafico}
      </View>
      {children}
    </View>
  );
}

function Nota({ children }: { children: string }) {
  return <Text style={s.nota}>{children}</Text>;
}

function Leyenda({ items }: { items: { color: string; texto: string }[] }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 4 }}>
      {items.map((it) => (
        <View key={it.texto} style={{ flexDirection: "row", alignItems: "center", marginRight: 14 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: it.color, marginRight: 4 }} />
          <Text style={{ fontSize: 7, color: COLOR.texto }}>{it.texto}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

function SeccionVentasPeriodo({ n, d }: { n: number; d: DatosReporte }) {
  const porDia = diasEntre(d.desde, d.hasta) <= 31;
  const filas = porDia ? ventasPorDia(d) : ventasPorMes(d);
  const r = resumen(d);
  const mejor = [...filas].sort((a, b) => b.total - a.total)[0];
  const peor = [...filas].filter((f) => !f.parcial).sort((a, b) => a.total - b.total)[0];
  return (
    <Seccion
      n={n}
      titulo={porDia ? "Ventas por Día" : "Ventas Totales por Mes"}
      descripcion={`Ventas pagadas (sin propinas) agrupadas por ${porDia ? "día" : "mes"}. ${
        porDia ? "" : "Los meses que el período no cubre completos se marcan como parciales (*)."
      }`}
      grafico={
        <>
        <GraficoColumnas
          datos={filas.map((f) => ({
            etiqueta: f.etiquetaCorta,
            valor: f.total,
            color: f.parcial ? COLOR.serie2 : COLOR.serie1,
            nota: porDia ? undefined : `(${numero(f.n_ventas)} ventas)`,
          }))}
        />
        {!porDia && filas.some((f) => f.parcial) && (
          <Leyenda
            items={[
              { color: COLOR.serie1, texto: "Mes completo" },
              { color: COLOR.serie2, texto: "Mes parcial" },
            ]}
          />
        )}
        </>
      }
    >
      <Tabla
        columnas={[
          { titulo: porDia ? "Día" : "Mes", ancho: 3 },
          { titulo: "N° de ventas", ancho: 1.3, alinear: "center" },
          { titulo: "Total vendido", ancho: 1.8, alinear: "right" },
          { titulo: "Ticket promedio", ancho: 1.6, alinear: "right" },
          { titulo: "Propinas", ancho: 1.5, alinear: "right" },
        ]}
        filas={[
          ...filas.map((f) => ({
            celdas: [f.etiqueta, numero(f.n_ventas), dinero(f.total), dinero(f.ticket), dinero(f.propinas)],
          })),
          { celdas: ["Total", numero(r.n_ventas), dinero(r.total), dinero(r.ticket), dinero(r.propinas)], total: true },
        ]}
      />
      {mejor && mejor.total > 0 && (
        <Nota>
          {`${porDia ? "El día" : "El mes"} de mayor venta fue ${mejor.etiqueta.replace(/ \(.*\)/, "")} con ${dinero(mejor.total)} en ${numero(
            mejor.n_ventas,
          )} ventas (ticket promedio ${dinero(mejor.ticket)}).${
            peor && peor !== mejor ? ` El más bajo fue ${peor.etiqueta.replace(/ \(.*\)/, "")} con ${dinero(peor.total)}.` : ""
          } Promedio por día con ventas: ${dinero(r.promedio_diario)}.`}
        </Nota>
      )}
    </Seccion>
  );
}

function SeccionVentaDiariaTurnos({ n, d }: { n: number; d: DatosReporte }) {
  const total = resumen(d);
  const turnos = d.dias.reduce((s, x) => s + x.n_turnos, 0);
  const mejor = [...d.dias].sort((a, b) => b.total - a.total)[0];
  const peor = [...d.dias].sort((a, b) => a.total - b.total)[0];
  return (
    <Seccion
      n={n}
      titulo="Venta Diaria por Turnos"
      descripcion="Total vendido por día, con el número de turnos que registraron ventas ese día (puede haber más de un turno por cambios durante el día)."
      grafico={
        <>
        <GraficoColumnas
          datos={d.dias.map((x) => ({
            etiqueta: fechaCorta(x.fecha).slice(0, 5),
            valor: x.total,
            nota: `(${x.n_turnos} turno${x.n_turnos === 1 ? "" : "s"})`,
          }))}
          rotularTodas={d.dias.length <= 10}
        />
        </>
      }
    >
      <Tabla
        columnas={[
          { titulo: "Día", ancho: 2.2 },
          { titulo: "N° turnos", ancho: 1, alinear: "center" },
          { titulo: "N° ventas", ancho: 1, alinear: "center" },
          { titulo: "Total vendido", ancho: 1.6, alinear: "right" },
          { titulo: "Propinas", ancho: 1.4, alinear: "right" },
        ]}
        filas={[
          ...d.dias.map((x) => ({
            celdas: [fechaDia(x.fecha), numero(x.n_turnos), numero(x.n_ventas), dinero(x.total), dinero(x.propinas)],
          })),
          { celdas: ["Total", numero(turnos), numero(total.n_ventas), dinero(total.total), dinero(total.propinas)], total: true },
        ]}
      />
      {mejor && peor && mejor !== peor && (
        <Nota>{`El ${fechaLarga(mejor.fecha)} fue el día de mayor venta (${dinero(mejor.total)} en ${mejor.n_turnos} turno(s)); el ${fechaLarga(
          peor.fecha,
        )} registró la venta más baja (${dinero(peor.total)}).`}</Nota>
      )}
    </Seccion>
  );
}

function SeccionFormasPago({ n, d }: { n: number; d: DatosReporte }) {
  const r = resumen(d);
  return (
    <Seccion n={n} titulo="Ventas por Forma de Pago" descripcion="Distribución de las ventas pagadas según el medio de pago registrado al cobrar.">
      <Tabla
        columnas={[
          { titulo: "Forma de pago", ancho: 2.4 },
          { titulo: "N° ventas", ancho: 1.1, alinear: "center" },
          { titulo: "Total vendido", ancho: 1.7, alinear: "right" },
          { titulo: "% del total", ancho: 1.2, alinear: "right" },
          { titulo: "Propinas", ancho: 1.5, alinear: "right" },
        ]}
        filas={[
          ...d.formas_pago.map((f) => ({
            celdas: [f.forma_pago, numero(f.n_ventas), dinero(f.total), porcentaje(f.total, r.total), dinero(f.propinas)],
          })),
          { celdas: ["Total", numero(r.n_ventas), dinero(r.total), "100%", dinero(r.propinas)], total: true },
        ]}
      />
    </Seccion>
  );
}

function SeccionPropinas({ n, d }: { n: number; d: DatosReporte }) {
  const filas = propinasPorQuincena(d);
  const r = resumen(d);
  const mejor = [...filas].sort((a, b) => b.propinas - a.propinas)[0];
  return (
    <Seccion
      n={n}
      titulo="Propinas por Quincena"
      descripcion="Valor de propinas agrupado por quincena de cada mes (1ra: días 1-15, 2da: día 16 a fin de mes), sobre ventas pagadas."
      grafico={
        <>
        <Leyenda
          items={[
            { color: COLOR.serie1, texto: "1ra quincena (1-15)" },
            { color: COLOR.serie2, texto: "2da quincena (16-fin)" },
          ]}
        />
        <GraficoColumnas
          datos={filas.map((f) => ({ etiqueta: f.etiquetaCorta, valor: f.propinas, color: f.segunda ? COLOR.serie2 : COLOR.serie1 }))}
          alto={170}
        />
        </>
      }
    >
      <Tabla
        columnas={[
          { titulo: "Mes", ancho: 2 },
          { titulo: "Quincena", ancho: 2 },
          { titulo: "N° de ventas", ancho: 1.2, alinear: "center" },
          { titulo: "% propina / venta", ancho: 1.4, alinear: "right" },
          { titulo: "Total propinas", ancho: 1.6, alinear: "right" },
        ]}
        filas={[
          ...filas.map((f) => ({
            celdas: [f.mes, f.quincena, numero(f.n_ventas), porcentaje(f.propinas, f.total), dinero(f.propinas)],
          })),
          { celdas: ["Total general", "", numero(r.n_ventas), porcentaje(r.propinas, r.total), dinero(r.propinas)], total: true },
        ]}
      />
      {mejor && mejor.propinas > 0 && (
        <Nota>{`La quincena con más propinas fue ${mejor.mes} ${mejor.quincena} con ${dinero(mejor.propinas)}. En todo el período las propinas equivalen al ${porcentaje(
          r.propinas,
          r.total,
        )} de lo vendido.`}</Nota>
      )}
    </Seccion>
  );
}

function SeccionTopProductos({ n, d, cantidad }: { n: number; d: DatosReporte; cantidad: number }) {
  const lista = rankingProductos(d);
  const ingresoTotal = lista.reduce((s, p) => s + p.ingreso, 0);
  const top = lista.slice(0, cantidad);
  const porIngreso = [...lista].sort((a, b) => b.ingreso - a.ingreso)[0];
  return (
    <Seccion
      n={n}
      titulo={`Top ${cantidad} Productos Más Vendidos`}
      descripcion={`Ranking por unidades vendidas en todo el período. Se vendieron ${lista.length} productos distintos.`}
    >
      <Tabla
        columnas={[
          { titulo: "#", ancho: 0.4, alinear: "center" },
          { titulo: "Producto", ancho: 3 },
          { titulo: "Categoría", ancho: 2 },
          { titulo: "Unid.", ancho: 0.9, alinear: "center" },
          { titulo: "Ingreso", ancho: 1.5, alinear: "right" },
          { titulo: "% ingreso", ancho: 1.1, alinear: "right" },
        ]}
        filas={top.map((p, i) => ({
          celdas: [String(i + 1), p.producto, p.categoria, numero(p.unidades), dinero(p.ingreso), porcentaje(p.ingreso, ingresoTotal)],
        }))}
      />
      {porIngreso && (
        <Nota>{`El producto que más dinero generó fue ${porIngreso.producto} (${dinero(porIngreso.ingreso)}, ${porcentaje(
          porIngreso.ingreso,
          ingresoTotal,
        )} del ingreso por productos). Los ${top.length} primeros suman el ${porcentaje(
          top.reduce((s, p) => s + p.ingreso, 0),
          ingresoTotal,
        )} del ingreso.`}</Nota>
      )}
    </Seccion>
  );
}

function SeccionCategorias({ n, d }: { n: number; d: DatosReporte }) {
  const filas = ventasPorCategoria(d);
  const total = filas.reduce((s, f) => s + f.ingreso, 0);
  return (
    <Seccion n={n} titulo="Ventas por Categoría" descripcion="Unidades e ingresos agrupados por la categoría de cada producto.">
      <Tabla
        columnas={[
          { titulo: "Categoría", ancho: 3 },
          { titulo: "Unidades", ancho: 1.2, alinear: "center" },
          { titulo: "Ingreso", ancho: 1.6, alinear: "right" },
          { titulo: "% del ingreso", ancho: 1.3, alinear: "right" },
        ]}
        filas={[
          ...filas.map((f) => ({ celdas: [f.categoria, numero(f.unidades), dinero(f.ingreso), porcentaje(f.ingreso, total)] })),
          { celdas: ["Total", numero(filas.reduce((s, f) => s + f.unidades, 0)), dinero(total), "100%"], total: true },
        ]}
      />
    </Seccion>
  );
}

function SeccionProductosQuincena({ n, d }: { n: number; d: DatosReporte }) {
  const bloques = productosPorQuincena(d);
  const columnas: Columna[] = [
    { titulo: "Top 5 más vendidos", ancho: 2.6 },
    { titulo: "Unid.", ancho: 0.7, alinear: "center" },
    { titulo: "Ingreso", ancho: 1.2, alinear: "right" },
    { titulo: "Top 5 menos vendidos", ancho: 2.6 },
    { titulo: "Unid.", ancho: 0.7, alinear: "center" },
    { titulo: "Ingreso", ancho: 1.2, alinear: "right" },
  ];
  return (
    <Seccion
      n={n}
      titulo="Productos Más y Menos Vendidos por Quincena"
      descripcion={`Ranking por unidades dentro de cada quincena. "Menos vendidos" son los de menor rotación entre los que tuvieron al menos una venta (no incluye productos sin ventas).`}
    >
      {bloques.map((b) => (
        <View key={b.clave} style={s.bloqueQuincena} wrap={false}>
          <Text style={s.bloqueQuincenaTitulo}>{b.titulo}</Text>
          <Tabla
            columnas={columnas}
            filas={Array.from({ length: Math.max(b.mas.length, b.menos.length) }, (_, i) => {
              const a = b.mas[i];
              const z = b.menos[i];
              return {
                celdas: [
                  a?.producto ?? "",
                  a ? numero(a.unidades) : "",
                  a ? dinero(a.ingreso) : "",
                  z?.producto ?? "",
                  z ? numero(z.unidades) : "",
                  z ? dinero(z.ingreso) : "",
                ],
              };
            })}
          />
        </View>
      ))}
    </Seccion>
  );
}

function SeccionMeseros({ n, d }: { n: number; d: DatosReporte }) {
  const r = resumen(d);
  return (
    <Seccion n={n} titulo="Ventas por Mesero" descripcion="Ventas pagadas y propinas según el usuario que atendió cada mesa.">
      <Tabla
        columnas={[
          { titulo: "Mesero", ancho: 2.6 },
          { titulo: "N° ventas", ancho: 1, alinear: "center" },
          { titulo: "Total vendido", ancho: 1.6, alinear: "right" },
          { titulo: "% del total", ancho: 1.1, alinear: "right" },
          { titulo: "Ticket promedio", ancho: 1.5, alinear: "right" },
          { titulo: "Propinas", ancho: 1.4, alinear: "right" },
        ]}
        filas={d.meseros.map((m) => ({
          celdas: [
            m.mesero,
            numero(m.n_ventas),
            dinero(m.total),
            porcentaje(m.total, r.total),
            dinero(m.n_ventas ? m.total / m.n_ventas : 0),
            dinero(m.propinas),
          ],
        }))}
      />
    </Seccion>
  );
}

function SeccionDiaSemana({ n, d }: { n: number; d: DatosReporte }) {
  const filas = ventasPorDiaSemana(d).filter((f) => f.veces > 0);
  const ordenadas = [...filas].sort((a, b) => b.promedio - a.promedio);
  const mejor = ordenadas[0];
  const peor = ordenadas[ordenadas.length - 1];
  const color = (dia: number) => (dia === mejor?.dia ? COLOR.serie2 : dia === peor?.dia ? COLOR.serie3 : COLOR.serie1);
  return (
    <Seccion
      n={n}
      titulo="Mejor y Peor Día de la Semana"
      descripcion="Promedio de venta diaria por día de la semana: total vendido dividido entre el número de días con ventas de ese día, para comparar de forma justa."
      grafico={
        <>
        <Leyenda
          items={[
            { color: COLOR.serie2, texto: "Mejor día" },
            { color: COLOR.serie3, texto: "Peor día" },
            { color: COLOR.serie1, texto: "Otros días" },
          ]}
        />
        <GraficoColumnas
          datos={filas.map((f) => ({
            etiqueta: f.nombre,
            valor: f.promedio,
            color: color(f.dia),
            nota: `(${f.veces} día${f.veces === 1 ? "" : "s"})`,
          }))}
          alto={170}
        />
        </>
      }
    >
      <Tabla
        columnas={[
          { titulo: "Día", ancho: 1.8 },
          { titulo: "N° de días", ancho: 1, alinear: "center" },
          { titulo: "N° ventas", ancho: 1, alinear: "center" },
          { titulo: "Total vendido", ancho: 1.6, alinear: "right" },
          { titulo: "Promedio diario", ancho: 1.6, alinear: "right" },
        ]}
        filas={ordenadas.map((f) => ({
          celdas: [f.nombre, numero(f.veces), numero(f.n_ventas), dinero(f.total), dinero(f.promedio)],
          fondo: f.dia === mejor?.dia ? COLOR.doradoSuave : f.dia === peor?.dia ? COLOR.resaltadoMalo : undefined,
        }))}
      />
      {mejor && peor && mejor !== peor && (
        <Nota>{`El ${mejor.nombre.toLowerCase()} es el mejor día con ${dinero(mejor.promedio)} en promedio${
          ordenadas[1] ? `, ${porcentaje(mejor.promedio - ordenadas[1].promedio, ordenadas[1].promedio)} más que el segundo (${ordenadas[1].nombre.toLowerCase()})` : ""
        }. El ${peor.nombre.toLowerCase()} es el más flojo con ${dinero(peor.promedio)}${
          peor.veces < mejor.veces / 2 ? ` (ojo: solo tuvo ventas ${peor.veces === 1 ? "1 vez" : `${peor.veces} veces`} en el período)` : ""
        }.`}</Nota>
      )}
    </Seccion>
  );
}

function SeccionHorarios({ n, d }: { n: number; d: DatosReporte }) {
  const m = mapaCalor(d);
  const filas = ORDEN_SEMANA.filter((dia) => m.valores[dia]).map((dia) => ({ dia, nombre: DIAS_SEMANA[dia] }));
  const top = [...m.picos].sort((a, b) => b.promedio - a.promedio)[0];
  return (
    <Seccion
      n={n}
      titulo="Mejores Horarios de Venta"
      descripcion="Mapa de calor con la venta promedio por hora dentro de cada día de la semana (más oscuro = más venta). Útil para planear los turnos del personal."
      grafico={
        <>
        <GraficoMapaCalor filas={filas} horas={m.horas} maximo={m.maximo} valor={(dia, h) => m.valores[dia]?.[h]} />
        <Text style={{ fontSize: 6.5, color: COLOR.textoSuave, marginTop: 2 }}>
          {`Escala: crema = $0 · verde oscuro = $${compacto(m.maximo)} promedio por hora.`}
        </Text>
        </>
      }
    >
      <Tabla
        columnas={[
          { titulo: "Día", ancho: 1.5 },
          { titulo: "Horario pico", ancho: 2, alinear: "center" },
          { titulo: "Venta promedio en esa hora", ancho: 2, alinear: "right" },
        ]}
        filas={m.picos.map((p) => ({
          celdas: [DIAS_SEMANA[p.dia], rangoHora(p.hora), dinero(p.promedio)],
          fondo: p === top ? COLOR.doradoSuave : undefined,
        }))}
      />
      {top && <Nota>{`La hora más fuerte de la semana es el ${DIAS_SEMANA[top.dia].toLowerCase()} de ${rangoHora(top.hora)}, con ${dinero(top.promedio)} en promedio.`}</Nota>}
    </Seccion>
  );
}

function SeccionOperaciones({ n, d, detallado }: { n: number; d: DatosReporte; detallado: boolean }) {
  const conceptos = operacionesPorConcepto(d);
  const meses = operacionesPorMes(d);
  const ingresos = d.operaciones.filter((o) => o.tipo === "Ingreso").reduce((s, o) => s + o.valor, 0);
  const egresos = d.operaciones.filter((o) => o.tipo !== "Ingreso").reduce((s, o) => s + o.valor, 0);
  const cierres = conceptos.filter((c) => c.tipo !== "Ingreso" && /cierre/i.test(c.concepto)).reduce((s, c) => s + c.total, 0);
  return (
    <Seccion
      n={n}
      titulo="Operaciones de Caja — Ingresos y Egresos"
      descripcion="Movimientos manuales de caja (distintos de las ventas): aportes y abonos como ingresos; entregas de cierre de turno, pagos a proveedores y compras como egresos."
    >
      {d.operaciones.length === 0 ? (
        <Text style={s.descripcion}>No se registraron operaciones de caja en el período.</Text>
      ) : (
        <>
          {detallado && meses.length > 1 && (
            <View wrap={false}>
              <GraficoColumnasPares
                categorias={meses.map((m) => m.etiquetaCorta)}
                serieA={meses.map((m) => m.ingresos)}
                serieB={meses.map((m) => m.egresos)}
                nombres={["Ingresos", "Egresos"]}
              />
            </View>
          )}
          {detallado && meses.length > 1 && (
            <Tabla
              columnas={[
                { titulo: "Mes", ancho: 3 },
                { titulo: "Ingresos", ancho: 1.5, alinear: "right" },
                { titulo: "Egresos", ancho: 1.5, alinear: "right" },
                { titulo: "Saldo neto", ancho: 1.5, alinear: "right" },
              ]}
              filas={[
                ...meses.map((m) => ({ celdas: [m.etiqueta, dinero(m.ingresos), dinero(m.egresos), dinero(m.ingresos - m.egresos)] })),
                { celdas: ["Total", dinero(ingresos), dinero(egresos), dinero(ingresos - egresos)], total: true },
              ]}
            />
          )}
          <Text style={s.subtitulo2}>Resumen por concepto</Text>
          <Tabla
            columnas={[
              { titulo: "Tipo", ancho: 1 },
              { titulo: "Concepto", ancho: 2.6 },
              { titulo: "N° operaciones", ancho: 1.3, alinear: "center" },
              { titulo: "Total", ancho: 1.6, alinear: "right" },
            ]}
            filas={[
              ...conceptos.map((c) => ({ celdas: [c.tipo, c.concepto, numero(c.cantidad), dinero(c.total)] })),
              { celdas: ["Ingresos", "", "", dinero(ingresos)], total: true },
              { celdas: ["Egresos", "", "", dinero(egresos)], total: true },
              { celdas: ["Saldo neto", "", "", dinero(ingresos - egresos)], total: true },
            ]}
          />
          {cierres > 0 && (
            <Nota>{`El ${porcentaje(cierres, egresos)} de los egresos (${dinero(
              cierres,
            )}) corresponde a cierres de turno: la entrega del efectivo recaudado a gerencia. No es un gasto del negocio sino un movimiento de caja, por eso el saldo neto negativo es normal. Los gastos reales están en los demás conceptos de egreso (${dinero(
              egresos - cierres,
            )}).`}</Nota>
          )}
          {detallado && (
            <>
              <Text style={s.subtitulo2}>Listado de operaciones</Text>
              <Tabla
                columnas={[
                  { titulo: "Fecha", ancho: 1.5 },
                  { titulo: "Tipo", ancho: 0.9 },
                  { titulo: "Concepto", ancho: 1.6 },
                  { titulo: "Observación", ancho: 2.4 },
                  { titulo: "Registró", ancho: 1.5 },
                  { titulo: "Valor", ancho: 1.2, alinear: "right" },
                ]}
                filas={d.operaciones.map((o) => ({
                  celdas: [
                    `${fechaCorta(o.fecha)} ${o.fecha.slice(11, 16)}`,
                    o.tipo,
                    o.concepto,
                    o.observacion,
                    o.administrador,
                    dinero(o.tipo === "Ingreso" ? o.valor : -o.valor),
                  ],
                }))}
              />
            </>
          )}
        </>
      )}
    </Seccion>
  );
}

/** "01/08 10:14" */
function fechaHoraCorta(f: string): string {
  return `${fechaCorta(f).slice(0, 5)} ${f.slice(11, 16)}`;
}

function SeccionTurnos({ n, d }: { n: number; d: DatosReporte }) {
  // Turnos sin ventas ni cuadre (aperturas/cierres de prueba o de ajuste) no aportan al reporte.
  const turnos = d.turnos.filter((t) => t.n_ventas > 0 || t.valor_final !== null);
  const ocultos = d.turnos.length - turnos.length;
  const conDiferencia = turnos.filter((t) => t.diferencia);
  const faltante = conDiferencia.filter((t) => (t.diferencia ?? 0) < 0).reduce((s, t) => s + (t.diferencia ?? 0), 0);
  const sobrante = conDiferencia.filter((t) => (t.diferencia ?? 0) > 0).reduce((s, t) => s + (t.diferencia ?? 0), 0);
  return (
    <Seccion
      n={n}
      titulo="Detalle de Turnos"
      descripcion={`Turnos abiertos en el período con su cuadre de caja: base inicial, ventas, efectivo contado al cierre y diferencia contra lo esperado.${
        ocultos ? ` Se omiten ${ocultos} turno(s) sin ventas ni cuadre registrado.` : ""
      }`}
    >
      <Tabla
        columnas={[
          { titulo: "N°", ancho: 0.6, alinear: "center" },
          { titulo: "Apertura", ancho: 1.4 },
          { titulo: "Cierre", ancho: 1.4 },
          { titulo: "Cerró", ancho: 1.7 },
          { titulo: "Ventas", ancho: 0.8, alinear: "center" },
          { titulo: "Total", ancho: 1.3, alinear: "right" },
          { titulo: "Base", ancho: 1.1, alinear: "right" },
          { titulo: "Contado", ancho: 1.2, alinear: "right" },
          { titulo: "Diferencia", ancho: 1.2, alinear: "right" },
        ]}
        filas={turnos.map((t) => ({
          celdas: [
            String(t.id_turno),
            fechaHoraCorta(t.apertura),
            t.cierre ? fechaHoraCorta(t.cierre) : "Abierto",
            t.cerrado_por ?? "—",
            numero(t.n_ventas),
            dinero(t.total),
            dinero(t.valor_inicial),
            t.valor_final === null ? "—" : dinero(t.valor_final),
            t.diferencia === null ? "—" : dinero(t.diferencia),
          ],
          fondo: (t.diferencia ?? 0) < 0 ? COLOR.resaltadoMalo : undefined,
        }))}
      />
      {conDiferencia.length > 0 && (
        <Nota>{`${conDiferencia.length} turno(s) cerraron con diferencia de caja: faltantes por ${dinero(faltante)} y sobrantes por ${dinero(
          sobrante,
        )}. Los turnos con faltante están resaltados.`}</Nota>
      )}
    </Seccion>
  );
}

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

function ReporteDocumento({ d, tipo }: { d: DatosReporte; tipo: TipoReporte }) {
  const r = resumen(d);
  const detallado = tipo === "detallado";
  const titulo = detallado ? "Reporte Detallado de Ventas" : "Reporte General de Ventas";
  const periodo = descripcionPeriodo(d.desde, d.hasta);
  let n = 0;
  const sig = () => ++n;

  return (
    <Document title={`${titulo} — Maison du Café`} author="Maison du Café — Sistema POS" subject={periodo} creator="Maison du Café POS">
      <Page size="A4" style={s.pagina}>
        <View style={s.portada}>
          <Image src={LOGO} style={s.logo} />
          <View style={{ flex: 1 }}>
            <Text style={s.titulo}>{titulo}</Text>
            <Text style={s.subtitulo}>Maison du Café · Pâtisserie Artisanale</Text>
            <Text style={s.periodo}>{`Período: ${periodo}`}</Text>
          </View>
        </View>

        <View style={s.kpis}>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>Ventas totales</Text>
            <Text style={s.kpiValor}>{dinero(r.total)}</Text>
            <Text style={s.kpiNota}>{`${numero(r.dias_con_venta)} días con ventas`}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>N° de ventas</Text>
            <Text style={s.kpiValor}>{numero(r.n_ventas)}</Text>
            <Text style={s.kpiNota}>{`Promedio diario ${dinero(r.promedio_diario)}`}</Text>
          </View>
          <View style={s.kpi}>
            <Text style={s.kpiEtiqueta}>Ticket promedio</Text>
            <Text style={s.kpiValor}>{dinero(r.ticket)}</Text>
            <Text style={s.kpiNota}>por venta</Text>
          </View>
          <View style={[s.kpi, { marginRight: 0 }]}>
            <Text style={s.kpiEtiqueta}>Propinas totales</Text>
            <Text style={s.kpiValor}>{dinero(r.propinas)}</Text>
            <Text style={s.kpiNota}>{`${porcentaje(r.propinas, r.total)} de lo vendido`}</Text>
          </View>
        </View>

        {r.n_ventas === 0 ? (
          <Text style={s.vacio}>No hay ventas pagadas registradas en este período.</Text>
        ) : (
          <>
            <SeccionVentasPeriodo n={sig()} d={d} />
            {detallado && <SeccionVentaDiariaTurnos n={sig()} d={d} />}
            <SeccionFormasPago n={sig()} d={d} />
            <SeccionPropinas n={sig()} d={d} />
            <SeccionTopProductos n={sig()} d={d} cantidad={detallado ? 15 : 10} />
            {detallado && <SeccionCategorias n={sig()} d={d} />}
            {detallado && <SeccionProductosQuincena n={sig()} d={d} />}
            {detallado && <SeccionMeseros n={sig()} d={d} />}
            <SeccionDiaSemana n={sig()} d={d} />
            {detallado && <SeccionHorarios n={sig()} d={d} />}
            <SeccionOperaciones n={sig()} d={d} detallado={detallado} />
            {detallado && d.turnos.some((t) => t.n_ventas > 0 || t.valor_final !== null) && <SeccionTurnos n={sig()} d={d} />}
          </>
        )}

        <Text style={[s.nota, { marginTop: 18, fontSize: 7.5 }]}>
          {`Fuente: base de datos del Sistema POS Maison du Café. Ventas con estado "Pagada"; los totales de venta no incluyen propinas. Generado el ${fechaLarga(
            d.generado,
          )} a las ${d.generado.slice(11, 16)}.`}
        </Text>

        <View style={s.pie} fixed>
          <Text>{`Maison du Café · ${titulo} · ${fechaCorta(d.desde)} – ${fechaCorta(d.hasta)}`}</Text>
        </View>
        <Text style={s.paginacion} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function generarPdf(d: DatosReporte, tipo: TipoReporte): Promise<Blob> {
  registrarFuentes();
  return pdf(<ReporteDocumento d={d} tipo={tipo} />).toBlob();
}
