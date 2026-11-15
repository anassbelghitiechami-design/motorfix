<?php

require_once __DIR__ . '/Conexion.php';

class Cliente
{
    private $pdo;

    private $id_usuario;   // el mismo id que su fila en usuario
    private $dni;
    private $telefono;
    private $calle;
    private $numero;
    private $cp;
    private $localidad;

    public function __construct($id_usuario = null, $dni = null, $telefono = null, $calle = null, $numero = null, $cp = null, $localidad = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->id_usuario = $id_usuario;
        $this->dni = $dni;
        $this->telefono = $telefono;
        $this->calle = $calle;
        $this->numero = $numero;
        $this->cp = $cp;
        $this->localidad = $localidad;
    }

    // Inserta los datos de cliente de un usuario que ya existe en la tabla usuario
    function insertCliente()
    {
        $sql = "INSERT INTO cliente (id_usuario, dni, telefono, calle, numero, cp, localidad)
                VALUES (:id_usuario, :dni, :telefono, :calle, :numero, :cp, :localidad)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->bindParam(':dni', $this->dni, PDO::PARAM_STR);
        $stmt->bindParam(':telefono', $this->telefono, PDO::PARAM_STR);
        $stmt->bindParam(':calle', $this->calle, PDO::PARAM_STR);
        $stmt->bindParam(':numero', $this->numero, PDO::PARAM_STR);
        $stmt->bindParam(':cp', $this->cp, PDO::PARAM_STR);
        $stmt->bindParam(':localidad', $this->localidad, PDO::PARAM_STR);
        $stmt->execute();
    }

    // Devuelve los datos del cliente junto con su email y nombre, o false si no existe
    function getCliente()
    {
        $sql = "SELECT c.id_usuario, u.email, u.nombre, c.dni, c.telefono, c.calle, c.numero, c.cp, c.localidad
                FROM cliente c
                JOIN usuario u ON u.id_usuario = c.id_usuario
                WHERE c.id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Guarda en la base de datos los datos actuales del objeto
    function updateCliente()
    {
        $sql = "UPDATE cliente
                SET dni = :dni, telefono = :telefono, calle = :calle, numero = :numero, cp = :cp, localidad = :localidad
                WHERE id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':dni', $this->dni, PDO::PARAM_STR);
        $stmt->bindParam(':telefono', $this->telefono, PDO::PARAM_STR);
        $stmt->bindParam(':calle', $this->calle, PDO::PARAM_STR);
        $stmt->bindParam(':numero', $this->numero, PDO::PARAM_STR);
        $stmt->bindParam(':cp', $this->cp, PDO::PARAM_STR);
        $stmt->bindParam(':localidad', $this->localidad, PDO::PARAM_STR);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Borra solo los datos de cliente (para borrarlo del todo se usa deleteUsuario, que borra esta fila en cascada).
    // Si el cliente tiene vehículos, MySQL no deja borrarlo (ON DELETE RESTRICT) y lanza una PDOException
    function deleteCliente()
    {
        $sql = "DELETE FROM cliente WHERE id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
    }
}
