-- phpMyAdmin SQL Dump
-- version 4.6.4
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 31-08-2018 a las 02:00:19
-- Versión del servidor: 5.7.14
-- Versión de PHP: 7.0.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pos_system`
--

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`, `tipo`) VALUES
(1, 'AGUA', ''),
(2, 'AGUARDIENTE', ''),
(3, 'BEBIDAS', ''),
(4, 'CERVEZA', ''),
(5, 'CIGARRILLOS', ''),
(6, 'COCTELES', ''),
(7, 'ESPECIALIZADOS', ''),
(8, 'GINEBRA', ''),
(9, 'MICHELADAS', ''),
(10, 'OFERTAS', ''),
(11, 'OTROS', ''),
(12, 'PAQUETES', ''),
(13, 'RON', ''),
(14, 'SHOTS', ''),
(15, 'SNAKS', ''),
(16, 'SNAKS', ''),
(17, 'TEQUILA', ''),
(18, 'VODKA', ''),
(19, 'WHISKY', '');

--
-- Volcado de datos para la tabla `ingresoproductos`
--

INSERT INTO `ingresoproductos` (`id_ingreso_producto`, `cantidad`, `fecha`, `costo_ingreso`, `producto`) VALUES
(1, 15, '2018-08-30', 50000, 8),
(2, 10, '2018-08-30', 50000, 9);

--
-- Volcado de datos para la tabla `mesas`
--

INSERT INTO `mesas` (`id_mesa`, `numero`, `tipo`, `estado`) VALUES
(21, '01', 'Mesa', 'Activa'),
(22, '02', 'Mesa', 'Activa'),
(23, '03', 'Mesa', 'Activa'),
(24, '04', 'Mesa', 'Activa'),
(25, '05', 'Mesa', 'Activa'),
(26, '06', 'Mesa', 'Activa'),
(27, '07', 'Mesa', 'Activa'),
(28, '08', 'Mesa', 'Activa'),
(29, '09', 'Mesa', 'Activa'),
(30, '10', 'Mesa', 'Activa'),
(31, '11', 'Barra', 'Activa'),
(32, '12', 'Barra', 'Activa'),
(33, '13', 'Barra', 'Activa'),
(34, '14', 'Barra', 'Activa'),
(35, '15', 'Mesa', 'Activa'),
(36, '16', 'Isla', 'Activa'),
(37, '17', 'Isla', 'Activa'),
(38, '18', 'Isla', 'Activa'),
(39, '19', 'Isla', 'Activa'),
(40, '20', 'Isla', 'Activa');

--
-- Volcado de datos para la tabla `operaciones`
--

