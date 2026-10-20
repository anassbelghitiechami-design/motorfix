# MotorFix

Sistema de gestión integral para el taller mecánico "MotorFix".
Práctica intermodular AD + DI, 2º DAM (entrega: 30/11/2026).

## Estructura

- `backend/model/`: clases de modelo PHP (Usuario, Cliente, Vehiculo, Cita, Factura) y Conexion.php (Singleton)
- `backend/sw/`: servicios web `*_sw.php` (respuestas JSON `{success, msg, data}`)
- `frontend/`: vistas HTML, CSS y controladores JS (fetch)
- `sql/`: script de creación de la base de datos y rutinas almacenadas
- `docs/`: diagrama E-R y memoria

## Ramas

- `main`: versiones entregables
- `develop`: integración
- `feature/<nombre>`: una rama por tarea del tablero
