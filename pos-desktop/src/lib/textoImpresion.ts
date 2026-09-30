// Helpers para armar reportes de texto plano de 42 caracteres de ancho
// (típico para rollo térmico de 80mm), usados tanto por el recibo de venta
// como por el reporte de cierre de turno antes de enviarlos a imprimir.

export const ANCHO_RECIBO = 42;

export function centrar(texto: string): string {
  const espacio = Math.max(0, Math.floor((ANCHO_RECIBO - texto.length) / 2));
  return " ".repeat(espacio) + texto;
}

export function ajustarLinea(izquierda: string, derecha: string): string {
  const espacio = Math.max(1, ANCHO_RECIBO - izquierda.length - derecha.length);
  return izquierda + " ".repeat(espacio) + derecha;
}

export function raya(): string {
  return "-".repeat(ANCHO_RECIBO);
}

// Las impresoras térmicas ESC/POS usan páginas de código de un byte (no UTF-8),
// y sin saber cuál soporta cada modelo, la forma segura de que tildes y eñes no
// salgan como caracteres corruptos es no enviarlas: se quitan los diacríticos
// justo antes de imprimir (la pantalla sigue mostrando el texto con tildes).
export function normalizarParaImpresora(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¡¿]/g, "");
}
