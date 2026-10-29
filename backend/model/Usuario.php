<?php

require_once __DIR__ . '/Conexion.php';

class Usuario
{
    // Roles permitidos (los mismos valores que el ENUM de la tabla usuario)
    const ROLES = ['admin', 'oficina', 'mecanico', 'cliente'];

    private $id_usuario;
    private $email;
    private $password;   // siempre se guarda el hash BCrypt, nunca el texto plano
    private $nombre;
    private $rol;
    private $auth_key;

    // Para un usuario nuevo se pasa la contraseña en texto plano y se cifra aquí
    public function __construct($email = null, $passwordPlano = null, $nombre = null, $rol = 'cliente', $id_usuario = null)
    {
        $this->id_usuario = $id_usuario;
        $this->email = $email;
        $this->nombre = $nombre;
        $this->setRol($rol);

        if ($passwordPlano !== null) {
            $this->setPassword($passwordPlano);
        }
    }

    // ---------- Getters ----------

    public function getIdUsuario()
    {
        return $this->id_usuario;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getNombre()
    {
        return $this->nombre;
    }

    public function getRol()
    {
        return $this->rol;
    }

    public function getAuthKey()
    {
        return $this->auth_key;
    }

    // ---------- Setters ----------

    public function setEmail($email)
    {
        $this->email = $email;
    }

    public function setNombre($nombre)
    {
        $this->nombre = $nombre;
    }

    public function setRol($rol)
    {
        if (!in_array($rol, self::ROLES)) {
            throw new InvalidArgumentException("Rol no válido: $rol");
        }
        $this->rol = $rol;
    }

    // Recibe la contraseña en texto plano y guarda su hash BCrypt
    public function setPassword($passwordPlano)
    {
        $this->password = password_hash($passwordPlano, PASSWORD_BCRYPT);
    }

    public function setAuthKey($auth_key)
    {
        $this->auth_key = $auth_key;
    }

    // ---------- CRUD ----------

    // Inserta el usuario y guarda en el objeto el id generado
    public function insert()
    {
        $pdo = Conexion::getInstance()->getConexion();

        try {
            $stmt = $pdo->prepare(
                "INSERT INTO usuario (email, password, nombre, rol, auth_key)
                 VALUES (:email, :password, :nombre, :rol, :auth_key)"
            );
            $stmt->execute([
                ":email"    => $this->email,
                ":password" => $this->password,
                ":nombre"   => $this->nombre,
                ":rol"      => $this->rol,
                ":auth_key" => $this->auth_key,
            ]);
            $this->id_usuario = (int) $pdo->lastInsertId();
            return true;
        } catch (PDOException $e) {
            error_log("Error al insertar usuario: " . $e->getMessage());
            return false;
        }
    }

    // Guarda en la base de datos los datos actuales del objeto
    public function update()
    {
        $pdo = Conexion::getInstance()->getConexion();

        try {
            $stmt = $pdo->prepare(
                "UPDATE usuario
                 SET email = :email, password = :password, nombre = :nombre, rol = :rol, auth_key = :auth_key
                 WHERE id_usuario = :id_usuario"
            );
            $stmt->execute([
                ":email"      => $this->email,
                ":password"   => $this->password,
                ":nombre"     => $this->nombre,
                ":rol"        => $this->rol,
                ":auth_key"   => $this->auth_key,
                ":id_usuario" => $this->id_usuario,
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Error al actualizar usuario: " . $e->getMessage());
            return false;
        }
    }

    // Borra el usuario (si es cliente o mecánico, su fila en cliente/mecanico se borra en cascada)
    public function delete()
    {
        $pdo = Conexion::getInstance()->getConexion();

        try {
            $stmt = $pdo->prepare("DELETE FROM usuario WHERE id_usuario = :id_usuario");
            $stmt->execute([":id_usuario" => $this->id_usuario]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            // Por ejemplo, un cliente con vehículos no se puede borrar (ON DELETE RESTRICT)
            error_log("Error al borrar usuario: " . $e->getMessage());
            return false;
        }
    }

    // Datos del usuario listos para enviar como JSON (sin la contraseña ni el token)
    public function toArray()
    {
        return [
            "id_usuario" => $this->id_usuario,
            "email"      => $this->email,
            "nombre"     => $this->nombre,
            "rol"        => $this->rol,
        ];
    }

    // Devuelve todos los usuarios como array de arrays asociativos
    public static function getArray()
    {
        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->query("SELECT id_usuario, email, nombre, rol FROM usuario ORDER BY id_usuario");
        return $stmt->fetchAll();
    }

    // Busca un usuario por su id; devuelve un objeto Usuario o null
    public static function getById($id_usuario)
    {
        $pdo = Conexion::getInstance()->getConexion();
        $stmt = $pdo->prepare("SELECT * FROM usuario WHERE id_usuario = :id_usuario");
        $stmt->execute([":id_usuario" => $id_usuario]);
        $fila = $stmt->fetch();

        return $fila ? self::desdeFila($fila) : null;
    }

    // Crea un objeto Usuario a partir de una fila de la tabla (con el hash ya calculado)
    private static function desdeFila($fila)
    {
        $usuario = new self($fila["email"], null, $fila["nombre"], $fila["rol"], (int) $fila["id_usuario"]);
        $usuario->password = $fila["password"];
        $usuario->auth_key = $fila["auth_key"];
        return $usuario;
    }
}
