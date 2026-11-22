<?php
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/../model/CitaPieza.php';
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

    case "guardarManoObra":
        $horas = $request["data"]["horas"];
        $precio_hora = $request["data"]["precio_hora"];
        $obtenido = citaDelMecanico($request["data"]["id_cita"], $id_mecanico);

        if (!$obtenido || $obtenido["estado"] != "en_curso") {
            $success = false;
            $msg = "Solo se pueden imputar horas a una reparacion que esta en el taller";
            break;
        }

        //is_numeric comprueba que el texto es un numero (en la BD quitamos los CHECK, por eso se valida aqui)
        if (!is_numeric($horas) || !is_numeric($precio_hora) || $horas < 0 || $precio_hora < 0) {
            $success = false;
            $msg = "Las horas y el precio por hora tienen que ser numeros positivos";
            break;
        }

        $cita = new Cita($obtenido["id_cita"], $obtenido["matricula"], $obtenido["fecha_hora"], $obtenido["tipo_servicio"],
            $obtenido["motivo"], $obtenido["estado"], $obtenido["id_mecanico"], $horas, $precio_hora);
        $cita->updateCita();
        $msg = "Mano de obra guardada";
        break;

    case "listarPiezas":
        $obtenido = citaDelMecanico($request["data"]["id_cita"], $id_mecanico);

        if (!$obtenido) {
            $success = false;
            $msg = "Esa reparacion no existe o no es tuya";
            break;
        }

        $pieza = new CitaPieza(null, $obtenido["id_cita"]);
        $data = $pieza->getPiezasCita();
        $msg = "Piezas obtenidas correctamente";
        break;

    case "anadirPieza":
        $nueva["id_cita"]= $request["data"]["id_cita"];
        $nueva["referencia"]= strtoupper(trim($request["data"]["referencia"]));
        $nueva["descripcion"]= trim($request["data"]["descripcion"]);
        $nueva["unidades"]= $request["data"]["unidades"];
        $nueva["precio"]= $request["data"]["precio"];

        $obtenido = citaDelMecanico($nueva["id_cita"], $id_mecanico);
        if (!$obtenido || $obtenido["estado"] != "en_curso") {
            $success = false;
            $msg = "Solo se pueden añadir piezas a una reparacion que esta en el taller";
            break;
        }

        if ($nueva["referencia"] == "" || $nueva["descripcion"] == "") {
            $success = false;
            $msg = "La referencia y la descripcion son obligatorias";
            break;
        }

        //las unidades tienen que ser un numero entero mayor que 0 y el precio un numero positivo
        if (!ctype_digit((string) $nueva["unidades"]) || $nueva["unidades"] < 1 || !is_numeric($nueva["precio"]) || $nueva["precio"] < 0) {
            $success = false;
            $msg = "Las unidades tienen que ser 1 o mas y el precio un numero positivo";
            break;
        }

        $pieza = new CitaPieza(null, $nueva["id_cita"], $nueva["referencia"], $nueva["descripcion"], $nueva["unidades"], $nueva["precio"]);

        try {
            $pieza->insertCitaPieza();
            $data = $nueva;
            $msg = "Pieza añadida";
        } catch (PDOException $e) {
            //(id_cita, referencia) es UNIQUE: la misma pieza no se puede repetir en una cita
            error_log("Error al añadir pieza: " . $e->getMessage());
            $success = false;
            $msg = "Esa referencia ya esta en la reparacion. Quitala y añadela con las unidades correctas";
        }
        break;

    case "quitarPieza":
        $pieza = new CitaPieza($request["data"]["id_cita_pieza"]);
        $obtenida = $pieza->getCitaPieza();

        //la pieza tiene que existir y ser de una reparacion de este mecanico que este en el taller
        $obtenido = $obtenida ? citaDelMecanico($obtenida["id_cita"], $id_mecanico) : false;
        if (!$obtenido || $obtenido["estado"] != "en_curso") {
            $success = false;
            $msg = "No se puede quitar esa pieza";
            break;
        }

        $pieza->deleteCitaPieza();
        $msg = "Pieza quitada";
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
