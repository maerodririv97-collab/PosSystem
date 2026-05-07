-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-05-2026 a las 00:29:28
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pos_system`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `tipo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conceptos_operaciones`
--

CREATE TABLE `conceptos_operaciones` (
  `id_concepto_operacion` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `conceptos_operaciones`
--

INSERT INTO `conceptos_operaciones` (`id_concepto_operacion`, `nombre`, `descripcion`) VALUES
(1, 'INGRESO GENERAL', 'Ingreso de dinero en efectivo por gerencia'),
(2, 'Pagos Proveedores', 'Pago sobre pedidos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id_factura` int(11) NOT NULL,
  `codigo` varchar(100) NOT NULL,
  `nombre_proveedor` varchar(450) NOT NULL,
  `fecha` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ingresoproductos`
--

CREATE TABLE `ingresoproductos` (
  `id_ingreso_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `costo_ingreso` float NOT NULL,
  `producto` int(11) NOT NULL,
  `factura` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mesas`
--

CREATE TABLE `mesas` (
  `id_mesa` int(11) NOT NULL,
  `numero` varchar(45) NOT NULL,
  `tipo` enum('Mesa','Barra','Isla') NOT NULL,
  `estado` enum('Activa','Inactiva') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `operaciones`
--

CREATE TABLE `operaciones` (
  `id_operacion` int(11) NOT NULL,
  `tipo` enum('Ingreso','Salida') NOT NULL,
  `valor` int(11) NOT NULL,
  `fecha` datetime NOT NULL,
  `concepto` varchar(100) NOT NULL,
  `turno` int(11) NOT NULL,
  `administrador` int(11) NOT NULL,
  `tipo_concepto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL,
  `producto` int(11) NOT NULL,
  `venta` int(11) NOT NULL,
  `valor` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `impreso` tinyint(1) NOT NULL DEFAULT 0,
  `descuento` int(11) DEFAULT 0,
  `concepto_desc` varchar(100) DEFAULT NULL,
  `compra` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `precios_especiales`
--

