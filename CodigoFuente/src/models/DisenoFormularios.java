/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package models;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Toolkit;
import javax.swing.Icon;
import javax.swing.JCheckBox;
import javax.swing.JFrame;

/**
 *
 * @author MANUEL_RODRIGUEZ
 */
public class DisenoFormularios {
    
    
    public static void mtdDisenoPantalla(JFrame formulario){
        
        // 1. Primero el título del sistema
        formulario.setTitle("POSystem - Powered by KIM-Solutions");

        // 3. Forzamos el maximizado nativo del sistema operativo primero
        formulario.setExtendedState(JFrame.MAXIMIZED_BOTH);

        // 4. Calculamos el tamaño real de la pantalla actual (por si el SO bloquea el maximizado)
        Dimension pantalla = Toolkit.getDefaultToolkit().getScreenSize();
        formulario.setSize(pantalla);

        // 5. Centramos el formulario siempre al final
        formulario.setLocationRelativeTo(null);
         
        
    }
    
    /**
     * Ajusta el tamaño de la caja de selección de un JCheckBox de manera proporcional
     * a su tamaño de letra para evitar desproporciones y bloqueos visuales.
     * * @param checkBox El JCheckBox que se desea modificar
     * @param tamanoCaja El tamaño en píxeles que tendrá el cuadrado del check (ej. 24, 28, 32)
     */
    public static void mtdAgrandarCheckBox(JCheckBox checkBox, int tamanoCaja) {
        if (checkBox != null) {
            // Asignamos el nuevo diseño dibujado por código para estado desmarcado y marcado
            checkBox.setIcon(new CheckBoxModerno(tamanoCaja, false));
            checkBox.setSelectedIcon(new CheckBoxModerno(tamanoCaja, true));

            // Añade un espacio prudente de separación entre el cuadrito y el texto (12 píxeles)
            checkBox.setIconTextGap(12);
        }
    }
    
    // --- CLASE INTERNA DE SOPORTE PARA EL DIBUJO VECTORIAL DEL CHECKBOX ---
    private static class CheckBoxModerno implements Icon {
        private final int size;
        private final boolean seleccionado;

        public CheckBoxModerno(int size, boolean seleccionado) {
            this.size = size;
            this.seleccionado = seleccionado;
        }

        @Override
        public void paintIcon(Component c, Graphics g, int x, int y) {
            Graphics2D g2 = (Graphics2D) g.create();
            // Activamos el suavizado de bordes (Anti-aliasing)
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            // 1. Dibujar el fondo del cuadrito (Blanco)
            g2.setColor(Color.WHITE);
            g2.fillRect(x, y, size, size);
            
            // 2. Dibujar el borde del cuadrito (Gris/Azul suave)
            g2.setColor(new Color(160, 170, 185)); 
            g2.setStroke(new BasicStroke(1.5f)); 
            g2.drawRect(x, y, size - 1, size - 1);

            // 3. Si el usuario lo seleccionó, dibujamos el "visto / palomita"
            if (seleccionado) {
                g2.setColor(new Color(0, 120, 215)); // Azul estándar de Windows
                // Definimos el grosor del gancho proporcional al tamaño de la caja
                float grosorLineas = Math.max(2.0f, size * 0.1f);
                g2.setStroke(new BasicStroke(grosorLineas, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
                
                // Coordenadas proporcionales para que el check encaje perfecto a cualquier tamaño
                int x1 = x + (int)(size * 0.25);
                int y1 = y + (int)(size * 0.52);
                int x2 = x + (int)(size * 0.45);
                int y2 = y + (int)(size * 0.74);
                int x3 = x + (int)(size * 0.78);
                int y3 = y + (int)(size * 0.26);
                
                g2.drawLine(x1, y1, x2, y2);
                g2.drawLine(x2, y2, x3, y3);
            }

            g2.dispose();
        }

        @Override
        public int getIconWidth() { return size; }

        @Override
        public int getIconHeight() { return size; }
    }
}