/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package forms;

import forms.administracion.Home_Administracion;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Image;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import javax.swing.*;
import models.HibernateUtil;
import models.*;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.jvnet.substance.SubstanceLookAndFeel;

/**
 *
 * @author Manuel Rodriguez
 */
public class frmMesas extends javax.swing.JFrame {
    
    private List<models.Mesas> ListadoMesas;
    private List<models.Mesas> ListadoBarras;
    private List<models.Mesas> ListadoIslas;
    private List<models.Ventas> ListadoMesasOcupadas;
    
    private models.Turnos turno;
    private models.Ventas venta;
    private models.Usuarios mesero;
    public models.Ventas ObjVenta = new models.Ventas();
    private models.Ventas ventaExistente;
    
    private String modo_acceso;

    
    
    public Ventas getVenta() {
        return venta;
    }

    public void setVenta(Ventas venta) {
        this.venta = venta;
    }
   
    
    
    public void setTurno(models.Turnos turn) {
        this.turno = turn;
    }
    
    public models.Turnos getTurno() {
        return this.turno;
    }
    
    public void setMesero(models.Usuarios mesero) {
        this.mesero = mesero;
    }
    
    public models.Usuarios getMesero(){
        return this.mesero;
    }
    
    /**
     * Creates new form NewJFrame
     */
    public frmMesas(Ventas v, models.Turnos t, Usuarios m,String mod) {
        
        this.venta = v;
        this.turno = t;
        this.mesero = m;
        this.modo_acceso = mod;
        
        initComponents();
        this.setLocationRelativeTo(this);
        ImageIcon img = new ImageIcon(getClass().getResource("/images/icon_app.png"));
        this.setIconImage(img.getImage().getScaledInstance(180,180, Image.SCALE_SMOOTH));
        this.setTitle("POSystem - Powered by &Source Ltda");
        
        this.setExtendedState(JFrame.MAXIMIZED_BOTH);
        
        btnCuentas_Abiertas.setVisible(false);
        
        mtdBtns();
        
        
        btnSalir.setForeground(new Color(218, 0, 128));
        
        Calendar calendario = Calendar.getInstance();
        
        Date date = calendario.getTime();             
        SimpleDateFormat hora_completa = new SimpleDateFormat("hh:mm aa");
        SimpleDateFormat mes_text = new SimpleDateFormat("MMMM");
        SimpleDateFormat dia_text = new SimpleDateFormat("EEEE");
         
        String date1 = hora_completa.format(date);  
        lblHora.setText(date1);
        
        
        lblDia.setText(String.valueOf(calendario.get(Calendar.DAY_OF_MONTH)));
        
        
        lblMes.setText(mes_text.format(date));
        lblTextDia.setText(dia_text.format(date));
        
     }
    
    
    public void mtdBtns(){
        
        
        
        
        Calendar calendario = Calendar.getInstance();
        Date date = calendario.getTime();
        
        
         this.venta.setEstado("Abierta");
         this.venta.setTurnos(turno);
         this.venta.setUsuarios(mesero);
         this.venta.setFormaPago("Efectivo");
         this.venta.setFecha(date);
        
        models.Mesas Objmesa = new models.Mesas();
        frmMesas p = this;
         
        //LISTAO DE ISLAS REGISTRADAS
        ListadoIslas = new ArrayList<>();
        ListadoIslas = Objmesa.mtdList("Isla");
        
        for (Mesas dataIsla: ListadoIslas) {
            
         JButton Isla = new JButton("<html><center>"+dataIsla.getTipo()+" "+dataIsla.getNumero()+"</center>DISPONIBLE</html>");
         Isla.setFont(new Font("Leelawadee Ui", Font.PLAIN, 20));
        
        if (Objmesa.mtdDisponibilidad(dataIsla.getIdMesa(), turno.getIdTurno()) != null) {
            
            if(Objmesa.mtdDisponibilidad(dataIsla.getIdMesa(), turno.getIdTurno()).getPedidosAll().size() > 0){
                Isla.setForeground(Color.green);
                Isla.setText("<html><center>"+dataIsla.getTipo()+" "+dataIsla.getNumero()+"</center>OCUPADA</html>");
            }else{
                Isla.setForeground(Color.blue);
                Isla.setText("<html><center>"+dataIsla.getTipo()+" "+dataIsla.getNumero()+"</center>SIN PEDIDOS</html>");
            }
            System.out.println(Objmesa.mtdDisponibilidad(dataIsla.getIdMesa(), turno.getIdTurno()).getIdVenta());
         }else{
            System.out.println("Vacio ");
        }
       
        Isla.addActionListener(new ActionListener() { 
                public void actionPerformed(ActionEvent e) {
                        
                  
               ventaExistente = Objmesa.mtdDisponibilidad(dataIsla.getIdMesa(), turno.getIdTurno());
                        
                          if(ventaExistente == null){  
                            Transaction trns = null;
                            Session session = HibernateUtil.getSessionFactory().openSession();
                            try {
                                
                               
                                venta.setMesas(dataIsla);
                                System.out.println(getTurno().getApertura()+" estado: "+turno.getEstado());
                                
                                session.beginTransaction();
                                session.save(venta);
                                session.getTransaction().commit();
                                
                           }catch (RuntimeException ex) {
                                ex.printStackTrace();
                                
                                System.out.println(ex.getMessage());
                            }finally {
                                session.clear();
                                session.flush();
                                session.close();
                            }
                          }else{
                              venta = ventaExistente;
                          }
                          
                  mainMesero formPrincipal = new mainMesero(p,turno,venta);
                    formPrincipal.setMesa(dataIsla);
                    formPrincipal.setVisible(true);
                    formPrincipal.setVenta(venta);
                    
                    System.out.println("la venta: "+venta.getIdVenta());
                    

                     p.setVisible(false);
                } 
            } );

          Isla.setMaximumSize(new Dimension(80,80));
          Isla.setMinimumSize(new Dimension(80,80));
          Isla.setPreferredSize(new Dimension(80,80));

        PanelIslas.add(Isla);
        PanelIslas.revalidate();
        PanelIslas.repaint();
        }
        
        //LISTADO DE BARRAS REGISTRADAS
        ListadoBarras = new ArrayList<>();
        ListadoBarras = Objmesa.mtdList("Barra");
        
        for (Mesas dataBarra: ListadoBarras) {
            
            
            
             JButton Barra = new JButton("<html><center>"+dataBarra.getTipo()+" "+dataBarra.getNumero()+"</center>DISPONIBLE</html>");
         Barra.setFont(new Font("Leelawadee Ui", Font.PLAIN, 20));
           
         if(Objmesa.mtdDisponibilidad(dataBarra.getIdMesa(), turno.getIdTurno()) != null){
                     
                if(Objmesa.mtdDisponibilidad(dataBarra.getIdMesa(), turno.getIdTurno()).getPedidosAll().size() > 0){
                 Barra.setForeground(Color.green);
                 Barra.setText("<html><center>"+dataBarra.getTipo()+" "+dataBarra.getNumero()+"</center>OCUPADA</html>");
                }else{
                 Barra.setForeground(Color.blue);
                 Barra.setText("<html><center>"+dataBarra.getTipo()+" "+dataBarra.getNumero()+"</center>SIN PEDIDOS</html>");
                }
         }
             
            Barra.addActionListener(new ActionListener() { 
                public void actionPerformed(ActionEvent e) {
                        
                
                ventaExistente = Objmesa.mtdDisponibilidad(dataBarra.getIdMesa(), turno.getIdTurno());
                        
                          if(ventaExistente == null){  
                            Transaction trns = null;
                            Session session = HibernateUtil.getSessionFactory().openSession();
                            try {
                                
                               
                                venta.setMesas(dataBarra);
                                
                                System.out.println(turno.getApertura()+" estado: "+turno.getEstado()+" Id: "+turno.getIdTurno());
                                trns = session.beginTransaction();
                                session.save(venta);
                                session.getTransaction().commit();
                                
                           }catch (RuntimeException ex) {
                                ex.printStackTrace();
                            }finally {
                                session.clear();
                                session.flush();
                                session.close();
                            }
                          }else{
                              venta = ventaExistente;
                          }
                            
               mainMesero formPrincipal = new mainMesero(p,turno,venta);
                 formPrincipal.setMesa(dataBarra);
                 formPrincipal.setVisible(true);
                 
                 
                  p.setVisible(false);
                } 
            } );
            
              Barra.setMaximumSize(new Dimension(80,80));
              Barra.setMinimumSize(new Dimension(80,80));
              Barra.setPreferredSize(new Dimension(80,80));
              
            PanelBarras.add(Barra);
            PanelBarras.revalidate();
            PanelBarras.repaint();
        }
        
        //LISTADO DE MESAS REGISTRADAS
        ListadoMesas = new ArrayList<>();
        ListadoMesas = Objmesa.mtdList("Mesa");
        
       for (Mesas dataMesa: ListadoMesas) {
            
           JButton Mesa = new JButton("<html><center>"+dataMesa.getTipo()+" "+dataMesa.getNumero()+"</center>DISPONIBLE</html>");
         Mesa.setFont(new Font("Leelawadee Ui", Font.PLAIN, 20));
           
         if(Objmesa.mtdDisponibilidad(dataMesa.getIdMesa(), turno.getIdTurno()) != null){
                     
                if(Objmesa.mtdDisponibilidad(dataMesa.getIdMesa(), turno.getIdTurno()).getPedidosAll().size() > 0){
                     Mesa.setForeground(Color.green);
                     Mesa.setText("<html><center>"+dataMesa.getTipo()+" "+dataMesa.getNumero()+"</center>OCUPADA</html>");
                }else{
                     Mesa.setForeground(Color.blue);
                     Mesa.setText("<html><center>"+dataMesa.getTipo()+" "+dataMesa.getNumero()+"</center>SIN PEDIDOS</html>");
                }
         }
             
            Mesa.addActionListener(new ActionListener() { 
                public void actionPerformed(ActionEvent e) {
                        
               ventaExistente = Objmesa.mtdDisponibilidad(dataMesa.getIdMesa(), turno.getIdTurno());
                        
                          if(ventaExistente == null){  
                            Transaction trns = null;
                            Session session = HibernateUtil.getSessionFactory().openSession();
                            try {
                                
                               
                                venta.setMesas(dataMesa);
                                
                                System.out.println(turno.getApertura()+" estado: "+turno.getEstado());
                                session.beginTransaction();
                                session.save(venta);
                                session.getTransaction().commit();
                                
                           }catch (RuntimeException ex) {
                                ex.printStackTrace();
                            }finally {
                                session.clear();
                                session.flush();
                                session.close();
                            }
                           }else{
                              venta = ventaExistente;
                          }
              mainMesero formPrincipal = new mainMesero(p,turno,venta);
                 formPrincipal.setMesa(dataMesa);         
                 formPrincipal.setVisible(true);
                 
                 
                  p.setVisible(false);
                } 
            } );
            
              /*btnAdd.setMaximumSize(new Dimension(30,80));
              btnAdd.setMinimumSize(new Dimension(80,80));
              btnAdd.setPreferredSize(new Dimension(80,80));*/
              
            PanelMesas.add(Mesa);
            PanelMesas.revalidate();
            PanelMesas.repaint();
            
        }
        
       
    }
    
  
    

    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        ScrollBarra = new javax.swing.JScrollPane();
        PanelBarras = new javax.swing.JPanel();
        ScrollMesas = new javax.swing.JScrollPane();
        PanelMesas = new javax.swing.JPanel();
        Scroll_Islas = new javax.swing.JScrollPane();
        PanelIslas = new javax.swing.JPanel();
        label1 = new java.awt.Label();
        label2 = new java.awt.Label();
        label3 = new java.awt.Label();
        lblDia = new java.awt.Label();
        lblHora = new java.awt.Label();
        lblTextDia = new java.awt.Label();
        lblMes = new java.awt.Label();
        btnSalir = new javax.swing.JButton();
        jLabel1 = new javax.swing.JLabel();
        btnCuentas_Abiertas = new javax.swing.JButton();

