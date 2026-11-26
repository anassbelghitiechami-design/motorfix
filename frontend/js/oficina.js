//Panel de la oficina: citas, clientes y vehiculos del taller
//Se carga en oficina.html despues de sesion.js

const urlOficina = "../backend/sw/oficina_sw.php";

//aqui se guardan las citas y los mecanicos que llegan del servidor,
//asi al cambiar el filtro no hay que volver a pedirlos
let citas = [];
let mecanicos = [];

//textos que se enseñan para cada estado de la BD
const textosEstado = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    rechazada: "Rechazada",
    en_curso: "En el taller",
    finalizada: "Finalizada"
};

//al abrir la pagina pedimos los mecanicos (y despues las citas), los clientes y los vehiculos
listarMecanicos();
listarClientes();
listarVehiculos();

//al cambiar el filtro de estado volvemos a pintar las citas
const filtroEstado = document.getElementById("filtroEstado");
filtroEstado.addEventListener("change", (event) => {
    pintarCitas();
});

//al boton Guardar vehículo le añadimos un escuchador tipo click
const buttonGuardarVehiculo = document.getElementById("guardarVehiculo");
buttonGuardarVehiculo.addEventListener("click", (event) => {
    guardarVehiculo();
});


// ---------- Citas ----------

//los mecanicos hacen falta para el desplegable de cada cita pendiente, por eso las citas se piden despues
function listarMecanicos(){
    let request = {};
    request.action = "listarMecanicos";

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            mecanicos = response.data;
            listarCitas();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function listarCitas(){
    let request = {};
    request.action = "listarCitas";

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            citas = response.data;
            pintarCitas();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//pinta en #tablaCitas las citas del estado elegido en el filtro (o todas)
//Como no sabemos cuantas citas hay, cada etiqueta se crea con createElement,
//se le pone el dato con textContent (asi no se ejecuta como HTML) y se mete en la pagina con appendChild.
//Son metodos del DOM, igual que getElementById (https://es.wikipedia.org/wiki/Document_Object_Model)
function pintarCitas(){
    const tabla = document.getElementById("tablaCitas");
    const estadoElegido = filtroEstado.value;
    tabla.textContent = ""; //borramos las filas que hubiera antes

    let pintadas = 0;
    for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        if (estadoElegido != "" && cita.estado != estadoElegido) {
            continue; //no es del estado del filtro, pasamos a la siguiente
        }

        //una fila <tr> con una celda <td> por columna
        const fila = document.createElement("tr");
        crearCelda(fila, formatearFecha(cita.fecha_hora));
        crearCelda(fila, cita.cliente);
        crearCelda(fila, cita.marca + " " + cita.modelo + " · " + cita.matricula);
        crearCelda(fila, cita.tipo_servicio + (cita.motivo ? " · " + cita.motivo : ""));
        const celdaMecanico = crearCelda(fila, cita.mecanico ? cita.mecanico : "-");

        //la etiqueta del estado (la clase estado-xxx le da el color)
        const celdaEstado = crearCelda(fila, "");
        const estado = document.createElement("span");
        estado.className = "estado estado-" + cita.estado;
        estado.textContent = textosEstado[cita.estado];
        celdaEstado.appendChild(estado);

        //la ultima celda tiene un div para los botones
        const celdaAcciones = crearCelda(fila, "");
        const acciones = document.createElement("div");
        acciones.className = "acciones-tabla";
        celdaAcciones.appendChild(acciones);

        //las pendientes se validan eligiendo mecanico o se rechazan
        if (cita.estado == "pendiente") {
            pintarAccionesPendiente(cita, celdaMecanico, acciones);
        }

        //las finalizadas se facturan (si ya tienen factura se enseña su numero y el total)
        if (cita.estado == "finalizada") {
            if (cita.factura) {
                acciones.textContent = "Factura " + cita.factura + " · " + Number(cita.total).toFixed(2).replace(".", ",") + " €";
            } else {
                const botonFactura = crearBoton("Generar factura", "boton boton-pequeno");
                botonFactura.addEventListener("click", (event) => {
                    generarFactura(cita);
                });
                acciones.appendChild(botonFactura);
            }
        }

        tabla.appendChild(fila);
        pintadas++;
    }

    if (pintadas == 0) {
        tabla.appendChild(crearFilaVacia("No hay citas.", 7));
    }
}


//en una cita pendiente: desplegable de mecanicos en la columna Mecánico y botones Confirmar y Rechazar
function pintarAccionesPendiente(cita, celdaMecanico, acciones){
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Mecánico");

    //la primera opcion (vacia) obliga a elegir un mecanico
    const primera = document.createElement("option");
    primera.value = "";
    primera.textContent = "Elegir mecánico";
    select.appendChild(primera);

    for (let j = 0; j < mecanicos.length; j++) {
        const opcion = document.createElement("option");
        opcion.value = mecanicos[j].id_usuario;
        opcion.textContent = mecanicos[j].nombre;
        select.appendChild(opcion);
    }
    celdaMecanico.textContent = ""; //quitamos el "-"
    celdaMecanico.appendChild(select);

    const botonConfirmar = crearBoton("Confirmar", "boton boton-pequeno");
    botonConfirmar.addEventListener("click", (event) => {
        validarCita(cita, select.value);
    });
    acciones.appendChild(botonConfirmar);

    const botonRechazar = crearBoton("Rechazar", "boton boton-secundario boton-pequeno");
    botonRechazar.addEventListener("click", (event) => {
        rechazarCita(cita);
    });
    acciones.appendChild(botonRechazar);
}


function validarCita(cita, id_mecanico){
    if (id_mecanico == "") {
        mostrarMensaje("Elige el mecánico antes de confirmar la cita", "error");
        return;
    }

    let request = {};
    request.action = "validarCita";
    request.data = { id_cita: cita.id_cita, id_mecanico: id_mecanico };

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            listarCitas();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function rechazarCita(cita){
    let seguro = confirm("¿Seguro que quieres rechazar la cita de " + cita.cliente + " (" + cita.matricula + ")?");
    if (!seguro) {
        return;
    }

    let request = {};
    request.action = "rechazarCita";
    request.data = { id_cita: cita.id_cita };

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            listarCitas();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//pide a factura_sw.php que calcule y guarde la factura de la reparacion terminada
function generarFactura(cita){
    let seguro = confirm("¿Generar la factura de la reparación de " + cita.cliente + " (" + cita.matricula + ")?");
    if (!seguro) {
        return;
    }

    let request = {};
    request.action = "generar";
    request.data = {
        id_cita: cita.id_cita
    };

    fetch("../backend/sw/factura_sw.php", {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            listarCitas(); //para que salga el numero de factura en la fila
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//"2026-10-28 09:30:00" -> "28/10/2026 09:30"
function formatearFecha(fechaHora){
    const partes = fechaHora.split(" ");
    const fecha = partes[0].split("-");
    return fecha[2] + "/" + fecha[1] + "/" + fecha[0] + " " + partes[1].substring(0, 5);
}


// ---------- Clientes ----------

function listarClientes(){
    let request = {};
    request.action = "listarClientes";

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            pintarClientes(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//una fila por cliente en #tablaClientes y una opcion por cliente en el desplegable del formulario de vehiculo
function pintarClientes(clientes){
    const tabla = document.getElementById("tablaClientes");
    const select = document.getElementById("clienteVehiculo");
    tabla.textContent = "";
    select.textContent = "";

    if (clientes.length == 0) {
        tabla.appendChild(crearFilaVacia("Todavía no hay clientes registrados.", 6));
        return;
    }

    for (let i = 0; i < clientes.length; i++) {
        const cliente = clientes[i];

        //una fila <tr> con una celda <td> por columna
        const fila = document.createElement("tr");
        crearCelda(fila, cliente.nombre);
        crearCelda(fila, cliente.dni);
        crearCelda(fila, cliente.email);
        crearCelda(fila, cliente.telefono);
        crearCelda(fila, cliente.localidad ? cliente.localidad : "-");
        crearCelda(fila, cliente.num_vehiculos);
        tabla.appendChild(fila);

        const opcion = document.createElement("option");
        opcion.value = cliente.id_usuario;
        opcion.textContent = cliente.nombre + " · " + cliente.dni;
        select.appendChild(opcion);
    }
}


// ---------- Vehiculos ----------

function listarVehiculos(){
    let request = {};
    request.action = "listarVehiculos";

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            pintarVehiculos(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function pintarVehiculos(vehiculos){
    const tabla = document.getElementById("tablaVehiculos");
    tabla.textContent = "";

    if (vehiculos.length == 0) {
        tabla.appendChild(crearFilaVacia("Todavía no hay vehículos.", 5));
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        const vehiculo = vehiculos[i];

        const fila = document.createElement("tr");
        crearCelda(fila, vehiculo.matricula);
        crearCelda(fila, vehiculo.marca + " " + vehiculo.modelo);
        crearCelda(fila, vehiculo.anio ? vehiculo.anio : "-");
        crearCelda(fila, vehiculo.cliente);

        //la ultima celda tiene el boton de borrar
        const celdaBorrar = crearCelda(fila, "");
        const botonBorrar = crearBoton("Borrar", "boton boton-secundario boton-pequeno");
        botonBorrar.addEventListener("click", (event) => {
            borrarVehiculo(vehiculo);
        });
        celdaBorrar.appendChild(botonBorrar);

        tabla.appendChild(fila);
    }
}


function guardarVehiculo(){
    let vehiculo = {};
    vehiculo.id_cliente = document.getElementById("clienteVehiculo").value;
    vehiculo.matricula = document.getElementById("matricula").value.trim();
    vehiculo.marca = document.getElementById("marca").value.trim();
    vehiculo.modelo = document.getElementById("modelo").value.trim();
    vehiculo.anio = document.getElementById("anio").value;

    if (vehiculo.id_cliente == "" || vehiculo.matricula == "" || vehiculo.marca == "" || vehiculo.modelo == "") {
        mostrarMensaje("Elige el cliente y rellena la matrícula, la marca y el modelo", "error");
        return;
    }

    let request = {};
    request.action = "insertarVehiculo";
    request.data = vehiculo;

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            document.getElementById("formVehiculo").reset();
            listarVehiculos();
            listarClientes(); //para que se actualice el numero de vehiculos del cliente
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function borrarVehiculo(vehiculo){
    //confirm enseña una ventana con Aceptar y Cancelar y devuelve true o false
    let seguro = confirm("¿Seguro que quieres borrar el " + vehiculo.marca + " " + vehiculo.modelo + " (" + vehiculo.matricula + ") de " + vehiculo.cliente + "?");
    if (!seguro) {
        return;
    }

    let request = {};
    request.action = "borrarVehiculo";
    request.data = { matricula: vehiculo.matricula };

    fetch(urlOficina, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(response => {
        console.log(response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            listarVehiculos();
            listarClientes();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


// ---------- Funciones para crear etiquetas ----------
//Se usan en todas las tablas: createElement crea la etiqueta, textContent le pone el texto
//y appendChild la mete dentro de otra (https://es.wikipedia.org/wiki/Document_Object_Model)

//crea una celda <td> con el texto, la mete en la fila y la devuelve (por si hay que meterle algo mas)
function crearCelda(fila, texto){
    const celda = document.createElement("td");
    celda.textContent = texto;
    fila.appendChild(celda);
    return celda;
}


//crea un <button type="button"> con su texto y sus clases
function crearBoton(texto, clases){
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = clases;
    boton.textContent = texto;
    return boton;
}


//crea la fila <tr><td colspan="..." class="detalle">texto</td></tr> que sale cuando una tabla esta vacia
//colspan es el numero de columnas que ocupa la celda (todas las de la tabla)
function crearFilaVacia(texto, columnas){
    const fila = document.createElement("tr");
    const celda = crearCelda(fila, texto);
    celda.colSpan = columnas;
    celda.className = "detalle";
    return fila;
}


//enseña el msg del servidor en el div de mensaje (en vez de un alert). tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto", "mensaje-error", "mensaje-exito");
    mensaje.classList.add("mensaje-" + tipo);
}
