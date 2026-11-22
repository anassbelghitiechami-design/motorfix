<?php
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/../model/Cliente.php';
require_once __DIR__ . '/../model/Vehiculo.php';
require_once __DIR__ . '/../model/Cita.php';
require_once __DIR__ . '/../model/Factura.php';
require_once __DIR__ . '/control_acceso.php';

//Solo el administrador usa este sw (control_acceso.php ya hace el session_start)
comprobarAcceso(["admin"]);

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
    case "metricas":
        $cliente = new Cliente();
        $vehiculo = new Vehiculo();
        $cita = new Cita();
        $factura = new Factura();

        //count() cuenta los elementos de un array
        $data["clientes"] = count($cliente->getClientes());
        $data["vehiculos"] = count($vehiculo->getVehiculos());

        //las citas por estado: empezamos todas a 0 por si algun estado no tiene ninguna
        $data["citas"] = ["pendiente" => 0, "confirmada" => 0, "rechazada" => 0, "en_curso" => 0, "finalizada" => 0];
        $data["total_citas"] = 0;
        foreach ($cita->contarPorEstado() as $fila) {
            $data["citas"][$fila["estado"]] = (int) $fila["num"];
            $data["total_citas"] += (int) $fila["num"];
        }

        $data["facturacion"] = $factura->getResumen();
        $msg = "Metricas obtenidas correctamente";
        break;

    case "listarUsuarios":
        $usuario = new Usuario();
        $data = $usuario->getUsuarios();
        $msg = "Usuarios obtenidos correctamente";
        break;

    case "cambiarRol":
        $id_usuario = $request["data"]["id_usuario"];
        $nuevoRol = $request["data"]["rol"];

        //el admin no se puede cambiar el rol a si mismo (se quedaria sin poder entrar al panel)
        if ($id_usuario == $_SESSION["id_usuario"]) {
            $success = false;
            $msg = "No puedes cambiar tu propio rol";
            break;
        }

        //solo se puede cambiar entre los roles del taller. Un cliente necesita DNI y direccion, por eso no se puede elegir
        if ($nuevoRol != "admin" && $nuevoRol != "oficina" && $nuevoRol != "mecanico") {
            $success = false;
            $msg = "Rol no valido";
            break;
        }

        $usuario = new Usuario(null, null, null, null, $id_usuario);
        $obtenido = $usuario->getUsuario();

        if (!$obtenido) {
            $success = false;
            $msg = "Ese usuario no existe";
            break;
        }

        if ($obtenido["rol"] == "cliente") {
            $success = false;
            $msg = "A un cliente no se le puede cambiar el rol";
            break;
        }

        //creamos el usuario con los mismos datos y el rol nuevo (updateUsuario no toca la contraseña)
        $usuario = new Usuario($obtenido["email"], null, $obtenido["nombre"], $nuevoRol, $id_usuario);
        $usuario->updateUsuario();

        //si pasa a ser mecanico tiene que estar tambien en la tabla mecanico
        if ($nuevoRol == "mecanico") {
            $usuario->insertMecanico();
        }

        $msg = "Rol de " . $obtenido["nombre"] . " cambiado a " . $nuevoRol;
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
