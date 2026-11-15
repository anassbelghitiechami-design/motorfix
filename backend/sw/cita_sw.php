<?php
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/../model/Vehiculo.php';
require_once __DIR__ . '/control_acceso.php';

//De momento solo el cliente usa este sw (oficina y mecanico lo usaran en la semana 5)
comprobarAcceso(["cliente"]);

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

//el cliente siempre es el que ha hecho login
$id_cliente = $_SESSION["id_usuario"];

switch ($request["action"]){
    case "listar":
        $cita = new Cita();
        $data = $cita->getCitasCliente($id_cliente);
        $msg = "Citas obtenidas correctamente";
        break;

    case "solicitar":
        $nueva["matricula"]= $request["data"]["matricula"];
        $nueva["fecha"]= $request["data"]["fecha"];
        $nueva["hora"]= $request["data"]["hora"];
        $nueva["tipo_servicio"]= $request["data"]["tipo_servicio"];
        $nueva["motivo"]= trim($request["data"]["motivo"]);

        if ($nueva["matricula"] == "" || $nueva["fecha"] == "" || $nueva["hora"] == "") {
            $success = false;
            $msg = "Elige el vehiculo, la fecha y la hora";
            break;
        }

        //la fecha y la hora se juntan en un DATETIME: 2026-11-20 09:30:00
        $nueva["fecha_hora"] = $nueva["fecha"] . " " . $nueva["hora"] . ":00";

        //strtotime pasa la fecha a segundos para poder compararla con la hora actual (time())
        if (strtotime($nueva["fecha_hora"]) < time()) {
            $success = false;
            $msg = "La cita tiene que ser para una fecha y hora futuras";
            break;
        }

        //comprobamos que el vehiculo es del cliente que pide la cita
        $vehiculo = new Vehiculo($nueva["matricula"]);
        $obtenido = $vehiculo->getVehiculo();

        if (!$obtenido || $obtenido["id_cliente"] != $id_cliente) {
            $success = false;
            $msg = "Ese vehiculo no existe o no es tuyo";
            break;
        }

        //la cita empieza en estado pendiente hasta que la oficina la valide
        $cita = new Cita(null, $nueva["matricula"], $nueva["fecha_hora"], $nueva["tipo_servicio"], $nueva["motivo"]);

        try {
            $cita->insertCita();
            $nueva["id_cita"] = $cita->getIdCita();
            $nueva["estado"] = "pendiente";
            $data = $nueva;
            $msg = "Cita solicitada correctamente. La oficina la revisará pronto";
        } catch (PDOException $e) {
            error_log("Error al solicitar cita: " . $e->getMessage());
            $success = false;
            $msg = "Error al solicitar la cita";
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
