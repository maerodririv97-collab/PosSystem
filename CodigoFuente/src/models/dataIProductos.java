/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package models;

import java.io.Serializable;

/**
 *
 * @author Javier
 */
public class dataIProductos implements Serializable{
    private String producto;
    private Productos Producto;
    private int base;
    private int ingreso;
    private int salida;
    private int stock;
    
    
    public dataIProductos(){
        
    }
    
    public dataIProductos(String p, Productos pro, int b, int i, int s, int st){
        this.producto = p;
        this.Producto = pro;
        this.base = b;
        this.ingreso = i;
        this.salida = s;
        this.stock = st;
    }

    /**
     * @return the producto
     */
    public String getProducto() {
        return producto;
    }
    
     public Productos getProductoM() {
        return Producto;
    }

    /**
     * @param producto the producto to set
     */
    public void setProducto(String producto) {
        this.producto = producto;
    }

    /**
     * @return the base
     */
    public int getBase() {
        return base;
    }

    /**
     * @param base the base to set
     */
    public void setBase(int base) {
        this.base = base;
    }

    /**
     * @return the ingreso
     */
    public int getIngreso() {
        return ingreso;
    }

    /**
     * @param ingreso the ingreso to set
     */
    public void setIngreso(int ingreso) {
        this.ingreso = ingreso;
    }

    /**
     * @return the salida
     */
    public int getSalida() {
        return salida;
    }

    /**
     * @param salida the salida to set
     */
    public void setSalida(int salida) {
        this.salida = salida;
    }

    /**
     * @return the stock
     */
    public int getStock() {
        return stock;
    }

    /**
     * @param stock the stock to set
     */
    public void setStock(int stock) {
        this.stock = stock;
    }

    /**
     * @param Producto the Producto to set
     */
    public void setProducto(Productos Producto) {
        this.Producto = Producto;
    }
    
    
    
}
