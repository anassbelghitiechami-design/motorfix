<?php
require_once __DIR__ . '/../model/Vehiculo.php';
require_once __DIR__ . '/control_acceso.php';

//Solo los clientes pueden gestionar sus vehiculos (control_acceso.php ya hace el session_start)
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

//el cliente siempre es el que ha hecho login, no se coge del JSON para que nadie toque coches de otro
$id_cliente = $_SESSION["id_usuario"];

switch ($request["action"]){
    case "listar":
        $vehiculo = new Vehiculo(null, $id_cliente);
        $data = $vehiculo->getVehiculosCliente();
        $msg = "Vehiculos obtenidos correctamente";
        break;

    case "insertar":
        $coche["matricula"]= strtoupper(str_replace(" ", "", $request["data"]["matricula"])); //sin espacios y en mayusculas, como 1234ABC
        $coche["marca"]= trim($request["data"]["marca"]);
        $coche["modelo"]= trim($request["data"]["modelo"]);
        $coche["anio"]= $request["data"]["anio"];

        //el año es opcional, si viene vacio se guarda null
        if ($coche["anio"] == "") {
            $coche["anio"] = null;
        }

        if ($coche["matricula"] == "" || $coche["marca"] == "" || $coche["modelo"] == "") {
            $success = false;
            $msg = "La matricula, la marca y el modelo son obligatorios";
            break;
        }

        $vehiculo = new Vehiculo($coche["matricula"], $id_cliente, $coche["marca"], $coche["modelo"], $coche["anio"]);

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

    case "editar":
        $coche["matricula"]= $request["data"]["matricula"];
        $coche["marca"]= trim($request["data"]["marca"]);
        $coche["modelo"]= trim($request["data"]["modelo"]);
        $coche["anio"]= $request["data"]["anio"];

        if ($coche["anio"] == "") {
            $coche["anio"] = null;
        }

        if ($coche["marca"] == "" || $coche["modelo"] == "") {
            $success = false;
            $msg = "La marca y el modelo son obligatorios";
            break;
        }

        //comprobamos que el vehiculo existe y que es de este cliente
        $vehiculo = new Vehiculo($coche["matricula"]);
        $obtenido = $vehiculo->getVehiculo();

        if (!$obtenido || $obtenido["id_cliente"] != $id_cliente) {
            $success = false;
            $msg = "Ese vehiculo no existe o no es tuyo";
            break;
        }

        $vehiculo = new Vehiculo($coche["matricula"], $id_cliente, $coche["marca"], $coche["modelo"], $coche["anio"]);
        $vehiculo->updateVehiculo();
        $data = $coche;
        $msg = "Vehiculo modificado correctamente";
        break;

    case "borrar":
        $matricula = $request["data"]["matricula"];

        $vehiculo = new Vehiculo($matricula);
        $obtenido = $vehiculo->getVehiculo();

        if (!$obtenido || $obtenido["id_cliente"] != $id_cliente) {
            $success = false;
            $msg = "Ese vehiculo no existe o no es tuyo";
            break;
        }

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
