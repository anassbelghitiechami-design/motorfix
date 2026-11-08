<?php
require_once __DIR__ . '/../model/Usuario.php';

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
