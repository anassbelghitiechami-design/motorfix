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

    // Calcula los importes de la factura de la cita del objeto y los guarda en el objeto:
    //   subtotal (base imponible) = mano de obra (horas x precio_hora) + piezas (unidades x precio de cada una)
    //   cuota de IVA = base imponible x 21 / 100
    //   total = base imponible + cuota de IVA
    // El 21% es el tipo general del IVA en España (visto en wikipedia: "Impuesto sobre el valor añadido (España)").
    // Tambien de wikipedia: la cuota se redondea a 2 decimales (centimos), por eso se usa round(..., 2).
    // Devuelve un array con mano_obra, piezas, base_imponible, iva_pct, cuota_iva y total, o false si la cita no existe
    function calcularImportes()
    {
        // LEFT JOIN porque una reparacion puede no llevar piezas; COALESCE pone 0 si la suma da NULL
        $sql = "SELECT c.horas * c.precio_hora AS mano_obra,
                       COALESCE(SUM(p.unidades * p.precio), 0) AS piezas
                FROM cita c
                LEFT JOIN cita_pieza p ON p.id_cita = c.id_cita
                WHERE c.id_cita = :id_cita
                GROUP BY c.id_cita, c.horas, c.precio_hora";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$fila) {
            return false;
        }

        $manoObra = round((float) $fila["mano_obra"], 2);
        $piezas = round((float) $fila["piezas"], 2);

        $this->base_imponible = round($manoObra + $piezas, 2);
        $this->cuota_iva = round($this->base_imponible * $this->iva_pct / 100, 2);
        $this->total = round($this->base_imponible + $this->cuota_iva, 2);

        return [
            "mano_obra" => $manoObra,
            "piezas" => $piezas,
            "base_imponible" => $this->base_imponible,
            "iva_pct" => $this->iva_pct,
            "cuota_iva" => $this->cuota_iva,
            "total" => $this->total
        ];
    }

    // Pone en el objeto el siguiente numero de factura del año: 2026-0001, 2026-0002...
    // Las facturas tienen que ir numeradas seguidas dentro de cada año (visto en wikipedia: "Factura")
    function siguienteNumero()
    {
        $anio = date("Y");
        $patron = $anio . "-%";

        $sql = "SELECT MAX(numero) AS ultimo FROM factura WHERE numero LIKE :patron";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':patron', $patron, PDO::PARAM_STR);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        $siguiente = 1;
        if ($fila["ultimo"] != null) {
            // "2026-0007" -> nos quedamos con "0007" -> 7 -> 8
            $siguiente = (int) substr($fila["ultimo"], 5) + 1;
        }

        // sprintf con %04d rellena con ceros a la izquierda hasta 4 cifras: 8 -> 0008
        $this->numero = $anio . "-" . sprintf("%04d", $siguiente);
        return $this->numero;
    }

    // Devuelve las facturas de un cliente con el vehículo y el servicio (la factura no guarda el cliente,
    // por eso se une con cita y vehiculo para saber de quién es)
    function getFacturasCliente($id_cliente)
    {
        $sql = "SELECT f.numero, f.fecha, f.base_imponible, f.iva_pct, f.cuota_iva, f.total,
                       c.tipo_servicio, v.matricula, v.marca, v.modelo
                FROM factura f
                JOIN cita c ON c.id_cita = f.id_cita
                JOIN vehiculo v ON v.matricula = c.matricula
                WHERE v.id_cliente = :id_cliente
                ORDER BY f.numero DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cliente', $id_cliente, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Resumen de la facturacion del taller (para las métricas del admin):
    // cuántas facturas hay, la suma de las bases, del IVA y de los totales
    // COALESCE pone 0 cuando todavia no hay ninguna factura (SUM daria NULL)
    function getResumen()
    {
        $sql = "SELECT COUNT(*) AS num_facturas,
                       COALESCE(SUM(base_imponible), 0) AS base_imponible,
                       COALESCE(SUM(cuota_iva), 0) AS cuota_iva,
                       COALESCE(SUM(total), 0) AS total
                FROM factura";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
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