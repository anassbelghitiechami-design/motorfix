<?php
require_once __DIR__ . '/../model/Factura.php';
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/control_acceso.php';

//La oficina genera las facturas y el cliente consulta las suyas (control_acceso.php ya hace el session_start)
comprobarAcceso(["oficina", "cliente"]);

//Indicar que es una respuesta JSON, es decir, para que la web reconozca el archivo como un JSON
header("Content-Type: application/json; charset=UTF-8");

// Obtener el contenido del cuerpo de la petición
$contenidoJSON = file_get_contents('php://input');

// Decodificar el JSON a un array asociativo (true)
$request = json_decode($contenidoJSON, true);

//todo lo de arriba para recoger valores

$success = true;
$msg = "";
$data = [];

switch ($request["action"]){
    case "listarCliente":
        //cada cliente solo ve sus facturas: el id sale de la sesion, no del JSON
        comprobarAcceso(["cliente"]);

        $factura = new Factura();
        $data = $factura->getFacturasCliente($_SESSION["id_usuario"]);
        $msg = "Facturas obtenidas correctamente";
        break;

    case "generar":
        //generar facturas es solo cosa de la oficina
        comprobarAcceso(["oficina"]);

        $id_cita = $request["data"]["id_cita"];

        //solo se factura una reparacion que el mecanico ha terminado
        $cita = new Cita($id_cita);
        $obtenida = $cita->getCita();

        if (!$obtenida || $obtenida["estado"] != "finalizada") {
            $success = false;
            $msg = "Solo se pueden facturar las reparaciones finalizadas";
            break;
        }

        $factura = new Factura(null, $id_cita, date("Y-m-d"));
        $importes = $factura->calcularImportes();
        $factura->siguienteNumero();

        try {
            $factura->insertFactura();
            $data = $factura->getFactura();
            $data["mano_obra"] = $importes["mano_obra"];
            $data["piezas"] = $importes["piezas"];
            $msg = "Factura " . $data["numero"] . " generada: " . number_format($data["total"], 2, ",", ".") . " €";
        } catch (PDOException $e) {
            //id_cita es UNIQUE en factura: una cita solo se puede facturar una vez
            error_log("Error al generar factura: " . $e->getMessage());
            $success = false;
            $msg = "Esa reparacion ya tiene factura";
        }
        break;

    default:
        $success = false;
        $msg = "Accion no soportada";
}

$arrSalida = [
    "success" => $success,
    "data" => $data,
    "msg" => $msg
];

echo json_encode($arrSalida); //json_encode convierte un array a JSON, y al poner echo escribimos el array por completo en JSON.
