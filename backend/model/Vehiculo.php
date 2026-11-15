<?php

require_once __DIR__ . '/Conexion.php';

class Vehiculo
{
    private $pdo;

    private $matricula;
    private $id_cliente;
    private $marca;
    private $modelo;
    private $anio;

    public function __construct($matricula = null, $id_cliente = null, $marca = null, $modelo = null, $anio = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->matricula = $matricula;
        $this->id_cliente = $id_cliente;
        $this->marca = $marca;
        $this->modelo = $modelo;
        $this->anio = $anio;
    }

    function insertVehiculo()
    {
        $sql = "INSERT INTO vehiculo (matricula, id_cliente, marca, modelo, anio)
                VALUES (:matricula, :id_cliente, :marca, :modelo, :anio)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->bindParam(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->bindParam(':marca', $this->marca, PDO::PARAM_STR);
        $stmt->bindParam(':modelo', $this->modelo, PDO::PARAM_STR);
        $stmt->bindParam(':anio', $this->anio, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Devuelve los datos del vehículo o false si no existe
    function getVehiculo()
    {
        $sql = "SELECT matricula, id_cliente, marca, modelo, anio FROM vehiculo WHERE matricula = :matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Devuelve todos los vehículos del cliente del objeto (array vacío si no tiene)
    function getVehiculosCliente()
    {
        $sql = "SELECT matricula, id_cliente, marca, modelo, anio FROM vehiculo WHERE id_cliente = :id_cliente ORDER BY matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    function updateVehiculo()
    {
        $sql = "UPDATE vehiculo SET id_cliente = :id_cliente, marca = :marca, modelo = :modelo, anio = :anio
                WHERE matricula = :matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->bindParam(':marca', $this->marca, PDO::PARAM_STR);
        $stmt->bindParam(':modelo', $this->modelo, PDO::PARAM_STR);
        $stmt->bindParam(':anio', $this->anio, PDO::PARAM_INT);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->execute();
    }

    function deleteVehiculo()
    {
        $sql = "DELETE FROM vehiculo WHERE matricula = :matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->execute();
    }
}
