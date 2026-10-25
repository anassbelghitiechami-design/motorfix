-- =====================================================================
-- MotorFix · Base de datos
-- Paso a tablas del diagrama EER (docs/diagrama-er.svg)
-- MySQL / MariaDB (XAMPP) · utf8mb4
-- =====================================================================

DROP DATABASE IF EXISTS motorfix;
CREATE DATABASE motorfix CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE motorfix;

-- ---------------------------------------------------------------------
-- USUARIO (supertipo)
-- Generalización T,D -> el atributo rol indica el único subtipo.
-- ADMINISTRADOR y OFICINA no tienen atributos ni relaciones propias,
-- así que no necesitan tabla: basta con el rol.
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(120) NOT NULL,
    password    VARCHAR(255) NOT NULL,                 -- hash BCrypt
    nombre      VARCHAR(80)  NOT NULL,
    rol         ENUM('admin','oficina','mecanico','cliente') NOT NULL,
    auth_key    VARCHAR(64)  NULL,                     -- solo si se usa token
    CONSTRAINT uk_usuario_email    UNIQUE (email),
    CONSTRAINT uk_usuario_auth_key UNIQUE (auth_key)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CLIENTE (subtipo de USUARIO)
-- direccion es un atributo compuesto -> una columna por componente.
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
    id_usuario  INT UNSIGNED PRIMARY KEY,
    dni         VARCHAR(9)   NOT NULL,
    telefono    VARCHAR(15)  NOT NULL,
    calle       VARCHAR(120) NULL,
    numero      VARCHAR(10)  NULL,
    cp          CHAR(5)      NULL,
    localidad   VARCHAR(80)  NULL,
    CONSTRAINT uk_cliente_dni UNIQUE (dni),
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- MECANICO (subtipo de USUARIO)
-- No tiene atributos propios, pero sí la relación "atiende" con CITA.
-- Tenerlo como tabla garantiza que solo un mecánico puede atender citas.
-- ---------------------------------------------------------------------
CREATE TABLE mecanico (
    id_usuario  INT UNSIGNED PRIMARY KEY,
    CONSTRAINT fk_mecanico_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VEHICULO
-- tiene: CLIENTE (0-n) — VEHICULO (1-1, E) -> FK NOT NULL en vehiculo.
-- ---------------------------------------------------------------------
CREATE TABLE vehiculo (
    matricula   VARCHAR(10)  PRIMARY KEY,
    id_cliente  INT UNSIGNED NOT NULL,
    marca       VARCHAR(50)  NOT NULL,
    modelo      VARCHAR(50)  NOT NULL,
    anio        SMALLINT UNSIGNED NULL,
    CONSTRAINT fk_vehiculo_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_usuario)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CITA
-- recibe:  VEHICULO (0-n) — CITA (1-1, E)  -> matricula NOT NULL
-- atiende: MECANICO (0-n) — CITA (0-1)     -> id_mecanico NULL
-- mano_obra es un atributo compuesto -> horas + precio_hora.
-- ---------------------------------------------------------------------
CREATE TABLE cita (
    id_cita        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricula      VARCHAR(10)  NOT NULL,
    id_mecanico    INT UNSIGNED NULL,
    fecha_hora     DATETIME     NOT NULL,
    tipo_servicio  VARCHAR(40)  NULL,
    motivo         TEXT         NULL,
    estado         ENUM('pendiente','confirmada','rechazada','en_curso','finalizada')
                   NOT NULL DEFAULT 'pendiente',
    horas          DECIMAL(5,2) NULL,
    precio_hora    DECIMAL(8,2) NULL,
    CONSTRAINT fk_cita_vehiculo FOREIGN KEY (matricula)
        REFERENCES vehiculo (matricula)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cita_mecanico FOREIGN KEY (id_mecanico)
        REFERENCES mecanico (id_usuario)
        ON DELETE SET NULL ON UPDATE CASCADE
    -- horas >= 0 y precio_hora >= 0 se validan en PHP: Sequel Pro se cierra
    -- al abrir tablas con CHECK.
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CITA_PIEZA
-- piezas es un atributo compuesto y multievaluado (n) de CITA
-- -> tabla propia. Una pieza no se repite dentro de la misma cita:
--    (id_cita, referencia) es UNIQUE. Se usa una clave simple porque
--    Sequel Pro falla con claves primarias compuestas.
-- ---------------------------------------------------------------------
CREATE TABLE cita_pieza (
    id_cita_pieza INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cita      INT UNSIGNED NOT NULL,
    referencia   VARCHAR(30)  NOT NULL,
    descripcion  VARCHAR(120) NOT NULL,
    unidades     INT UNSIGNED NOT NULL,
    precio       DECIMAL(8,2) NOT NULL,
    CONSTRAINT uk_cita_pieza UNIQUE (id_cita, referencia),
    CONSTRAINT fk_cita_pieza_cita FOREIGN KEY (id_cita)
        REFERENCES cita (id_cita)
        ON DELETE CASCADE ON UPDATE CASCADE
    -- unidades > 0 y precio >= 0 se validan en PHP: Sequel Pro se cierra
    -- al abrir esta tabla si lleva estos CHECK.
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- FACTURA
-- genera: CITA (0-1) — FACTURA (1-1, E) -> id_cita NOT NULL y UNIQUE (1:1)
-- ---------------------------------------------------------------------
CREATE TABLE factura (
    numero          VARCHAR(12)   PRIMARY KEY,
    id_cita         INT UNSIGNED  NOT NULL,
    fecha           DATE          NOT NULL,
    base_imponible  DECIMAL(10,2) NOT NULL,
    iva_pct         DECIMAL(4,2)  NOT NULL DEFAULT 21.00,
    cuota_iva       DECIMAL(10,2) NOT NULL,
    total           DECIMAL(10,2) NOT NULL,
    CONSTRAINT uk_factura_cita UNIQUE (id_cita),
    CONSTRAINT fk_factura_cita FOREIGN KEY (id_cita)
        REFERENCES cita (id_cita)
        ON DELETE RESTRICT ON UPDATE CASCADE
    -- importes >= 0 y total = base_imponible + cuota_iva se validan en PHP:
    -- Sequel Pro se cierra al abrir esta tabla si lleva estos CHECK.
) ENGINE=InnoDB;

-- =====================================================================
-- DATOS DE PRUEBA
-- Todos los usuarios de prueba tienen la contraseña: Motorfix1234
-- (guardada como hash BCrypt, generado con password_hash()).
-- =====================================================================
SET @pass = '$2y$10$jH0T3vhsOO8KioJRvaGef.Ex7JhPo.7pILiVQFKDK9GkaAw5p8kpK';

INSERT INTO usuario (id_usuario, email, password, nombre, rol) VALUES
    (1, 'admin@motorfix.test',    @pass, 'Administrador', 'admin'),
    (2, 'oficina@motorfix.test',  @pass, 'Laura Oficina', 'oficina'),
    (3, 'mecanico@motorfix.test', @pass, 'Pedro Mecánico', 'mecanico'),
    (4, 'ana@motorfix.test',      @pass, 'Ana García',    'cliente'),
    (5, 'luis@motorfix.test',     @pass, 'Luis Pérez',    'cliente');

INSERT INTO mecanico (id_usuario) VALUES (3);

INSERT INTO cliente (id_usuario, dni, telefono, calle, numero, cp, localidad) VALUES
    (4, '12345678A', '600111222', 'Calle Mayor', '10', '03201', 'Elche'),
    (5, '87654321B', '600333444', 'Av. Libertad', '25', '03202', 'Elche');

INSERT INTO vehiculo (matricula, id_cliente, marca, modelo, anio) VALUES
    ('1234KLM', 4, 'Seat',    'León',  2019),
    ('5678BCD', 4, 'Renault', 'Clio',  2016),
    ('9012FGH', 5, 'Ford',    'Focus', 2018);

INSERT INTO cita (id_cita, matricula, id_mecanico, fecha_hora, tipo_servicio, motivo, estado, horas, precio_hora) VALUES
    (1, '5678BCD', 3,    '2026-10-22 11:00:00', 'Revisión', 'Cambio de aceite',  'finalizada', 1.00, 45.00),
    (2, '1234KLM', NULL, '2026-10-28 09:30:00', 'Avería',   'Ruido al frenar',   'pendiente',  NULL, NULL),
    (3, '9012FGH', 3,    '2026-10-29 12:00:00', 'Avería',   'Cambio de embrague','confirmada', NULL, NULL);

INSERT INTO cita_pieza (id_cita, referencia, descripcion, unidades, precio) VALUES
    (1, 'ACE-5W30-5L', 'Aceite 5W30 (5 L)', 1, 38.50),
    (1, 'FIL-ACE-01',  'Filtro de aceite',  1,  9.90);

-- Factura de la cita 1: 45,00 (mano de obra) + 48,40 (piezas) = 93,40
INSERT INTO factura (numero, id_cita, fecha, base_imponible, iva_pct, cuota_iva, total) VALUES
    ('2026-0001', 1, '2026-10-22', 93.40, 21.00, 19.61, 113.01);
