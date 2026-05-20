/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package forms.administracion;

import forms.frmMesas;
import forms.login;
import forms.mainMesero;
import java.awt.Dimension;
import java.awt.Image;
import java.awt.Toolkit;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import javax.swing.ImageIcon;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import models.HibernateUtil;
import models.Ingresoproductos;
import models.Pedidos;
import models.Productos;
import models.Servicios;
import models.Turnos;
import models.Ventas;
import models.dataIProductos;
import net.sf.jasperreports.engine.JREmptyDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperPrintManager;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.view.JasperViewer;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.jvnet.substance.SubstanceLookAndFeel;

/**
 *
 * @author bcristan
 */
public class Home_Administracion extends javax.swing.JFrame implements Runnable {

    /**
     * Creates new form Home_Gerencia
     */
    
    public Turnos objTurno = new Turnos();
    public static Turnos turnoAbierto;
    public static Turnos turnoAnterior;
    public static double valorCaja;
    public static double valorPropinas;
    public static double valorPagoTransferencia;
    public static models.Usuarios admin;
    public Calendar calendario;
    
    private models.DisenoFormularios desing;
    
    private models.Usuarios usuarioLogeado;
    
    public Home_Administracion(models.Usuarios usuario) {
        
        
        
        initComponents();
        
        desing.mtdDisenoPantalla(this);
 
        usuarioLogeado = usuario;
        lblInfoUser.setText(usuarioLogeado.getNombres());
        
        /* Validaciones de perfil, para organizar menu principal */
        if(usuarioLogeado.getPerfil().equals("Administrador")){
            /*jBTurnos1.setVisible(true);
            btnUsuarios.setVisible(true);
            btnProductos.setVisible(true);
            btnMesas.setVisible(true);
            btnCategorias.setVisible(true);
            jBVentas.setVisible(true);*/
            
            jpnAdministracion.setVisible(true);
            
        }else{
            /*jBTurnos1.setVisible(false);
            btnUsuarios.setVisible(false);
            btnProductos.setVisible(false);
            btnMesas.setVisible(false);
            btnCategorias.setVisible(false);
            jBVentas.setVisible(false);
            lblSaldoCaja.setVisible(false);
            lblSaldoPropinas.setVisible(false);*/
            
            jpnAdministracion.setVisible(false);
        }
        
        
        ImageIcon img = new ImageIcon(getClass().getResource("/images/icon_app.png"));
        this.setIconImage(img.getImage().getScaledInstance(180,180, Image.SCALE_SMOOTH));
        this.setTitle("POSystem - Powered by KIM-Solutions");
        
        turnoAbierto = objTurno.mtdTurnoAbierto();
        turnoAnterior = objTurno.mtdLastTurno();
        
        if(turnoAnterior != null){
            valorCaja = turnoAnterior.getTotalCaja();
            valorPropinas = turnoAnterior.getTotalPropinas();
            valorPagoTransferencia = turnoAnterior.getTotalVentasFormaPago("Transferencia");
        }else if(turnoAbierto != null){
            valorCaja = turnoAbierto.getTotalCaja(); 
            valorPropinas = turnoAbierto.getTotalPropinas();
            valorPagoTransferencia = turnoAbierto.getTotalVentasFormaPago("Transferencia");
        }else{
            valorCaja = 0.0;
            valorPropinas = 0.0;
            valorPagoTransferencia = 0.0;
        }
        
       
       if(turnoAbierto == null){
          
           btnCerrarTurno.setVisible(false);
           lblInfoTurno.setVisible(false);
           btnOperaciones.setEnabled(false);
           btnPedidos.setEnabled(false);
           btnVentas.setEnabled(false);
           /*if(usuarioLogeado.getPerfil().equals("Administrador")){
               lblSaldoCaja.setText("<html>Saldo en Caja: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorCaja))+"</html>");
               lblSaldoPropinas.setText("<html>Saldo Propinas: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorPropinas))+"</html>");
               lblSaldoTrx.setText("<html>Saldo Transferencia: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorPagoTransferencia))+"</html>");
           }*/
           
       }else{
          
          SimpleDateFormat fecha = new SimpleDateFormat("EEE, dd MMM yyyy - hh:mm a");
          
         
          btnAbrirTurno.setVisible(false);
          
          lblInfoTurno.setText(String.valueOf(fecha.format(turnoAbierto.getApertura())));
          /*if(usuarioLogeado.getPerfil().equals("Administrador")) {
              lblSaldoCaja.setText("<html>Saldo Actual: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorCaja))+"</html>");
              lblSaldoPropinas.setText("<html>Saldo Propinas: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorPropinas))+"</html>");
              lblSaldoTrx.setText("<html>Saldo Transferencia: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorPagoTransferencia))+"</html>");
          }*/
       }
       
       
        calendario = new GregorianCalendar();
        calendario.setTime(new Date());
        
        if(calendario.get(Calendar.DAY_OF_MONTH)<10)
            lblDia.setText(String.valueOf("0"+calendario.get(Calendar.DAY_OF_MONTH)));
        else
            lblDia.setText(String.valueOf(calendario.get(Calendar.DAY_OF_MONTH)));
        
        String [] Meses = {"Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"};
        lblMes.setText(Meses[calendario.get(Calendar.MONTH)]);
        
        String [] Dias = {"Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sábado"};
        
        lblDiaSemana.setText(Dias[calendario.get(Calendar.DAY_OF_WEEK)-1]);
       
       Thread t = new Thread(this);
       t.start();
    }

    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jpnAdministracion = new javax.swing.JPanel();
        jpnGestion = new javax.swing.JPanel();
        btnUsuarios = new javax.swing.JButton();
        btnMesas = new javax.swing.JButton();
        btnCategorias = new javax.swing.JButton();
        btnProductos = new javax.swing.JButton();
        jpnInformes = new javax.swing.JPanel();
        jBTurnos1 = new javax.swing.JButton();
        jBVentas = new javax.swing.JButton();
        jpnSuperior = new javax.swing.JPanel();
        jpnInformacion = new javax.swing.JPanel();
        Bienvenido = new javax.swing.JLabel();
        lblInfoUser = new javax.swing.JLabel();
        jpnLogo = new javax.swing.JPanel();
        lblLogotipo = new javax.swing.JLabel();
        jpnFecha = new javax.swing.JPanel();
        lblMes = new javax.swing.JLabel();
        lblDiaSemana = new javax.swing.JLabel();
        lblHora = new javax.swing.JLabel();
        lblDia = new javax.swing.JLabel();
        jpnCentral = new javax.swing.JPanel();
        jpnVentas = new javax.swing.JPanel();
        btnVentas = new javax.swing.JButton();
        btnPedidos = new javax.swing.JButton();
        jpnExit = new javax.swing.JPanel();
        jBExit = new javax.swing.JButton();
        jpnBarista = new javax.swing.JPanel();
        jpnTurno = new javax.swing.JPanel();
        btnCerrarTurno = new javax.swing.JButton();
        btnAbrirTurno = new javax.swing.JButton();
        lblInfoTurno = new javax.swing.JLabel();
        jpnOperaciones = new javax.swing.JPanel();
        btnOperaciones = new javax.swing.JButton();
        btnFacturas = new javax.swing.JButton();

        setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);
        setBackground(new java.awt.Color(0, 0, 0));
        setMaximumSize(null);
        setSize(new java.awt.Dimension(1920, 1080));
        getContentPane().setLayout(new java.awt.BorderLayout(30, 10));

        jpnAdministracion.setBorder(javax.swing.BorderFactory.createEmptyBorder(20, 20, 20, 20));
        jpnAdministracion.setLayout(new java.awt.GridLayout(2, 0, 20, 50));

        jpnGestion.setLayout(new java.awt.GridLayout(4, 0, 0, 10));

        btnUsuarios.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnUsuarios.setText("Gestion Usuarios");
        btnUsuarios.setFocusPainted(false);
        btnUsuarios.setPreferredSize(null);
        btnUsuarios.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnUsuariosActionPerformed(evt);
            }
        });
        jpnGestion.add(btnUsuarios);

        btnMesas.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnMesas.setText("Gestion Mesas");
        btnMesas.setFocusPainted(false);
        btnMesas.setPreferredSize(null);
        btnMesas.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnMesasActionPerformed(evt);
            }
        });
        jpnGestion.add(btnMesas);

        btnCategorias.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnCategorias.setText("Gestion Categorias");
        btnCategorias.setFocusPainted(false);
        btnCategorias.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnCategoriasActionPerformed(evt);
            }
        });
        jpnGestion.add(btnCategorias);

        btnProductos.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnProductos.setText("Gestion Productos");
        btnProductos.setFocusPainted(false);
        btnProductos.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnProductosActionPerformed(evt);
            }
        });
        jpnGestion.add(btnProductos);

        jpnAdministracion.add(jpnGestion);

        jpnInformes.setLayout(new java.awt.GridLayout(2, 0, 0, 10));

        jBTurnos1.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        jBTurnos1.setText("Reporte de Turnos");
        jBTurnos1.setToolTipText("");
        jBTurnos1.setFocusPainted(false);
        jBTurnos1.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jBTurnos1ActionPerformed(evt);
            }
        });
        jpnInformes.add(jBTurnos1);

        jBVentas.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        jBVentas.setText("Informe de Ventas");
        jBVentas.setFocusPainted(false);
        jBVentas.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jBVentasActionPerformed(evt);
            }
        });
        jpnInformes.add(jBVentas);

        jpnAdministracion.add(jpnInformes);

        getContentPane().add(jpnAdministracion, java.awt.BorderLayout.WEST);

        jpnSuperior.setBorder(javax.swing.BorderFactory.createEmptyBorder(20, 20, 20, 20));
        jpnSuperior.setLayout(new java.awt.GridLayout(1, 3, 10, 0));

        jpnInformacion.setLayout(new org.netbeans.lib.awtextra.AbsoluteLayout());

        Bienvenido.setFont(new java.awt.Font("Arial", 0, 36)); // NOI18N
        Bienvenido.setText("Bienvenid@:");
        Bienvenido.setVerticalAlignment(javax.swing.SwingConstants.TOP);
        jpnInformacion.add(Bienvenido, new org.netbeans.lib.awtextra.AbsoluteConstraints(30, 20, -1, -1));

        lblInfoUser.setFont(new java.awt.Font("Arial", 1, 36)); // NOI18N
        lblInfoUser.setText("******************");
        lblInfoUser.setVerticalAlignment(javax.swing.SwingConstants.TOP);
        jpnInformacion.add(lblInfoUser, new org.netbeans.lib.awtextra.AbsoluteConstraints(120, 80, 280, -1));

        jpnSuperior.add(jpnInformacion);

        jpnLogo.setPreferredSize(new java.awt.Dimension(480, 225));
        jpnLogo.setLayout(new org.netbeans.lib.awtextra.AbsoluteLayout());

        lblLogotipo.setHorizontalAlignment(javax.swing.SwingConstants.CENTER);
        lblLogotipo.setIcon(new javax.swing.ImageIcon(getClass().getResource("/images/logotipo_cliente.png"))); // NOI18N
        jpnLogo.add(lblLogotipo, new org.netbeans.lib.awtextra.AbsoluteConstraints(70, 0, 230, -1));

        jpnSuperior.add(jpnLogo);

        jpnFecha.setLayout(new org.netbeans.lib.awtextra.AbsoluteLayout());

        lblMes.setFont(new java.awt.Font("Arial", 0, 18)); // NOI18N
        lblMes.setText("Septiembre");
        jpnFecha.add(lblMes, new org.netbeans.lib.awtextra.AbsoluteConstraints(10, 150, -1, 30));

        lblDiaSemana.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        lblDiaSemana.setText("Sabado");
        jpnFecha.add(lblDiaSemana, new org.netbeans.lib.awtextra.AbsoluteConstraints(10, 60, -1, -1));

        lblHora.setFont(new java.awt.Font("Arial", 1, 52)); // NOI18N
        lblHora.setText("07:00 PM");
        jpnFecha.add(lblHora, new org.netbeans.lib.awtextra.AbsoluteConstraints(110, 90, -1, -1));

        lblDia.setFont(new java.awt.Font("Arial", 0, 70)); // NOI18N
        lblDia.setText("28");
        jpnFecha.add(lblDia, new org.netbeans.lib.awtextra.AbsoluteConstraints(10, 80, -1, -1));

        jpnSuperior.add(jpnFecha);

        getContentPane().add(jpnSuperior, java.awt.BorderLayout.NORTH);

        jpnCentral.setLayout(new java.awt.BorderLayout());

        jpnVentas.setBorder(javax.swing.BorderFactory.createEmptyBorder(30, 30, 30, 30));
        jpnVentas.setPreferredSize(new java.awt.Dimension(0, 0));
        jpnVentas.setLayout(new java.awt.GridLayout(3, 1, 0, 50));

        btnVentas.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnVentas.setText("Iniciar Venta");
        btnVentas.setFocusPainted(false);
        btnVentas.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);
        btnVentas.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnVentasActionPerformed(evt);
            }
        });
        jpnVentas.add(btnVentas);

        btnPedidos.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnPedidos.setText("Cerrar Venta");
        btnPedidos.setFocusPainted(false);
        btnPedidos.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);
        btnPedidos.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnPedidosActionPerformed(evt);
            }
        });
        jpnVentas.add(btnPedidos);

        jpnExit.setBorder(javax.swing.BorderFactory.createEmptyBorder(20, 20, 20, 20));

        jBExit.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        jBExit.setIcon(new javax.swing.ImageIcon(getClass().getResource("/images/icons/exit.png"))); // NOI18N
        jBExit.setFocusPainted(false);
        jBExit.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);
        jBExit.setVerticalTextPosition(javax.swing.SwingConstants.BOTTOM);
        jBExit.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                jBExitActionPerformed(evt);
            }
        });
        jpnExit.add(jBExit);
        jBExit.getAccessibleContext().setAccessibleParent(jpnCentral);

        jpnVentas.add(jpnExit);

        jpnCentral.add(jpnVentas, java.awt.BorderLayout.CENTER);

        getContentPane().add(jpnCentral, java.awt.BorderLayout.CENTER);

        jpnBarista.setBorder(javax.swing.BorderFactory.createEmptyBorder(20, 20, 20, 20));
        jpnBarista.setLayout(new java.awt.GridLayout(2, 0, 0, 20));

        jpnTurno.setLayout(new java.awt.GridLayout(3, 0, 0, 20));

        btnCerrarTurno.setFont(new java.awt.Font("Arial", 0, 30)); // NOI18N
        btnCerrarTurno.setText("Cerrar Turno");
        btnCerrarTurno.setFocusPainted(false);
        btnCerrarTurno.setFocusable(false);
        btnCerrarTurno.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnCerrarTurnoActionPerformed(evt);
            }
        });
        jpnTurno.add(btnCerrarTurno);

        btnAbrirTurno.setFont(new java.awt.Font("Arial", 0, 30)); // NOI18N
        btnAbrirTurno.setText("Abrir Turno");
        btnAbrirTurno.setFocusPainted(false);
        btnAbrirTurno.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnAbrirTurnoActionPerformed(evt);
            }
        });
        jpnTurno.add(btnAbrirTurno);

        lblInfoTurno.setFont(new java.awt.Font("Arial", 0, 18)); // NOI18N
        lblInfoTurno.setText("domingo 24 de agosto 15:00");
        lblInfoTurno.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);
        jpnTurno.add(lblInfoTurno);

        jpnBarista.add(jpnTurno);

        jpnOperaciones.setLayout(new java.awt.GridLayout(2, 0, 0, 50));

        btnOperaciones.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnOperaciones.setText("<html><center>Ingreso / Egreso<br>de Dinero</center></html>");
        btnOperaciones.setFocusPainted(false);
        btnOperaciones.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnOperacionesActionPerformed(evt);
            }
        });
        jpnOperaciones.add(btnOperaciones);

        btnFacturas.setFont(new java.awt.Font("Arial", 0, 24)); // NOI18N
        btnFacturas.setText("Pedidos y Facturas");
        btnFacturas.setFocusPainted(false);
        btnFacturas.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);
        btnFacturas.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                btnFacturasActionPerformed(evt);
            }
        });
        jpnOperaciones.add(btnFacturas);

        jpnBarista.add(jpnOperaciones);

        getContentPane().add(jpnBarista, java.awt.BorderLayout.EAST);

        pack();
    }// </editor-fold>//GEN-END:initComponents
 /* Funcion : llamar Usuarios
    Nota : 
  * Desarrollador :(Brayan cristancho) 
  * Fecha de creacion : 01/08/2018**/
    private void btnUsuariosActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnUsuariosActionPerformed
        // llamar a tabla usuarios:
        
        frmListadoUsuarios.usuario = admin;
        this.dispose();
        new frmListadoUsuarios(this).setVisible(true);

    }//GEN-LAST:event_btnUsuariosActionPerformed

    private void btnAbrirTurnoActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnAbrirTurnoActionPerformed
            
         /*frmValorTurno formAbrirTurno = new frmValorTurno(this);
        // formAbrirTurno.setUndecorated(true);
         formAbrirTurno.setVisible(true);
         
         */
          Calendar calendario = Calendar.getInstance();
        
        Date date = calendario.getTime(); 
        SimpleDateFormat fecha = new SimpleDateFormat("EEE, dd MMM yyyy - HH:mm");
       
       Turnos abrirTurno = new Turnos(date, date, (int) valorCaja , "Abierto");
        
        
            Transaction trns = null;
            Session session = HibernateUtil.getSessionFactory().openSession();
            try {
                trns = session.beginTransaction();

               session.save(abrirTurno);
               session.getTransaction().commit();
               
               //JOptionPane.showMessageDialog(null, "Turno Abierto");
               
               btnAbrirTurno.setVisible(false);
               btnCerrarTurno.setVisible(true);
               lblInfoTurno.setText(String.valueOf(fecha.format(abrirTurno.getApertura())));
               lblInfoTurno.setVisible(true);
               btnOperaciones.setEnabled(true);
               btnPedidos.setEnabled(true);
               btnVentas.setEnabled(true);
               turnoAbierto = abrirTurno;
              

            }catch (RuntimeException ex) {
                ex.printStackTrace();
            }finally {
                session.flush();
                session.close();
            }
       
    }//GEN-LAST:event_btnAbrirTurnoActionPerformed

    private void btnCerrarTurnoActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnCerrarTurnoActionPerformed
         
        // TODO add your handling code here:
        //reload form BBDD
        Transaction trns = null;
        Session session = HibernateUtil.getSessionFactory().openSession();
        Turnos turnoActual = (Turnos) session.get(Turnos.class, turnoAbierto.getIdTurno());

        if (turnoActual.getVentasAbiertas().size() > 0) {
            JOptionPane.showMessageDialog(null, "<html>Señor, "+ this.admin.getNombres() +"<br> Usted no puede cerrar el turno debido a que cuenta con facturas pendientes por cobrar,"
                    + "                          <br> Dirijase al Modulo de Ventas y Cancele las Facturas!</html>");
        } else {
            Calendar calendario = Calendar.getInstance();
            Date date = calendario.getTime();
            
            turnoActual.setCierre(date);
            turnoActual.setEstado("Cerrado");

            Map<String, Object> params = new HashMap<String, Object>();
            params.put("turno", turnoActual);
            
            try {
                JasperPrint jasperPrint = JasperFillManager.fillReport("src\\reports\\turno.jasper", params, new JREmptyDataSource());
                //JasperViewer.viewReport(jasperPrint, true);
                JasperPrintManager.printReport(jasperPrint, false);
                

            } catch (JRException e) {
                System.err.println("Error iReport: " + e.getMessage());
            }

            //IMPRIMIR REPORTE DE INVENTARIO
            //this.printReportInventario(turnoActual);

            try {
                trns = session.beginTransaction();
                session.update(turnoActual);
                trns.commit();
                //JOptionPane.showMessageDialog(null, "Turno Cerrado Correctamente");
                btnAbrirTurno.setVisible(true);
                btnCerrarTurno.setVisible(false);
                lblInfoTurno.setVisible(false);
                btnOperaciones.setEnabled(false);

            } catch (RuntimeException ex) {
                ex.printStackTrace();
            } finally {
                trns = null;
                session.flush();
                session.close();
                turnoAbierto = turnoActual;
            }
        }
    }//GEN-LAST:event_btnCerrarTurnoActionPerformed
 /* Funcion : llamar Mesas
    Nota : 
  * Desarrollador :(Brayan cristancho) 
  * Fecha de creacion : 01/08/2018**/
    private void btnVentasActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnVentasActionPerformed
       this.dispose();
        // llamr tabla mesas:
        frmMesas formMesas = new frmMesas(new Ventas(), turnoAbierto, admin,"Administrador");
        formMesas.setVisible(true);
       
        
    }//GEN-LAST:event_btnVentasActionPerformed
   
    private void btnProductosActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnProductosActionPerformed
        // TODO add your handling code here:
        frmListadoProductos.usuario = admin;
        this.dispose();
        new  frmListadoProductos(this).setVisible(true);
        
    }//GEN-LAST:event_btnProductosActionPerformed

    private void btnCategoriasActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnCategoriasActionPerformed
        // llamar Categorias:
        
        frmListarCategorias.usuario = admin;
        
        this.dispose();
        new  frmListarCategorias(this).setVisible(true);
    }//GEN-LAST:event_btnCategoriasActionPerformed

    private void btnOperacionesActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnOperacionesActionPerformed
       
        frmListadoOperaciones.admin = admin;
         this.dispose();
        new frmListadoOperaciones(this,turnoAbierto).setVisible(true);
