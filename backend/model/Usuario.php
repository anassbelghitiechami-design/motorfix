<?php

require_once __DIR__ . '/Conexion.php';

class Usuario
{
    private $pdo;

    private $id_usuario;
    private $email;
    private $password;   // siempre se guarda el hash BCrypt, nunca el texto plano
    private $nombre;
    private $rol;
    private $auth_key;

    // Para un usuario nuevo se pasa la contraseña en texto plano y se cifra aquí
    public function __construct($email = null, $passwordPlano = null, $nombre = null, $rol = 'cliente', $id_usuario = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->id_usuario = $id_usuario;
        $this->email = $email;
        $this->nombre = $nombre;
        $this->rol = $rol;

        if ($passwordPlano !== null) {
            $this->password = password_hash($passwordPlano, PASSWORD_BCRYPT);
        }
    }

    function getIdUsuario()
    {
        return $this->id_usuario;
    }

    // Inserta el usuario y guarda en el objeto el id generado
    function insertUsuario()
    {
        $sql = "INSERT INTO usuario (email, password, nombre, rol, auth_key)
                VALUES (:email, :password, :nombre, :rol, :auth_key)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':email', $this->email, PDO::PARAM_STR);
        $stmt->bindParam(':password', $this->password, PDO::PARAM_STR);
        $stmt->bindParam(':nombre', $this->nombre, PDO::PARAM_STR);
        $stmt->bindParam(':rol', $this->rol, PDO::PARAM_STR);
        $stmt->bindParam(':auth_key', $this->auth_key, PDO::PARAM_STR);
        $stmt->execute();

        $this->id_usuario = (int) $this->pdo->lastInsertId();
    }

    // Devuelve los datos del usuario (sin la contraseña ni el token) o false si no existe
    function getUsuario()
    {
        $sql = "SELECT id_usuario, email, nombre, rol FROM usuario WHERE id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Devuelve los mecánicos (id y nombre) para el desplegable de la oficina
    // Se mira tambien el rol porque si el admin le quita el rol de mecanico su fila en mecanico se queda
    // (para no perder a quien hizo las reparaciones antiguas)
    function getMecanicos()
    {
        $sql = "SELECT u.id_usuario, u.nombre
                FROM usuario u
                JOIN mecanico m ON m.id_usuario = u.id_usuario
                WHERE u.rol = 'mecanico'
                ORDER BY u.nombre";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Devuelve todos los usuarios (sin la contraseña) para el panel del admin
    function getUsuarios()
    {
        $sql = "SELECT id_usuario, email, nombre, rol FROM usuario ORDER BY rol, nombre";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Devuelve true si el usuario del objeto ya esta en la tabla mecanico
    function esMecanico()
    {
        $sql = "SELECT id_usuario FROM mecanico WHERE id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($fila) {
            return true;
        }
        return false;
    }

    // Da de alta al usuario del objeto en la tabla mecanico (especializacion de usuario)
    function insertMecanico()
    {
        $sql = "INSERT INTO mecanico (id_usuario) VALUES (:id_usuario)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Borra el usuario (si es cliente o mecánico, su fila en cliente/mecanico se borra en cascada)
    function deleteUsuario()
    {
        $sql = "DELETE FROM usuario WHERE id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Guarda en la base de datos los datos actuales del objeto (la contraseña no se toca)
    function updateUsuario()
    {
        $sql = "UPDATE usuario SET email = :email, nombre = :nombre, rol = :rol WHERE id_usuario = :id_usuario";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':email', $this->email, PDO::PARAM_STR);
        $stmt->bindParam(':nombre', $this->nombre, PDO::PARAM_STR);
        $stmt->bindParam(':rol', $this->rol, PDO::PARAM_STR);
        $stmt->bindParam(':id_usuario', $this->id_usuario, PDO::PARAM_INT);
        $stmt->execute();
    }

    // Comprueba el email del objeto con la contraseña en texto plano.
    // Devuelve los datos del usuario (sin la contraseña) o false si no coinciden
    //etsa funcion sirve ver si el usuario u contrasña q escriben son correctos
    function loginUsuario($passwordPlano)
    {
        $sql = "SELECT id_usuario, email, password, nombre, rol FROM usuario WHERE email = :email";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':email', $this->email, PDO::PARAM_STR);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($fila && password_verify($passwordPlano, $fila['password'])) {
            unset($fila['password']);
            return $fila;
        }
        return false;
    }
}
