<?php

require_once __DIR__ . '/Conexion.php';

// Piezas usadas en una cita. En el E-R "piezas" es un atributo multivaluado de CITA,
// por eso va en su propia tabla (cita_pieza)
class CitaPieza
{
    private $pdo;

    private $id_cita_pieza;
    private $id_cita;
    private $referencia;
    private $descripcion;
    private $unidades;
    private $precio;         // precio de una unidad

    public function __construct($id_cita_pieza = null, $id_cita = null, $referencia = null, $descripcion = null, $unidades = null, $precio = null)
    {
        $this->pdo = Conexion::getInstance()->getConexion();
        $this->id_cita_pieza = $id_cita_pieza;
        $this->id_cita = $id_cita;
        $this->referencia = $referencia;
        $this->descripcion = $descripcion;
        $this->unidades = $unidades;
        $this->precio = $precio;
    }

    // Inserta la pieza en la cita y guarda en el objeto el id generado
    function insertCitaPieza()
    {
        $sql = "INSERT INTO cita_pieza (id_cita, referencia, descripcion, unidades, precio)
                VALUES (:id_cita, :referencia, :descripcion, :unidades, :precio)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->bindParam(':referencia', $this->referencia, PDO::PARAM_STR);
        $stmt->bindParam(':descripcion', $this->descripcion, PDO::PARAM_STR);
        $stmt->bindParam(':unidades', $this->unidades, PDO::PARAM_INT);
        $stmt->bindParam(':precio', $this->precio, PDO::PARAM_STR);
        $stmt->execute();

        $this->id_cita_pieza = (int) $this->pdo->lastInsertId();
    }

    // Devuelve los datos de la pieza o false si no existe
    function getCitaPieza()
    {
        $sql = "SELECT id_cita_pieza, id_cita, referencia, descripcion, unidades, precio
                FROM cita_pieza WHERE id_cita_pieza = :id_cita_pieza";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita_pieza', $this->id_cita_pieza, PDO::PARAM_INT);
        $stmt->execute();
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila;
    }

    // Devuelve todas las piezas de la cita del objeto (array vacío si no tiene)
    function getPiezasCita()
    {
        $sql = "SELECT id_cita_pieza, id_cita, referencia, descripcion, unidades, precio
                FROM cita_pieza WHERE id_cita = :id_cita ORDER BY id_cita_pieza";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita', $this->id_cita, PDO::PARAM_INT);
        $stmt->execute();
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $filas;
    }

    // Borra la pieza de la cita
    function deleteCitaPieza()
    {
        $sql = "DELETE FROM cita_pieza WHERE id_cita_pieza = :id_cita_pieza";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindParam(':id_cita_pieza', $this->id_cita_pieza, PDO::PARAM_INT);
        $stmt->execute();
    }
}