        setDefaultCloseOperation(javax.swing.WindowConstants.DO_NOTHING_ON_CLOSE);
        setAlwaysOnTop(true);
        setCursor(new java.awt.Cursor(java.awt.Cursor.DEFAULT_CURSOR));
        setMaximumSize(new java.awt.Dimension(1024, 768));
        setMinimumSize(new java.awt.Dimension(1024, 768));
        setPreferredSize(new java.awt.Dimension(1024, 768));
        getContentPane().setLayout(new org.netbeans.lib.awtextra.AbsoluteLayout());

        ScrollBarra.setHorizontalScrollBarPolicy(javax.swing.ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        ScrollBarra.setVerticalScrollBarPolicy(javax.swing.ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS);
        ScrollBarra.setName("ScrollBarras"); // NOI18N

        PanelBarras.setLayout(new java.awt.GridLayout(20, 1, 0, 4));
        ScrollBarra.setViewportView(PanelBarras);

        getContentPane().add(ScrollBarra, new org.netbeans.lib.awtextra.AbsoluteConstraints(40, 220, 190, 360));

        ScrollMesas.setHorizontalScrollBarPolicy(javax.swing.ScrollPaneConstants.HORIZONTAL_SCROLLBAR_ALWAYS);
        ScrollMesas.setVerticalScrollBarPolicy(javax.swing.ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS);
        ScrollMesas.setName("ScrollMesas"); // NOI18N

        PanelMesas.setLayout(new java.awt.GridLayout(5, 5, 3, 3));
        ScrollMesas.setViewportView(PanelMesas);

        getContentPane().add(ScrollMesas, new org.netbeans.lib.awtextra.AbsoluteConstraints(260, 90, 510, 540));

        Scroll_Islas.setHorizontalScrollBarPolicy(javax.swing.ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        Scroll_Islas.setVerticalScrollBarPolicy(javax.swing.ScrollPaneConstants.VERTICAL_SCROLLBAR_ALWAYS);

        PanelIslas.setLayout(new java.awt.GridLayout(20, 1, 0, 4));
        Scroll_Islas.setViewportView(PanelIslas);

        getContentPane().add(Scroll_Islas, new org.netbeans.lib.awtextra.AbsoluteConstraints(800, 210, 200, 380));

        label1.setFont(new java.awt.Font("Leelawadee UI", 0, 24)); // NOI18N
        label1.setText("Islas");
        getContentPane().add(label1, new org.netbeans.lib.awtextra.AbsoluteConstraints(800, 140, -1, -1));

        label2.setFont(new java.awt.Font("Leelawadee UI", 0, 24)); // NOI18N
        label2.setText("Barras");
        getContentPane().add(label2, new org.netbeans.lib.awtextra.AbsoluteConstraints(40, 180, -1, -1));

        label3.setFont(new java.awt.Font("Leelawadee UI", 0, 24)); // NOI18N
        label3.setText("Mesas");
        getContentPane().add(label3, new org.netbeans.lib.awtextra.AbsoluteConstraints(260, 50, -1, -1));

        lblDia.setFont(new java.awt.Font("Calibri", 1, 48)); // NOI18N
        lblDia.setForeground(new java.awt.Color(255, 255, 255));
        getContentPane().add(lblDia, new org.netbeans.lib.awtextra.AbsoluteConstraints(880, 30, 70, 60));

        lblHora.setFont(new java.awt.Font("Arial Black", 1, 48)); // NOI18N
        lblHora.setForeground(new java.awt.Color(255, 255, 255));
        getContentPane().add(lblHora, new org.netbeans.lib.awtextra.AbsoluteConstraints(640, 30, 220, 50));

        lblTextDia.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        getContentPane().add(lblTextDia, new org.netbeans.lib.awtextra.AbsoluteConstraints(950, 60, 80, 30));

        lblMes.setFont(new java.awt.Font("Dialog", 0, 18)); // NOI18N
        getContentPane().add(lblMes, new org.netbeans.lib.awtextra.AbsoluteConstraints(950, 30, 80, 30));

        btnSalir.setFont(new java.awt.Font("Leelawadee UI", 0, 24)); // NOI18N
        btnSalir.setText("SALIR");
        btnSalir.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnSalirActionPerformed(evt);
            }
        });
        getContentPane().add(btnSalir, new org.netbeans.lib.awtextra.AbsoluteConstraints(880, 650, 110, 50));

        jLabel1.setIcon(new javax.swing.ImageIcon(getClass().getResource("/images/logotipo_cliente_small.png"))); // NOI18N
        getContentPane().add(jLabel1, new org.netbeans.lib.awtextra.AbsoluteConstraints(10, 10, 240, -1));

        btnCuentas_Abiertas.setIcon(new javax.swing.ImageIcon(getClass().getResource("/images/icons/cuenta_abierta.png"))); // NOI18N
        btnCuentas_Abiertas.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnCuentas_AbiertasActionPerformed(evt);
            }
        });
        getContentPane().add(btnCuentas_Abiertas, new org.netbeans.lib.awtextra.AbsoluteConstraints(100, 600, 90, 80));

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void btnSalirActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnSalirActionPerformed
        
        if(modo_acceso.equalsIgnoreCase("Administrador")){
            this.dispose();
            new Home_Administracion().setVisible(true);
        
        }else{
            System.exit(0);
        }
        // TODO add your handling code here:
    }//GEN-LAST:event_btnSalirActionPerformed

    private void btnCuentas_AbiertasActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnCuentas_AbiertasActionPerformed
          
        frmConfirmacionPin formConfirmacion = new frmConfirmacionPin(this,turno,venta);
     
            formConfirmacion.setVisible(true);
            formConfirmacion.modo_acceso = "ventas_abiertas"; 
            this.dispose();// TODO add your handling code here:
    }//GEN-LAST:event_btnCuentas_AbiertasActionPerformed

    /**
     * @param args the command line arguments
     */
    
    
   
            

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JPanel PanelBarras;
    private javax.swing.JPanel PanelIslas;
    private javax.swing.JPanel PanelMesas;
    private javax.swing.JScrollPane ScrollBarra;
    private javax.swing.JScrollPane ScrollMesas;
    private javax.swing.JScrollPane Scroll_Islas;
    private javax.swing.JButton btnCuentas_Abiertas;
    private javax.swing.JButton btnSalir;
    private javax.swing.JLabel jLabel1;
    private java.awt.Label label1;
    private java.awt.Label label2;
    private java.awt.Label label3;
    private java.awt.Label lblDia;
    private java.awt.Label lblHora;
    private java.awt.Label lblMes;
    private java.awt.Label lblTextDia;
    // End of variables declaration//GEN-END:variables
}
