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
}