// TODO add your handling code here:
    }//GEN-LAST:event_btnOperacionesActionPerformed
/* Funcion : regresar
    Nota : 
  * Desarrollador :(Brayan cristancho) 
  * Fecha de creacion : 01/08/2018**/
    private void jBExitActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jBExitActionPerformed
        System.exit(0);
    }//GEN-LAST:event_jBExitActionPerformed

    private void btnPedidosActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnPedidosActionPerformed
        frmPedidos.usuario = admin;
        this.dispose();
        new frmPedidos(this).setVisible(true);        // TODO add your handling code here:
    }//GEN-LAST:event_btnPedidosActionPerformed

    private void btnMesasActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnMesasActionPerformed
        this.dispose();
        
        frmListarMesas.usuario = admin;
        
        new frmListarMesas(this).setVisible(true);        // TODO add your handling code here:
    }//GEN-LAST:event_btnMesasActionPerformed

    private void jBVentasActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jBVentasActionPerformed
        // TODO add your handling code here:
         this.setVisible(true);
         frmVentas.usuario = admin;
        new frmVentas(this).setVisible(true);
    }//GEN-LAST:event_jBVentasActionPerformed

    private void jBTurnos1ActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_jBTurnos1ActionPerformed
         this.dispose();
         
         frmListarTurnos.usuario = admin;
         
        new frmListarTurnos(this).setVisible(true);        // TODO add your handling code here:
    }//GEN-LAST:event_jBTurnos1ActionPerformed

    private void btnFacturasActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_btnFacturasActionPerformed
        
        frmListadoPedidosProveedores.usuario = admin;
        this.dispose();
        new frmListadoPedidosProveedores(this).setVisible(true);// TODO add your handling code here:
    }//GEN-LAST:event_btnFacturasActionPerformed

    /**
     * @param args the command line arguments
     */
    
    
    public void printReportInventario(Turnos t){
        ArrayList<dataIProductos> productos = new ArrayList();
        
        Session sesion = HibernateUtil.getSessionFactory().openSession();
        Query q = sesion.createQuery("SELECT P FROM models.Productos P JOIN P.categorias C WHERE C.tipo = 'Contable' ORDER BY P.nombre ASC");
        ArrayList products = (ArrayList) q.list();
        
        for(Object obj : products){
            Productos prod = (Productos) obj;
            
            BigDecimal stock = prod.getStock();
            int sto = stock.setScale(0, RoundingMode.DOWN).intValueExact();
            
            productos.add(new dataIProductos(prod.getNombre() ,prod , sto,0,0,sto));
            
        }
        q = null;
        sesion.flush();
        sesion.close();
        
        ArrayList listadoVentas= t.getVentas();
        
        for(Object obj : listadoVentas){
            Ventas venta = (Ventas) obj;
            
            for( Object o : venta.getPedidoses()){
                Pedidos p = (Pedidos) o;
                
                for(dataIProductos dIP : productos){
                    if(dIP.getProductoM().getIdProducto().equals(p.getProducto().getIdProducto())){
                        dIP.setSalida(dIP.getSalida()+p.getCantidad());
                        dIP.setBase(dIP.getBase()+p.getCantidad());
                        break;
                    }
                }
                
                //SERVICIOS
                for(Object ob : p.getServicioses()){
                    Servicios s = (Servicios) ob;
                    
                    for(dataIProductos dIP : productos){
                        if(dIP.getProductoM().getIdProducto().equals(s.getProducto().getIdProducto())){
                            dIP.setSalida(dIP.getSalida()+s.getCantidad());
                            dIP.setBase(dIP.getBase()+s.getCantidad());
                            break;
                        }

                    }
                    
                }
                
            }
        }
        
        sesion = HibernateUtil.getSessionFactory().openSession();
        q = sesion.createQuery("SELECT I FROM Ingresoproductos I WHERE I.fecha BETWEEN :startDate AND :endDate");
        q.setDate("startDate", t.getApertura());
        q.setDate("endDate", t.getCierre());
        
        ArrayList listado = (ArrayList) q.list();
        
        for(Object obj : listado){
            Ingresoproductos iProducto = (Ingresoproductos) obj;
            
            for(dataIProductos dIP : productos){
                if(dIP.getProductoM().getIdProducto().equals(iProducto.getProductos().getIdProducto())){
                    dIP.setIngreso(dIP.getIngreso());
                    break;
                }
                
            }
            
            
            
        }
        
        Map<String,Object> params = new HashMap<String,Object>();
        params.put("fecha", t.getCierre());
        try{
            //se procesa el archivo jasper
            JasperPrint jasperPrint = JasperFillManager.fillReport("src/reports/ingreso_productos.jasper",params,new JRBeanCollectionDataSource(productos));
            
            //JasperViewer.viewReport(jasperPrint, true);
            JasperPrintManager.printReport(jasperPrint, false);   
            
            
            
        }catch (JRException ex){
            JOptionPane.showMessageDialog(rootPane, "Error iReport: " + ex.getMessage());
        }catch(Exception ex){
            JOptionPane.showMessageDialog(rootPane, "Error iReport: " + ex.getMessage());
        }finally{
            sesion.flush();
            sesion.close();
            //venta.sendPrint(sesion);
        }
    }
    
    
    @Override
    public void run() {
 
        while(true){
     
            
                            // 1. Obtienes el "now" (la hora actual del sistema)
                LocalDateTime ahora = LocalDateTime.now();

                // 2. Le especificas el patrón exacto que quieres (hh = hora 12h con cero, mm = minutos con cero, a = AM/PM)
                DateTimeFormatter formato = DateTimeFormatter.ofPattern("hh:mm a");

                // 3. Lo formateas y lo seteas al Label de una
                lblHora.setText(ahora.format(formato));
            
            
            /*if(usuarioLogeado.getPerfil().equals("Administrador")) 
                lblSaldoCaja.setText("<html>Saldo Actual: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorCaja))+"</html>");
                lblSaldoPropinas.setText("<html>Saldo Propinas: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorPropinas))+"</html>");
                lblSaldoTrx.setText("<html>Saldo Transferencia: <br> "+String.valueOf(NumberFormat.getCurrencyInstance(new Locale("es", "CO")).format(valorPagoTransferencia))+"</html>");
                */
            try{
                Thread.sleep(1000);
            }catch(Exception e){
                e.printStackTrace();
            }
        }
 
    }

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JLabel Bienvenido;
    public javax.swing.JButton btnAbrirTurno;
    private javax.swing.JButton btnCategorias;
    public javax.swing.JButton btnCerrarTurno;
    private javax.swing.JButton btnFacturas;
    private javax.swing.JButton btnMesas;
    public javax.swing.JButton btnOperaciones;
    public javax.swing.JButton btnPedidos;
    private javax.swing.JButton btnProductos;
    private javax.swing.JButton btnUsuarios;
    public javax.swing.JButton btnVentas;
    private javax.swing.JButton jBExit;
    private javax.swing.JButton jBTurnos1;
    private javax.swing.JButton jBVentas;
    private javax.swing.JPanel jpnAdministracion;
    private javax.swing.JPanel jpnBarista;
    private javax.swing.JPanel jpnCentral;
    private javax.swing.JPanel jpnExit;
    private javax.swing.JPanel jpnFecha;
    private javax.swing.JPanel jpnGestion;
    private javax.swing.JPanel jpnInformacion;
    private javax.swing.JPanel jpnInformes;
    private javax.swing.JPanel jpnLogo;
    private javax.swing.JPanel jpnOperaciones;
    private javax.swing.JPanel jpnSuperior;
    private javax.swing.JPanel jpnTurno;
    private javax.swing.JPanel jpnVentas;
    public javax.swing.JLabel lblDia;
    public javax.swing.JLabel lblDiaSemana;
    public javax.swing.JLabel lblHora;
    public javax.swing.JLabel lblInfoTurno;
    private javax.swing.JLabel lblInfoUser;
    private javax.swing.JLabel lblLogotipo;
    public javax.swing.JLabel lblMes;
    // End of variables declaration//GEN-END:variables
}
