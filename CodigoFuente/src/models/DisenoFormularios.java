/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package models;

import java.awt.Dimension;
import java.awt.Toolkit;
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
    
    
    
}
