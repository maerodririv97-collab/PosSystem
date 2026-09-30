// Gráficas SVG para @react-pdf/renderer (sin hover: es un documento impreso,
// así que los valores clave van rotulados y cada gráfica tiene su tabla).
import { G, Line, Path, Rect, Svg, Text } from "@react-pdf/renderer";
import { compacto } from "../datos";
import { COLOR, FUENTE } from "./tema";

export interface Barra {
  etiqueta: string;
  valor: number;
  color?: string;
  /** Segunda línea bajo el valor del tope, p. ej. "(12 ventas)". */
  nota?: string;
}

function pasoLimpio(maximo: number, divisiones = 4): number {
  if (maximo <= 0) return 1;
  const bruto = maximo / divisiones;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

/** Columna con tope redondeado de 4pt y base recta sobre la línea de base. */
function columna(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  const base = y + h;
  return `M ${x} ${base} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${base} Z`;
}

interface EjeProps {
  ancho: number;
  alto: number;
  izq: number;
  arriba: number;
  abajo: number;
  maximo: number;
}

function ejeY({ ancho, alto, izq, arriba, abajo, maximo }: EjeProps) {
  const paso = pasoLimpio(maximo);
  const tope = Math.max(paso, Math.ceil(maximo / paso) * paso);
  const altoUtil = alto - arriba - abajo;
  const ticks: number[] = [];
  for (let v = 0; v <= tope + 1e-6; v += paso) ticks.push(v);
  const escala = (v: number) => arriba + altoUtil - (v / tope) * altoUtil;
  const nodos = ticks.map((v) => (
    <G key={v}>
      <Line x1={izq} x2={ancho} y1={escala(v)} y2={escala(v)} stroke={v === 0 ? COLOR.eje : COLOR.grilla} strokeWidth={v === 0 ? 0.8 : 0.5} />
      <Text x={izq - 4} y={escala(v) + 2} textAnchor="end" fill={COLOR.textoSuave} style={{ fontSize: 6.5, fontFamily: FUENTE.cuerpo }}>
        {v === 0 ? "0" : `$${compacto(v)}`}
      </Text>
    </G>
  ));
  return { nodos, escala, tope };
}

/**
 * Columnas verticales. Con pocas barras se rotulan todas; con muchas, solo el
 * máximo y el mínimo (el resto queda en la tabla que acompaña la gráfica).
 */
export function GraficoColumnas({
  datos,
  ancho = 515,
  alto = 190,
  rotularTodas,
}: {
  datos: Barra[];
  ancho?: number;
  alto?: number;
  rotularTodas?: boolean;
}) {
  const izq = 42;
  const arriba = 22;
  const abajo = 18;
  const maximo = Math.max(0, ...datos.map((d) => d.valor));
  const { nodos, escala } = ejeY({ ancho, alto, izq, arriba, abajo, maximo });
  const banda = (ancho - izq) / Math.max(1, datos.length);
  const w = Math.min(28, banda * 0.62);
  const todas = rotularTodas ?? datos.length <= 12;
  const iMax = datos.findIndex((d) => d.valor === maximo);
  const minimo = Math.min(...datos.map((d) => d.valor));
  const iMin = datos.findIndex((d) => d.valor === minimo);
  const saltoEtiqueta = Math.ceil(datos.length / 16);

  return (
    <Svg width={ancho} height={alto}>
      {nodos}
      {datos.map((d, i) => {
        const x = izq + banda * i + (banda - w) / 2;
        const y = escala(d.valor);
        const h = escala(0) - y;
        const rotulo = todas || i === iMax || i === iMin;
        return (
          <G key={i}>
            {h > 0.5 && <Path d={columna(x, y, w, h)} fill={d.color ?? COLOR.serie1} />}
            {rotulo && (
              <Text x={x + w / 2} y={y - (d.nota ? 10 : 3)} textAnchor="middle" fill={COLOR.texto} style={{ fontSize: 6.5, fontFamily: FUENTE.cuerpo, fontWeight: 600 }}>
                {`$${compacto(d.valor)}`}
              </Text>
            )}
            {rotulo && d.nota && (
              <Text x={x + w / 2} y={y - 3} textAnchor="middle" fill={COLOR.textoSuave} style={{ fontSize: 5.5, fontFamily: FUENTE.cuerpo }}>
                {d.nota}
              </Text>
            )}
            {i % saltoEtiqueta === 0 && (
              <Text x={x + w / 2} y={alto - 6} textAnchor="middle" fill={COLOR.textoSuave} style={{ fontSize: 6.5, fontFamily: FUENTE.cuerpo }}>
                {d.etiqueta}
              </Text>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

/** Dos series lado a lado por categoría (p. ej. ingresos vs egresos), un solo eje. */
export function GraficoColumnasPares({
  categorias,
  serieA,
  serieB,
  nombres,
  colores = [COLOR.serie1, COLOR.serie3],
  ancho = 515,
  alto = 190,
}: {
  categorias: string[];
  serieA: number[];
  serieB: number[];
  nombres: [string, string];
  colores?: [string, string];
  ancho?: number;
  alto?: number;
}) {
  const izq = 42;
  const arriba = 26;
  const abajo = 18;
  const maximo = Math.max(0, ...serieA, ...serieB);
  const { nodos, escala } = ejeY({ ancho, alto, izq, arriba, abajo, maximo });
  const banda = (ancho - izq) / Math.max(1, categorias.length);
  const w = Math.min(22, banda * 0.3);
  const hueco = 2;

  return (
    <Svg width={ancho} height={alto}>
      {nodos}
      {/* Leyenda */}
      {nombres.map((n, k) => (
        <G key={n}>
          <Rect x={izq + 4 + k * 80} y={4} width={8} height={8} rx={2} fill={colores[k]} />
          <Text x={izq + 16 + k * 80} y={11} fill={COLOR.texto} style={{ fontSize: 7, fontFamily: FUENTE.cuerpo }}>
            {n}
          </Text>
        </G>
      ))}
      {categorias.map((c, i) => {
        const centro = izq + banda * i + banda / 2;
        return (
          <G key={c}>
            {[serieA[i], serieB[i]].map((v, k) => {
              const x = k === 0 ? centro - w - hueco / 2 : centro + hueco / 2;
              const y = escala(v);
              const h = escala(0) - y;
              return (
                <G key={k}>
                  {h > 0.5 && <Path d={columna(x, y, w, h)} fill={colores[k]} />}
                  <Text x={x + w / 2} y={y - 3} textAnchor="middle" fill={COLOR.texto} style={{ fontSize: 6, fontFamily: FUENTE.cuerpo, fontWeight: 600 }}>
                    {`$${compacto(v)}`}
                  </Text>
                </G>
              );
            })}
            <Text x={centro} y={alto - 6} textAnchor="middle" fill={COLOR.textoSuave} style={{ fontSize: 6.5, fontFamily: FUENTE.cuerpo }}>
              {c}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

/** Interpola la rampa secuencial (crema → verde Maison) para t en [0, 1]. */
function colorRampa(t: number): string {
  const a = [0xf4, 0xef, 0xe2];
  const b = [0x16, 0x4a, 0x2c];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * Math.max(0, Math.min(1, t))));
  return `#${c.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Mapa de calor día de la semana × hora (venta promedio). */
export function GraficoMapaCalor({
  filas,
  horas,
  valor,
  maximo,
  ancho = 515,
}: {
  filas: { dia: number; nombre: string }[];
  horas: number[];
  valor: (dia: number, hora: number) => number | undefined;
  maximo: number;
  ancho?: number;
}) {
  const izq = 50;
  const alturaFila = 20;
  const abajo = 16;
  const celda = (ancho - izq) / Math.max(1, horas.length);
  const alto = filas.length * alturaFila + abajo;
  return (
    <Svg width={ancho} height={alto}>
      {filas.map((f, r) => (
        <G key={f.dia}>
          <Text x={izq - 5} y={r * alturaFila + alturaFila / 2 + 2.5} textAnchor="end" fill={COLOR.texto} style={{ fontSize: 7, fontFamily: FUENTE.cuerpo }}>
            {f.nombre}
          </Text>
          {horas.map((h, c) => {
            const v = valor(f.dia, h);
            const t = v && maximo ? v / maximo : 0;
            return (
              <G key={h}>
                <Rect
                  x={izq + c * celda + 1}
                  y={r * alturaFila + 1}
                  width={celda - 2}
                  height={alturaFila - 2}
                  rx={2}
                  fill={v ? colorRampa(0.08 + t * 0.92) : COLOR.superficieSuave}
                />
                {v !== undefined && v > 0 && celda >= 16 && (
                  <Text
                    x={izq + c * celda + celda / 2}
                    y={r * alturaFila + alturaFila / 2 + 2}
                    textAnchor="middle"
                    fill={t > 0.5 ? "#ffffff" : COLOR.texto}
                    style={{ fontSize: 5.5, fontFamily: FUENTE.cuerpo }}
                  >
                    {compacto(v)}
                  </Text>
                )}
              </G>
            );
          })}
        </G>
      ))}
      {horas.map((h, c) => (
        <Text key={h} x={izq + c * celda + celda / 2} y={alto - 4} textAnchor="middle" fill={COLOR.textoSuave} style={{ fontSize: 6, fontFamily: FUENTE.cuerpo }}>
          {`${h}:00`}
        </Text>
      ))}
    </Svg>
  );
}
