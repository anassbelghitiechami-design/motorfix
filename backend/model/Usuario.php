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
