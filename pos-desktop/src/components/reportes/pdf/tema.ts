// Identidad Maison du Café para los reportes PDF: colores de App.css, tipografías
// de la app (empaquetadas localmente para que funcione sin internet) y el logo.
import { Font } from "@react-pdf/renderer";
import poppins400 from "@fontsource/poppins/files/poppins-latin-400-normal.woff";
import poppins500 from "@fontsource/poppins/files/poppins-latin-500-normal.woff";
import poppins600 from "@fontsource/poppins/files/poppins-latin-600-normal.woff";
import poppins700 from "@fontsource/poppins/files/poppins-latin-700-normal.woff";
import playfair700 from "@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff";
import playfair400i from "@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff";

export { default as LOGO } from "../../../assets/logotipo_cliente.png";

export const COLOR = {
  primario: "#16281f", // verde Maison (barra superior de la app)
  primarioSuave: "#1f3a2c",
  dorado: "#b6902f",
  doradoSuave: "#f3e6c4",
  crema: "#f6f2e9",
  superficieSuave: "#efe8d9",
  borde: "#e2d9c4",
  texto: "#1c241e",
  textoSuave: "#5c6a5f",
  grilla: "#e7e1d3",
  eje: "#b9b09c",
  // Series de datos (validadas para daltonismo y contraste sobre fondo claro)
  serie1: "#2a7a45", // verde
  serie2: "#b8862b", // dorado
  serie3: "#a8483a", // terracota: egresos / peor valor
  resaltadoBueno: "#e4ede6",
  resaltadoMalo: "#f7e5e0",
};

export const FUENTE = {
  titulo: "Playfair Display",
  cuerpo: "Poppins",
};

let registradas = false;

export function registrarFuentes() {
  if (registradas) return;
  registradas = true;
  Font.register({
    family: FUENTE.cuerpo,
    fonts: [
      { src: poppins400, fontWeight: 400 },
      { src: poppins500, fontWeight: 500 },
      { src: poppins600, fontWeight: 600 },
      { src: poppins700, fontWeight: 700 },
    ],
  });
  Font.register({
    family: FUENTE.titulo,
    fonts: [
      { src: playfair700, fontWeight: 700 },
      { src: playfair400i, fontWeight: 400, fontStyle: "italic" },
    ],
  });
  // Sin guiones de separación silábica (el español se parte mal).
  Font.registerHyphenationCallback((palabra) => [palabra]);
}
