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
    private $combustible;  // gasolina, diesel, hibrido, hibrido_enchufable, electrico o glp (ENUM de la tabla)
    private $cambio;       // manual o automatico (ENUM de la tabla)
    private $kilometros;
    private $bastidor;     // número de bastidor (VIN), 17 caracteres

    public function __construct($matricula = null, $id_cliente = null, $marca = null, $modelo = null, $anio = null,
                                $combustible = null, $cambio = null, $kilometros = null, $bastidor = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->matricula = $matricula;
        $this->id_cliente = $id_cliente;
        $this->marca = $marca;
        $this->modelo = $modelo;
        $this->anio = $anio;
        $this->combustible = $combustible;
        $this->cambio = $cambio;
        $this->kilometros = $kilometros;
        $this->bastidor = $bastidor;
    }

    function insertVehiculo()
    {
        $sql = "INSERT INTO vehiculo (matricula, id_cliente, marca, modelo, anio, combustible, cambio, kilometros, bastidor)
                VALUES (:matricula, :id_cliente, :marca, :modelo, :anio, :combustible, :cambio, :kilometros, :bastidor)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->bindParam(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->bindParam(':marca', $this->marca, PDO::PARAM_STR);
        $stmt->bindParam(':modelo', $this->modelo, PDO::PARAM_STR);
        $stmt->bindParam(':anio', $this->anio, PDO::PARAM_INT);
        $stmt->bindParam(':combustible', $this->combustible, PDO::PARAM_STR);
        $stmt->bindParam(':cambio', $this->cambio, PDO::PARAM_STR);
        $stmt->bindParam(':kilometros', $this->kilometros, PDO::PARAM_INT);
        $stmt->bindParam(':bastidor', $this->bastidor, PDO::PARAM_STR);
        $stmt->execute();
    }

    // Devuelve los datos del vehículo o false si no existe
    function getVehiculo()
    {
        $sql = "SELECT matricula, id_cliente, marca, modelo, anio, combustible, cambio, kilometros, bastidor
                FROM vehiculo WHERE matricula = :matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':matricula', $this->matricula, PDO::PARAM_STR);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Devuelve todos los vehículos del cliente del objeto (array vacío si no tiene)
    function getVehiculosCliente()
    {
        $sql = "SELECT matricula, id_cliente, marca, modelo, anio, combustible, cambio, kilometros, bastidor
                FROM vehiculo WHERE id_cliente = :id_cliente ORDER BY matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    function updateVehiculo()
    {
        $sql = "UPDATE vehiculo
                SET id_cliente = :id_cliente, marca = :marca, modelo = :modelo, anio = :anio,
                    combustible = :combustible, cambio = :cambio, kilometros = :kilometros, bastidor = :bastidor
                WHERE matricula = :matricula";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cliente', $this->id_cliente, PDO::PARAM_INT);
        $stmt->bindParam(':marca', $this->marca, PDO::PARAM_STR);
        $stmt->bindParam(':modelo', $this->modelo, PDO::PARAM_STR);
        $stmt->bindParam(':anio', $this->anio, PDO::PARAM_INT);
        $stmt->bindParam(':combustible', $this->combustible, PDO::PARAM_STR);
        $stmt->bindParam(':cambio', $this->cambio, PDO::PARAM_STR);
        $stmt->bindParam(':kilometros', $this->kilometros, PDO::PARAM_INT);
        $stmt->bindParam(':bastidor', $this->bastidor, PDO::PARAM_STR);
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
