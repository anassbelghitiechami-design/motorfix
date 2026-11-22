<?php
require_once __DIR__ . '/../model/Cliente.php';
require_once __DIR__ . '/../model/Vehiculo.php';
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/control_acceso.php';

//Solo la oficina usa este sw (control_acceso.php ya hace el session_start)
comprobarAcceso(["oficina"]);

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
    case "listarCitas":
        $cita = new Cita();
        $data = $cita->getCitas();
        $msg = "Citas obtenidas correctamente";
        break;

    case "listarMecanicos":
        $usuario = new Usuario();
        $data = $usuario->getMecanicos();
        $msg = "Mecanicos obtenidos correctamente";
        break;

    case "validarCita":
        $id_cita = $request["data"]["id_cita"];
        $id_mecanico = $request["data"]["id_mecanico"];

        if ($id_mecanico == "") {
            $success = false;
            $msg = "Elige el mecanico que hara la reparacion";
            break;
        }

        $cita = new Cita($id_cita);
        $obtenido = $cita->getCita();

        //solo se pueden validar las citas que estan pendientes
        if (!$obtenido || $obtenido["estado"] != "pendiente") {
            $success = false;
            $msg = "Solo se pueden validar las citas pendientes";
            break;
        }

        //creamos la cita con los mismos datos pero confirmada y con el mecanico, y la guardamos
        $cita = new Cita($obtenido["id_cita"], $obtenido["matricula"], $obtenido["fecha_hora"], $obtenido["tipo_servicio"],
            $obtenido["motivo"], "confirmada", $id_mecanico, $obtenido["horas"], $obtenido["precio_hora"]);

        try {
            $cita->updateCita();
            $msg = "Cita confirmada y asignada al mecanico";
        } catch (PDOException $e) {
            //si el id_mecanico no es de un mecanico falla la clave foranea
            error_log("Error al validar cita: " . $e->getMessage());
            $success = false;
            $msg = "Error al validar la cita";
        }
        break;

    case "rechazarCita":
        $cita = new Cita($request["data"]["id_cita"]);
        $obtenido = $cita->getCita();

        if (!$obtenido || $obtenido["estado"] != "pendiente") {
            $success = false;
            $msg = "Solo se pueden rechazar las citas pendientes";
            break;
        }

        $cita = new Cita($obtenido["id_cita"], $obtenido["matricula"], $obtenido["fecha_hora"], $obtenido["tipo_servicio"],
            $obtenido["motivo"], "rechazada", null, $obtenido["horas"], $obtenido["precio_hora"]);
        $cita->updateCita();
        $msg = "Cita rechazada";
        break;

    case "listarClientes":
        $cliente = new Cliente();
        $data = $cliente->getClientes();
        $msg = "Clientes obtenidos correctamente";
        break;

    case "listarVehiculos":
        $vehiculo = new Vehiculo();
        $data = $vehiculo->getVehiculos();
        $msg = "Vehiculos obtenidos correctamente";
        break;

    case "insertarVehiculo":
        $coche["id_cliente"]= $request["data"]["id_cliente"];
        $coche["matricula"]= strtoupper(str_replace(" ", "", $request["data"]["matricula"])); //sin espacios y en mayusculas, como 1234ABC
        $coche["marca"]= trim($request["data"]["marca"]);
        $coche["modelo"]= trim($request["data"]["modelo"]);
        $coche["anio"]= $request["data"]["anio"];

        //el año es opcional, si viene vacio se guarda null
        if ($coche["anio"] == "") {
            $coche["anio"] = null;
        }

        if ($coche["id_cliente"] == "" || $coche["matricula"] == "" || $coche["marca"] == "" || $coche["modelo"] == "") {
            $success = false;
            $msg = "El cliente, la matricula, la marca y el modelo son obligatorios";
            break;
        }

        //comprobamos que el cliente existe
        $cliente = new Cliente($coche["id_cliente"]);
        if (!$cliente->getCliente()) {
            $success = false;
            $msg = "Ese cliente no existe";
            break;
        }

        $vehiculo = new Vehiculo($coche["matricula"], $coche["id_cliente"], $coche["marca"], $coche["modelo"], $coche["anio"]);

        try {
            $vehiculo->insertVehiculo();
            $data = $coche;
            $msg = "Vehiculo añadido correctamente";
        } catch (PDOException $e) {
            error_log("Error al insertar vehiculo: " . $e->getMessage());
            $success = false;
            $msg = "Error al añadir el vehiculo (puede que la matricula ya exista)";
        }
        break;

    case "borrarVehiculo":
        $vehiculo = new Vehiculo($request["data"]["matricula"]);

        try {
            $vehiculo->deleteVehiculo();
            $msg = "Vehiculo borrado correctamente";
        } catch (PDOException $e) {
            //si el vehiculo tiene citas, MySQL no deja borrarlo (ON DELETE RESTRICT)
            error_log("Error al borrar vehiculo: " . $e->getMessage());
            $success = false;
            $msg = "No se puede borrar un vehiculo que tiene citas";
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
