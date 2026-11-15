<?php

require_once __DIR__ . '/Conexion.php';

class Factura
{
    private $pdo;

    private $numero;           // por ejemplo 2026-0001
    private $id_cita;          // una factura por cita
    private $fecha;
    private $base_imponible;
    private $iva_pct;
    private $cuota_iva;
    private $total;

    public function __construct($numero = null, $id_cita = null, $fecha = null, $base_imponible = null, $iva_pct = 21, $cuota_iva = null, $total = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->numero = $numero;
        $this->id_cita = $id_cita;
        $this->fecha = $fecha;
        $this->base_imponible = $base_imponible;
        $this->iva_pct = $iva_pct;
        $this->cuota_iva = $cuota_iva;
        $this->total = $total;
    }

    function insertFactura()
    {
        $sql = "INSERT INTO factura (numero, id_cita, fecha, base_imponible, iva_pct, cuota_iva, total)
                VALUES (:numero, :id_cita, :fecha, :base_imponible, :iva_pct, :cuota_iva, :total)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':numero', $this->numero, PDO::PARAM_STR);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->bindParam(':fecha', $this->fecha, PDO::PARAM_STR);
        $stmt->bindParam(':base_imponible', $this->base_imponible, PDO::PARAM_STR);
        $stmt->bindParam(':iva_pct', $this->iva_pct, PDO::PARAM_STR);
        $stmt->bindParam(':cuota_iva', $this->cuota_iva, PDO::PARAM_STR);
        $stmt->bindParam(':total', $this->total, PDO::PARAM_STR);
        $stmt->execute();
    }

    // Devuelve los datos de la factura o false si no existe
    function getFactura()
    {
        $sql = "SELECT numero, id_cita, fecha, base_imponible, iva_pct, cuota_iva, total FROM factura WHERE numero = :numero";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':numero', $this->numero, PDO::PARAM_STR);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Guarda en la base de datos los datos actuales del objeto
    function updateFactura()
    {
        $sql = "UPDATE factura
                SET id_cita = :id_cita, fecha = :fecha, base_imponible = :base_imponible,
                    iva_pct = :iva_pct, cuota_iva = :cuota_iva, total = :total
                WHERE numero = :numero";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->bindParam(':fecha', $this->fecha, PDO::PARAM_STR);
        $stmt->bindParam(':base_imponible', $this->base_imponible, PDO::PARAM_STR);
        $stmt->bindParam(':iva_pct', $this->iva_pct, PDO::PARAM_STR);
        $stmt->bindParam(':cuota_iva', $this->cuota_iva, PDO::PARAM_STR);
        $stmt->bindParam(':total', $this->total, PDO::PARAM_STR);
        $stmt->bindParam(':numero', $this->numero, PDO::PARAM_STR);
        $stmt->execute();
    }

    function deleteFactura()
    {
        $sql = "DELETE FROM factura WHERE numero = :numero";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':numero', $this->numero, PDO::PARAM_STR);
        $stmt->execute();
    }
}