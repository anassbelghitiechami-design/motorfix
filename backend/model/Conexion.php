<?php

class Conexion
{
    // Única instancia de la clase
    private static $instance = null;

    // Objeto PDO con la conexión a la base de datos
    private $pdo;

    // Constructor privado: impide crear instancias con new desde fuera
    private function __construct()
    {
        $host     = "localhost";  // Servidor de MySQL (en XAMPP, localhost)
        $dbname   = "motorfix";   // Base de datos del proyecto
        $usuario  = "root";       // Usuario por defecto de XAMPP
        $password = "";           // En XAMPP la contraseña está vacía

        try {
            $this->pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $usuario, $password);

            // Si hay un error, PDO lanza una excepción
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Los resultados vienen como arrays asociativos (clave => valor)
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        
            throw new Exception("Error de conexión con la base de datos: " . $e->getMessage());
        }
    }

    // Clonación no permitida visto en wikipedia
    private function __clone() { }

    //al ser singelto devuelve siempre la misma instancia (la crea solo la primera vez)
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    // Devuelve el objeto PDO para hacer consultas
    public function getConexion()
    {
        return $this->pdo;
    }
}