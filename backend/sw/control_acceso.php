<?php
//Este archivo lo incluyen todos los _sw.php que necesitan que el usuario haya hecho login
//Se pone arriba del _sw.php asi:
//  require_once __DIR__ . '/control_acceso.php';
//  comprobarAcceso(["oficina", "admin"]);

//Iniciamos la sesion para poder leer $_SESSION (la guarda auth_sw.php al hacer login)
session_start();

//Comprueba que hay sesion iniciada y que el rol del usuario esta entre los permitidos.
//Si no, devuelve el JSON de error y para el _sw.php para que no haga nada mas
function comprobarAcceso($rolesPermitidos)
{
    $success = true;
    $msg = "";

    if (!isset($_SESSION["id_usuario"])) {
        $success = false;
        $msg = "No has iniciado sesion";
    } else if (!in_array($_SESSION["rol"], $rolesPermitidos)) {
        $success = false;
        $msg = "No tienes permiso para hacer esta accion";
    }

    if (!$success) {
        $arrSalida = [
            "success" => $success,
            "data" => [],
            "msg" => $msg
        ];

        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode($arrSalida);
        exit; //paramos aqui, el resto del _sw.php no se ejecuta
    }
}