INSERT INTO `operaciones` (`id_operacion`, `tipo`, `valor`, `fecha`, `concepto`, `turno`, `administrador`) VALUES
(1, 'Ingreso', 50000, '2018-08-28 13:26:34', 'pedido Gaseosas', 8, 2),
(2, 'Salida', 2000000, '2018-08-28 13:36:51', 'pedido Licores', 8, 2);

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id_pedido`, `producto`, `venta`, `valor`, `cantidad`, `impreso`, `descuento`, `concepto_desc`) VALUES
(48, 2, 176, 180000, 3, 0, NULL, NULL),
(52, 3, 179, 6000, 3, 0, NULL, NULL),
(53, 3, 179, 12000, 6, 0, NULL, NULL),
(59, 3, 185, 4000, 2, 0, NULL, NULL),
(60, 6, 186, 12000, 3, 0, NULL, NULL),
(61, 6, 187, 8000, 2, 0, NULL, NULL),
(62, 6, 187, 8000, 2, 1, NULL, NULL),
(63, 6, 188, 8000, 2, 0, NULL, NULL),
(64, 3, 188, 12000, 6, 0, NULL, NULL),
(65, 3, 188, 12000, 6, 1, NULL, NULL),
(66, 6, 188, 8000, 2, 1, NULL, NULL),
(68, 2, 190, 120000, 2, 0, NULL, NULL),
(69, 2, 190, 120000, 2, 1, NULL, NULL),
(71, 2, 192, 300000, 5, 0, NULL, NULL);

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `codigo_barras`, `nombre`, `costo`, `valor`, `stock`, `servicio`, `categoria`, `tipo_venta`, `imagen`, `estado`) VALUES
(1, '', 'Whisky', 50000, 70000, '72.00', 0, 19, 'Unidad', '', 'Activo'),
(2, '', 'Aguardiente Lider', 45000, 60000, '74.00', 0, 2, 'Unidad', '', 'Activo'),
(3, '02600244056739', 'Botella Agua', 4416, 6000, '60.00', 1, 1, 'Unidad', '', 'Activo'),
(4, 'asdsd', 'Gaseosa Ginger', 2000, 4000, '100.00', 1, 3, 'Unidad', '', 'Activo'),
(5, 'asdsd', 'Gaseosa Coca-Cola', 2000, 4000, '100.00', 1, 3, 'Unidad', '', 'Activo'),
(6, 'asdsd', 'Botella de Agua con Gas', 2000, 4000, '42.00', 1, 1, 'Unidad', '', 'Activo'),
(7, '889842084337', 'Gaseosa Manzana', 4274, 7000, '31.00', 0, 3, 'Unidad', '', 'Activo'),
(8, '700020697116', 'Lider Tapa Azul', 50000, 65000, '25.00', 0, 2, 'Unidad', '', 'Activo'),
(9, 'MOI3CV08BCWI003A', 'vodka', 50000, 70000, '10.00', 0, 18, 'Unidad', '', 'Activo');

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id_servicio`, `pedido`, `producto`, `cantidad`) VALUES
(2, 48, 3, 5),
(3, 68, 3, 2),
(4, 71, 3, 5);

--
-- Volcado de datos para la tabla `turnos`
--

