//Panel del administrador: usuarios y sus roles
//Se carga en admin.html despues de sesion.js

const urlAdmin = "../backend/sw/admin_sw.php";

//textos que se enseñan para cada rol de la BD
const textosRol = {
    admin: "Administrador",
    oficina: "Oficina",
    mecanico: "Mecánico",
    cliente: "Cliente"
};

//textos que se enseñan para cada estado de las citas
const textosEstado = {
    pendiente: "Pendientes",
    confirmada: "Confirmadas",
    rechazada: "Rechazadas",
    en_curso: "En el taller",
    finalizada: "Finalizadas"
};

//al abrir la pagina pedimos las metricas y los usuarios
cargarMetricas();
listarUsuarios();


// ---------- Metricas ----------

function cargarMetricas(){
    let request = {};
    request.action = "metricas";

    fetch(urlAdmin, {
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
            pintarMetricas(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function pintarMetricas(metricas){
    const facturacion = metricas.facturacion;

    document.getElementById("facturacionTotal").textContent = formatearEuros(facturacion.total);
    document.getElementById("facturacionDetalle").textContent = facturacion.num_facturas + " facturas · base " +
        formatearEuros(facturacion.base_imponible) + " + IVA " + formatearEuros(facturacion.cuota_iva);

    document.getElementById("totalCitas").textContent = metricas.total_citas;
    document.getElementById("citasDetalle").textContent = metricas.citas.pendiente + " pendientes de validar";
    document.getElementById("totalClientes").textContent = metricas.clientes;
    document.getElementById("totalVehiculos").textContent = metricas.vehiculos;

    //una fila por estado con su numero de citas
    const tabla = document.getElementById("tablaEstados");
    tabla.textContent = "";

    const estados = ["pendiente", "confirmada", "rechazada", "en_curso", "finalizada"];
    for (let i = 0; i < estados.length; i++) {
        const estado = estados[i];
        //cada etiqueta se crea con createElement, se rellena con textContent y se mete con appendChild
        const fila = document.createElement("tr");
        const celdaEstado = crearCelda(fila, "");
        const etiqueta = document.createElement("span");
        etiqueta.className = "estado estado-" + estado;
        etiqueta.textContent = textosEstado[estado];
        celdaEstado.appendChild(etiqueta);
        crearCelda(fila, metricas.citas[estado]);
        tabla.appendChild(fila);
    }
}


//93.4 -> "93,40 €" (toFixed deja 2 decimales y cambiamos el punto por coma)
function formatearEuros(numero){
    return Number(numero).toFixed(2).replace(".", ",") + " €";
}


// ---------- Usuarios ----------

function listarUsuarios(){
    let request = {};
    request.action = "listarUsuarios";

    fetch(urlAdmin, {
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
            pintarUsuarios(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//una fila por usuario. A los del taller se les puede cambiar el rol con un desplegable; a los clientes no
//Como no sabemos cuantos usuarios hay, cada etiqueta se crea con createElement,
//se le pone el dato con textContent (asi no se ejecuta como HTML) y se mete en la pagina con appendChild.
//Son metodos del DOM, igual que getElementById (https://es.wikipedia.org/wiki/Document_Object_Model)
function pintarUsuarios(usuarios){
    const tabla = document.getElementById("tablaUsuarios");
    tabla.textContent = "";

    for (let i = 0; i < usuarios.length; i++) {
        const usuario = usuarios[i];

        const fila = document.createElement("tr");
        crearCelda(fila, usuario.nombre);
        crearCelda(fila, usuario.email);
        const celdaRol = crearCelda(fila, "");
        const celdaGuardar = crearCelda(fila, "");

        if (usuario.rol == "cliente") {
            celdaRol.textContent = textosRol[usuario.rol];
        } else {
            //desplegable con los tres roles del taller (value = rol de la BD, texto = como se enseña)
            const select = document.createElement("select");
            select.setAttribute("aria-label", "Rol de " + usuario.nombre);
            const roles = ["admin", "oficina", "mecanico"];
            for (let j = 0; j < roles.length; j++) {
                const opcion = document.createElement("option");
                opcion.value = roles[j];
                opcion.textContent = textosRol[roles[j]];
                select.appendChild(opcion);
            }
            select.value = usuario.rol;
            celdaRol.appendChild(select);

            const boton = crearBoton("Guardar", "boton boton-pequeno");
            boton.addEventListener("click", (event) => {
                cambiarRol(usuario, select.value);
            });
            celdaGuardar.appendChild(boton);
        }

        tabla.appendChild(fila);
    }
}


function cambiarRol(usuario, nuevoRol){
    if (nuevoRol == usuario.rol) {
        mostrarMensaje(usuario.nombre + " ya tiene ese rol", "error");
        return;
    }

    let seguro = confirm("¿Cambiar el rol de " + usuario.nombre + " a " + textosRol[nuevoRol] + "?");
    if (!seguro) {
        return;
    }

    let request = {};
    request.action = "cambiarRol";
    request.data = { id_usuario: usuario.id_usuario, rol: nuevoRol };

    fetch(urlAdmin, {
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
        } else {
            mostrarMensaje(response.msg, "error");
        }
        listarUsuarios(); //si ha fallado, el desplegable vuelve a su rol de verdad
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


//enseña el msg del servidor en el div de mensaje (en vez de un alert). tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto", "mensaje-error", "mensaje-exito");
    mensaje.classList.add("mensaje-" + tipo);
}