CREATE TABLE `precios_especiales` (
  `id_precio_especial` int(11) NOT NULL,
  `fecha_inicio` datetime(6) NOT NULL,
  `fecha_fin` datetime(6) NOT NULL,
  `estado` varchar(8) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `codigo_barras` varchar(100) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `costo` int(11) NOT NULL,
  `valor` int(11) NOT NULL,
  `stock` decimal(5,2) NOT NULL,
  `servicio` tinyint(1) NOT NULL DEFAULT 0,
  `categoria` int(11) NOT NULL,
  `tipo_venta` enum('Peso','Unidad') NOT NULL,
  `imagen` varchar(45) NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_especiales`
--

CREATE TABLE `productos_especiales` (
  `id_producto_especial` int(11) NOT NULL,
  `precio_especial` int(11) NOT NULL,
  `producto` int(11) NOT NULL,
  `valor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_servicio` int(11) NOT NULL,
  `pedido` int(11) NOT NULL,
  `producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subproductos`
--

CREATE TABLE `subproductos` (
  `id_subproducto` int(11) NOT NULL,
  `producto` int(11) NOT NULL,
  `subproducto` int(11) NOT NULL,
  `cantidad` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnos`
--

CREATE TABLE `turnos` (
  `id_turno` int(11) NOT NULL,
  `apertura` datetime NOT NULL,
  `cierre` datetime NOT NULL,
  `valor_inicial` int(11) NOT NULL,
  `estado` enum('Abierto','Cerrado') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombres` varchar(50) NOT NULL,
  `apellidos` varchar(50) NOT NULL,
  `pin` smallint(4) NOT NULL,
  `perfil` enum('Gerente','Administrador','Mesero') NOT NULL,
  `estado` enum('Activo','Inactivo') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombres`, `apellidos`, `pin`, `perfil`, `estado`) VALUES
(2, 'Jessica', 'Ro', 0, 'Administrador', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `fecha` datetime NOT NULL,
  `mesa` int(11) NOT NULL,
  `mesero` int(11) NOT NULL,
  `turno` int(11) NOT NULL,
  `forma_pago` enum('Efectivo','Tarjeta') NOT NULL,
  `estado` enum('Abierta','Facturada','Pagada','Reembolsada') NOT NULL DEFAULT 'Abierta'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indices de la tabla `conceptos_operaciones`
--
ALTER TABLE `conceptos_operaciones`
  ADD PRIMARY KEY (`id_concepto_operacion`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id_factura`);

--
-- Indices de la tabla `ingresoproductos`
--
ALTER TABLE `ingresoproductos`
  ADD PRIMARY KEY (`id_ingreso_producto`),
  ADD KEY `fk_ingresoproductos_productos1_idx` (`producto`),
  ADD KEY `FKk6gwhc6a79uibphrpuopn4sdc` (`factura`);

--
-- Indices de la tabla `mesas`
--
ALTER TABLE `mesas`
  ADD PRIMARY KEY (`id_mesa`),
  ADD UNIQUE KEY `numero_UNIQUE` (`numero`);

--
-- Indices de la tabla `operaciones`
--
ALTER TABLE `operaciones`
  ADD PRIMARY KEY (`id_operacion`),
  ADD KEY `fk_operaciones_turnos1_idx` (`turno`),
  ADD KEY `fk_operaciones_usuarios1_idx` (`administrador`),
  ADD KEY `FKapqy3euiwdmcdpp1m7qn9uev0` (`tipo_concepto`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `fk_productos_has_ventas_ventas1_idx` (`venta`),
  ADD KEY `fk_productos_has_ventas_productos1_idx` (`producto`);

--
-- Indices de la tabla `precios_especiales`
--
ALTER TABLE `precios_especiales`
  ADD PRIMARY KEY (`id_precio_especial`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `fk_productos_categorias1_idx` (`categoria`);

--
-- Indices de la tabla `productos_especiales`
--
ALTER TABLE `productos_especiales`
  ADD PRIMARY KEY (`id_producto_especial`),
  ADD KEY `FKdbfqmt51w75b0ep67los040ui` (`precio_especial`),
  ADD KEY `FKt0uwj5dbh25xc0ft95tg116uf` (`producto`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id_servicio`),
  ADD KEY `fk_servicios_pedidos1_idx` (`pedido`),
  ADD KEY `fk_servicios_productos1_idx` (`producto`);

--
-- Indices de la tabla `subproductos`
--
ALTER TABLE `subproductos`
  ADD PRIMARY KEY (`id_subproducto`),
  ADD KEY `fk_subproductos_productos1_idx` (`producto`),
  ADD KEY `fk_subproductos_productos2_idx` (`subproducto`);

--
-- Indices de la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id_turno`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `pin_UNIQUE` (`pin`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `fk_ventas_mesas_idx` (`mesa`),
  ADD KEY `fk_ventas_meseros1_idx` (`mesero`),
  ADD KEY `fk_ventas_turnos1_idx` (`turno`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `conceptos_operaciones`
--
ALTER TABLE `conceptos_operaciones`
  MODIFY `id_concepto_operacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id_factura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `ingresoproductos`
--
ALTER TABLE `ingresoproductos`
  MODIFY `id_ingreso_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `mesas`
--
ALTER TABLE `mesas`
  MODIFY `id_mesa` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `operaciones`
--
ALTER TABLE `operaciones`
  MODIFY `id_operacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de la tabla `precios_especiales`
--
ALTER TABLE `precios_especiales`
  MODIFY `id_precio_especial` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `productos_especiales`
--
ALTER TABLE `productos_especiales`
  MODIFY `id_producto_especial` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id_servicio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subproductos`
--
ALTER TABLE `subproductos`
  MODIFY `id_subproducto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id_turno` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ingresoproductos`
--
ALTER TABLE `ingresoproductos`
  ADD CONSTRAINT `FKk6gwhc6a79uibphrpuopn4sdc` FOREIGN KEY (`factura`) REFERENCES `facturas` (`id_factura`),
  ADD CONSTRAINT `fk_ingresoproductos_productos1` FOREIGN KEY (`producto`) REFERENCES `productos` (`id_producto`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `operaciones`
--
ALTER TABLE `operaciones`
  ADD CONSTRAINT `FKapqy3euiwdmcdpp1m7qn9uev0` FOREIGN KEY (`tipo_concepto`) REFERENCES `conceptos_operaciones` (`id_concepto_operacion`),
  ADD CONSTRAINT `fk_operaciones_turnos1` FOREIGN KEY (`turno`) REFERENCES `turnos` (`id_turno`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_operaciones_usuarios1` FOREIGN KEY (`administrador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_productos_has_ventas_productos1` FOREIGN KEY (`producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_productos_has_ventas_ventas1` FOREIGN KEY (`venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_categorias1` FOREIGN KEY (`categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos_especiales`
--
ALTER TABLE `productos_especiales`
  ADD CONSTRAINT `FKdbfqmt51w75b0ep67los040ui` FOREIGN KEY (`precio_especial`) REFERENCES `precios_especiales` (`id_precio_especial`),
  ADD CONSTRAINT `FKt0uwj5dbh25xc0ft95tg116uf` FOREIGN KEY (`producto`) REFERENCES `productos` (`id_producto`);

--
-- Filtros para la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD CONSTRAINT `fk_servicios_pedidos1` FOREIGN KEY (`pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_servicios_productos1` FOREIGN KEY (`producto`) REFERENCES `productos` (`id_producto`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `subproductos`
--
ALTER TABLE `subproductos`
  ADD CONSTRAINT `fk_subproductos_productos1` FOREIGN KEY (`producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subproductos_productos2` FOREIGN KEY (`subproducto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_ventas_mesas` FOREIGN KEY (`mesa`) REFERENCES `mesas` (`id_mesa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ventas_meseros1` FOREIGN KEY (`mesero`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ventas_turnos1` FOREIGN KEY (`turno`) REFERENCES `turnos` (`id_turno`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