INSERT INTO `turnos` (`id_turno`, `apertura`, `cierre`, `valor_inicial`, `estado`) VALUES
(1, '2018-08-27 15:00:00', '2018-08-22 03:00:00', 500000, 'Cerrado'),
(2, '2018-08-27 12:11:38', '2018-08-27 12:11:38', 50000, 'Cerrado'),
(3, '2018-08-27 16:41:08', '2018-08-27 16:25:18', 50000, 'Cerrado'),
(4, '2018-08-27 16:31:29', '2018-08-27 16:32:55', 100000, 'Cerrado'),
(5, '2018-08-27 16:35:40', '2018-08-27 16:36:43', 100000, 'Cerrado'),
(6, '2018-08-27 16:36:51', '2018-08-27 16:45:25', 100000, 'Cerrado'),
(7, '2018-08-27 16:44:31', '2018-08-27 16:44:31', 60000, 'Cerrado'),
(8, '2018-08-27 16:45:04', '2018-08-28 13:36:57', 600000, 'Cerrado'),
(18, '2018-08-28 13:33:22', '2018-08-28 13:33:24', 60000, 'Cerrado'),
(19, '2018-08-29 08:32:47', '2018-08-29 08:32:47', 100000, 'Abierto');

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombres`, `apellidos`, `pin`, `perfil`, `estado`) VALUES
(1, 'Manuel', 'Rodriguez', 1234, 'Mesero', 'Activo'),
(2, 'Cristian', 'Avila', 9876, 'Administrador', 'Activo'),
(3, 'Carlos ', 'Caro', 4567, 'Mesero', 'Activo');

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id_venta`, `fecha`, `mesa`, `mesero`, `turno`, `forma_pago`, `estado`) VALUES
(52, '2018-08-23 08:08:49', 25, 1, 8, 'Efectivo', 'Abierta'),
(61, '2018-08-23 10:03:49', 25, 1, 8, 'Efectivo', 'Abierta'),
(63, '2018-08-23 10:10:59', 22, 1, 8, 'Efectivo', 'Abierta'),
(64, '2018-08-23 14:19:17', 24, 1, 8, 'Efectivo', 'Abierta'),
(82, '2018-08-23 15:50:34', 33, 1, 8, 'Efectivo', 'Abierta'),
(83, '2018-08-24 08:21:46', 21, 1, 8, 'Efectivo', 'Abierta'),
(84, '2018-08-24 08:35:40', 21, 1, 8, 'Efectivo', 'Abierta'),
(85, '2018-08-24 08:39:08', 21, 1, 8, 'Efectivo', 'Abierta'),
(91, '2018-08-24 08:57:53', 32, 1, 8, 'Efectivo', 'Abierta'),
(96, '2018-08-24 09:39:32', 37, 1, 8, 'Efectivo', 'Abierta'),
(108, '2018-08-24 11:52:23', 32, 1, 8, 'Efectivo', 'Abierta'),
(116, '2018-08-24 12:18:15', 21, 1, 8, 'Efectivo', 'Abierta'),
(121, '2018-08-25 12:17:39', 21, 1, 8, 'Efectivo', 'Abierta'),
(126, '2018-08-27 09:00:23', 27, 1, 8, 'Efectivo', 'Abierta'),
(127, '2018-08-27 09:01:04', 25, 1, 8, 'Efectivo', 'Abierta'),
(131, '2018-08-27 11:21:58', 25, 1, 8, 'Efectivo', 'Abierta'),
(135, '2018-08-27 11:42:15', 32, 1, 8, 'Efectivo', 'Abierta'),
(136, '2018-08-27 11:46:51', 33, 1, 8, 'Efectivo', 'Abierta'),
(137, '2018-08-27 11:51:05', 37, 1, 8, 'Efectivo', 'Abierta'),
(139, '2018-08-27 11:53:44', 39, 1, 8, 'Efectivo', 'Abierta'),
(140, '2018-08-27 13:57:52', 24, 1, 8, 'Efectivo', 'Abierta'),
(142, '2018-08-27 14:02:01', 29, 1, 8, 'Efectivo', 'Abierta'),
(143, '2018-08-27 14:07:59', 24, 1, 8, 'Efectivo', 'Abierta'),
(144, '2018-08-27 14:09:09', 25, 1, 8, 'Efectivo', 'Abierta'),
(145, '2018-08-27 14:13:22', 32, 1, 8, 'Efectivo', 'Abierta'),
(162, '2018-08-29 14:04:17', 25, 1, 19, 'Efectivo', 'Abierta'),
(163, '2018-08-29 14:20:04', 25, 1, 19, 'Efectivo', 'Abierta'),
(164, '2018-08-29 14:22:39', 24, 1, 19, 'Efectivo', 'Abierta'),
(165, '2018-08-29 14:26:01', 24, 1, 19, 'Efectivo', 'Abierta'),
(166, '2018-08-29 14:38:26', 25, 1, 19, 'Efectivo', 'Abierta'),
(167, '2018-08-29 14:39:31', 24, 1, 19, 'Efectivo', 'Abierta'),
(169, '2018-08-29 15:00:49', 25, 1, 19, 'Efectivo', 'Abierta'),
(176, '2018-08-29 15:26:49', 29, 1, 19, 'Efectivo', 'Abierta'),
(179, '2018-08-29 15:38:38', 25, 1, 19, 'Efectivo', 'Abierta'),
(185, '2018-08-29 16:35:13', 25, 1, 19, 'Efectivo', 'Abierta'),
(186, '2018-08-29 16:40:32', 27, 1, 19, 'Efectivo', 'Abierta'),
(187, '2018-08-29 16:48:28', 25, 1, 19, 'Efectivo', 'Abierta'),
(188, '2018-08-29 16:52:36', 33, 3, 19, 'Efectivo', 'Abierta'),
(190, '2018-08-29 17:16:26', 37, 1, 19, 'Efectivo', 'Abierta'),
(192, '2018-08-29 17:18:00', 26, 1, 19, 'Efectivo', 'Abierta');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
