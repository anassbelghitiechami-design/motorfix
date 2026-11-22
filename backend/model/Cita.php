<?php

require_once __DIR__ . '/Conexion.php';

class Cita
{
    private $pdo;

    private $id_cita;
    private $matricula;
    private $id_mecanico;    // null hasta que la oficina asigna un mecánico
    private $fecha_hora;
    private $tipo_servicio;
    private $motivo;
    private $estado;         // pendiente, confirmada, rechazada, en_curso o finalizada
    private $horas;          // mano de obra: horas trabajadas
    private $precio_hora;    // mano de obra: precio por hora

    public function __construct($id_cita = null, $matricula = null, $fecha_hora = null, $tipo_servicio = null, $motivo = null, $estado = 'pendiente', $id_mecanico = null, $horas = null, $precio_hora = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->id_cita = $id_cita;
        $this->matricula = $matricula;
        $this->fecha_hora = $fecha_hora;
        $this->tipo_servicio = $tipo_servicio;
        $this->motivo = $motivo;
        $this->estado = $estado;
        $this->id_mecanico = $id_mecanico;
        $this->horas = $horas;
        $this->precio_hora = $precio_hora;
    }

    function getIdCita()
    {
        return $this->id_cita;
    }

    // Inserta la cita y guarda en el objeto el id generado
    function insertCita()
    {
        $sql = "INSERT INTO cita (matricula, fecha_hora, tipo_servicio, motivo, estado)
                VALUES (:matricula, :fecha_hora, :tipo_servicio, :motivo, :estado)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->bindParam(':fecha_hora', $this->fecha_hora, PDO::PARAM_STR);
        $stmt->bindParam(':tipo_servicio', $this->tipo_servicio, PDO::PARAM_STR);
        $stmt->bindParam(':motivo', $this->motivo, PDO::PARAM_STR);
        $stmt->bindParam(':estado', $this->estado, PDO::PARAM_STR);
        $stmt->execute();

        $this->id_cita = (int) $this->pdo->lastInsertId();
    }

    // Devuelve los datos de la cita o false si no existe
    function getCita()
    {
        $sql = "SELECT id_cita, matricula, id_mecanico, fecha_hora, tipo_servicio, motivo, estado, horas, precio_hora
                FROM cita WHERE id_cita = :id_cita";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Devuelve todas las citas de los vehiculos de un cliente, con la marca y el modelo (array vacío si no tiene)
    // La cita no guarda el cliente, por eso se une con vehiculo para saber de quién es
    function getCitasCliente($id_cliente)
    {
        $sql = "SELECT c.id_cita, c.matricula, v.marca, v.modelo, c.fecha_hora, c.tipo_servicio, c.motivo, c.estado
                FROM cita c
                JOIN vehiculo v ON v.matricula = c.matricula
                WHERE v.id_cliente = :id_cliente
                ORDER BY c.fecha_hora DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cliente', $id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Devuelve todas las citas del taller con el vehículo, el cliente y el mecánico (para la oficina)
    // El mecánico puede ser null, por eso se une con LEFT JOIN
    function getCitas()
    {
        $sql = "SELECT c.id_cita, c.matricula, v.marca, v.modelo, cli.nombre AS cliente,
                       c.id_mecanico, mec.nombre AS mecanico, c.fecha_hora, c.tipo_servicio, c.motivo, c.estado,
                       f.numero AS factura, f.total
                FROM cita c
                JOIN vehiculo v ON v.matricula = c.matricula
                JOIN usuario cli ON cli.id_usuario = v.id_cliente
                LEFT JOIN usuario mec ON mec.id_usuario = c.id_mecanico
                LEFT JOIN factura f ON f.id_cita = c.id_cita
                ORDER BY c.fecha_hora DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Devuelve la hoja de trabajo de un mecánico: las citas que tiene asignadas, con el vehículo y el cliente
    function getCitasMecanico($id_mecanico)
    {
        $sql = "SELECT c.id_cita, c.matricula, v.marca, v.modelo, cli.nombre AS cliente,
                       c.fecha_hora, c.tipo_servicio, c.motivo, c.estado, c.horas, c.precio_hora
                FROM cita c
                JOIN vehiculo v ON v.matricula = c.matricula
                JOIN usuario cli ON cli.id_usuario = v.id_cliente
                WHERE c.id_mecanico = :id_mecanico
                ORDER BY c.fecha_hora";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_mecanico', $id_mecanico, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Guarda en la base de datos los datos actuales del objeto
    function updateCita()
    {
        $sql = "UPDATE cita
                SET matricula = :matricula, id_mecanico = :id_mecanico, fecha_hora = :fecha_hora,
                    tipo_servicio = :tipo_servicio, motivo = :motivo, estado = :estado,
                    horas = :horas, precio_hora = :precio_hora
                WHERE id_cita = :id_cita";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->bindParam(':id_mecanico', $this->id_mecanico, PDO::PARAM_INT);
        $stmt->bindParam(':fecha_hora', $this->fecha_hora, PDO::PARAM_STR);
        $stmt->bindParam(':tipo_servicio', $this->tipo_servicio, PDO::PARAM_STR);
        $stmt->bindParam(':motivo', $this->motivo, PDO::PARAM_STR);
        $stmt->bindParam(':estado', $this->estado, PDO::PARAM_STR);
        $stmt->bindParam(':horas', $this->horas, PDO::PARAM_STR);
        $stmt->bindParam(':precio_hora', $this->precio_hora, PDO::PARAM_STR);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Borra la cita (sus piezas se borran en cascada).
    // Si la cita ya tiene factura, MySQL no deja borrarla y lanza una PDOException
    function deleteCita()
    {
        $sql = "DELETE FROM cita WHERE id_cita = :id_cita";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->execute();
    }
}