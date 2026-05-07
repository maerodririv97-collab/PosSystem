package models;

import net.sf.jasperreports.engine.JasperCompileManager;

public class JasperCompiler {
    public static void main(String[] args) {
        try {
            // Ruta del archivo que YA tienes
            String fuente = "src/reports/venta.jrxml"; 
            // Ruta del archivo que NECESITAS
            String destino = "src/reports/venta.jasper"; 
            
            System.out.println("Compilando reporte...");
            JasperCompileManager.compileReportToFile(fuente, destino);
            System.out.println("¡Éxito! Archivo venta.jasper creado en src/reports/");
            
        } catch (Exception e) {
            System.err.println("Error compitiendo: " + e.getMessage());
            e.printStackTrace();
        }
    }

}
