<?php
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/control_acceso.php';

//Solo los mecanicos usan este sw (control_acceso.php ya hace el session_start)
comprobarAcceso(["mecanico"]);

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

//el mecanico siempre es el que ha hecho login
$id_mecanico = $_SESSION["id_usuario"];

switch ($request["action"]){
    case "listar":
        $cita = new Cita();
        $data = $cita->getCitasMecanico($id_mecanico);
        $msg = "Hoja de trabajo obtenida correctamente";
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
