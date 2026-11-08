<?php

class Conexion
{
    // Única instancia de la clase
    private static $instance = null;

   
    private $pdo;

    // Constructor privado para  no poder  crear instancias con new desde fuera
    private function __construct()
    {
        $host     = "localhost";  
        $dbname   = "motorfix";   
        $usuario  = "root";      
        $password = "";         

        try {
            $this->pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $usuario, $password);

            
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
        
            throw new Exception("Error de conexión con la base de datos: " . $e->getMessage());
        }
    }

    // Clonación no permitida,visto en wikipedia
    private function __clone() { }

    //al ser singelto devuelve siempre la misma instancia (la crea solo la primera vez)
    public static function getInstance()
    {
        if (self::$instance === null) { //self::$instance es el atributo private static de arriba. el null es su valor inicial
            self::$instance = new self();//new self() crea un objeto de esta misma clase
        }

        return self::$instance;
    }

    // Devuelve el objeto PDO para hacer consultas
    public function getConexion()
    {
        return $this->pdo;
    }
}