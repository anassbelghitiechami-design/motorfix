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


//devuelve los datos de la cita si existe y esta asignada a este mecanico, y si no false
//(asi un mecanico no puede tocar las reparaciones de otro)
function citaDelMecanico($id_cita, $id_mecanico)
{
    $cita = new Cita($id_cita);
    $obtenido = $cita->getCita();

    if (!$obtenido || $obtenido["id_mecanico"] != $id_mecanico) {
        return false;
    }
    return $obtenido;
}


switch ($request["action"]){
    case "listar":
        $cita = new Cita();
        $data = $cita->getCitasMecanico($id_mecanico);
        $msg = "Hoja de trabajo obtenida correctamente";
        break;

    case "cambiarEstado":
        $nuevoEstado = $request["data"]["estado"];
        $obtenido = citaDelMecanico($request["data"]["id_cita"], $id_mecanico);

        if (!$obtenido) {
            $success = false;
            $msg = "Esa reparacion no existe o no es tuya";
            break;
        }

        //el mecanico solo puede ir hacia delante: confirmada -> en_curso -> finalizada
        if ($obtenido["estado"] == "confirmada" && $nuevoEstado == "en_curso") {
            $msg = "Reparacion empezada";
        } else if ($obtenido["estado"] == "en_curso" && $nuevoEstado == "finalizada") {
            //para poder facturar hace falta saber cuanto se ha trabajado
            if ($obtenido["horas"] === null || $obtenido["precio_hora"] === null) {
                $success = false;
                $msg = "Antes de terminar guarda las horas trabajadas y el precio por hora";
                break;
            }
            $msg = "Reparacion terminada. La oficina ya puede hacer la factura";
        } else {
            $success = false;
            $msg = "No se puede pasar de " . $obtenido["estado"] . " a " . $nuevoEstado;
            break;
        }

        $cita = new Cita($obtenido["id_cita"], $obtenido["matricula"], $obtenido["fecha_hora"], $obtenido["tipo_servicio"],
            $obtenido["motivo"], $nuevoEstado, $obtenido["id_mecanico"], $obtenido["horas"], $obtenido["precio_hora"]);
        $cita->updateCita();
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
