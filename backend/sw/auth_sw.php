<?php
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/../model/Cliente.php';

//Iniciamos la sesion para poder guardar en $_SESSION quien ha hecho login
session_start();

//Indicar que es una respuesta JSON, es decir, para que la web reconozca el archivo como un JSON
header("Content-Type: application/json; charset=UTF-8");

// Obtener el contenido del cuerpo de la petición
$contenidoJSON = file_get_contents('php://input');

// Decodificar el JSON a un array asociativo (true)
// Usa true como seguno parametro para obtener un array asociativo en lugar de un objeto
$request = json_decode($contenidoJSON, true);

//todo lo de arriba para recoger valores

$success = true;
$msg = "";
$data = [];

switch ($request["action"]){
    case "login":
        $email = $request["data"]["email"];
        $password = $request["data"]["password"];

        $usuario = new Usuario($email);
        $obtenido = $usuario->loginUsuario($password);

        if ($obtenido) {
            //guardamos en la sesion los datos del usuario que ha entrado
            $_SESSION["id_usuario"] = $obtenido["id_usuario"];
            $_SESSION["nombre"] = $obtenido["nombre"];
            $_SESSION["rol"] = $obtenido["rol"];

            $data = $obtenido;
            $msg = "Usuario logueado correctamente";
        } else {
            $success = false;
            $msg = "Email o contraseña incorrectos";
        }
        break;

    case "registro":
        $cliente["email"]= $request["data"]["email"];
        $cliente["password"]= $request["data"]["password"];
        $cliente["nombre"]= $request["data"]["nombre"];
        $cliente["dni"]= $request["data"]["dni"];
        $cliente["telefono"]= $request["data"]["telefono"];
        $cliente["calle"]= $request["data"]["calle"];
        $cliente["numero"]= $request["data"]["numero"];
        $cliente["cp"]= $request["data"]["cp"];
        $cliente["localidad"]= $request["data"]["localidad"];

        //primero se crea el usuario con rol cliente y luego sus datos de cliente con el mismo id
        $usuario = new Usuario($cliente["email"], $cliente["password"], $cliente["nombre"], "cliente");

        try {
            $usuario->insertUsuario();

            $nuevoCliente = new Cliente(
                $usuario->getIdUsuario(),
                $cliente["dni"],
                $cliente["telefono"],
                $cliente["calle"],
                $cliente["numero"],
                $cliente["cp"],
                $cliente["localidad"]
            );
            $nuevoCliente->insertCliente();

            unset($cliente["password"]); //la contraseña no se devuelve
            $data = $cliente;
            $msg = "Cliente registrado correctamente";
        } catch (PDOException $e) {
            //si el usuario se llego a crear pero el cliente no, lo borramos para no dejarlo a medias
            if ($usuario->getIdUsuario()) {
                $usuario->deleteUsuario();
            }
            error_log("Error al registrar cliente: " . $e->getMessage());
            $success = false;
            $msg = "Error al registrar el cliente (puede que el email o el DNI ya existan)";
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
