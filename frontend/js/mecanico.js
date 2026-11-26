//Panel del mecanico: su hoja de trabajo y la reparacion que tiene abierta
//Se carga en mecanico.html despues de sesion.js

const urlMecanico = "../backend/sw/mecanico_sw.php";

//cita que el mecanico tiene abierta abajo (null si no ha abierto ninguna)
let citaAbierta = null;

//textos que se enseñan para cada estado de la BD
const textosEstado = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    rechazada: "Rechazada",
    en_curso: "En el taller",
    finalizada: "Finalizada"
};

//al abrir la pagina pedimos la hoja de trabajo
listarHoja();

//botones para cambiar el estado de la reparacion abierta
const buttonEmpezar = document.getElementById("empezar");
buttonEmpezar.addEventListener("click", (event) => {
    cambiarEstado("en_curso");
});

const buttonFinalizar = document.getElementById("finalizar");
buttonFinalizar.addEventListener("click", (event) => {
    cambiarEstado("finalizada");
});

//al boton Guardar horas le añadimos un escuchador tipo click
const buttonManoObra = document.getElementById("guardarManoObra");
buttonManoObra.addEventListener("click", (event) => {
    guardarManoObra();
});

//al boton Añadir pieza le añadimos un escuchador tipo click
const buttonPieza = document.getElementById("anadirPieza");
buttonPieza.addEventListener("click", (event) => {
    anadirPieza();
});


// ---------- Hoja de trabajo ----------

function listarHoja(){
    let request = {};
    request.action = "listar";

    fetch(urlMecanico, {
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
            pintarHoja(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//una fila por cita asignada en #tablaHoja con el boton Abrir
//Como no sabemos cuantas citas tiene el mecanico, cada etiqueta se crea con createElement,
//se le pone el dato con textContent (asi no se ejecuta como HTML) y se mete en la pagina con appendChild.
//Son metodos del DOM, igual que getElementById (https://es.wikipedia.org/wiki/Document_Object_Model)
function pintarHoja(citas){
    const tabla = document.getElementById("tablaHoja");
    tabla.textContent = ""; //borramos las filas que hubiera antes

    if (citas.length == 0) {
        tabla.appendChild(crearFilaVacia("No tienes reparaciones asignadas.", 6));
        return;
    }

    for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        //una fila <tr> con una celda <td> por columna
        const fila = document.createElement("tr");
        crearCelda(fila, formatearFecha(cita.fecha_hora));
        crearCelda(fila, cita.marca + " " + cita.modelo + " · " + cita.matricula);
        crearCelda(fila, cita.cliente);
        crearCelda(fila, cita.tipo_servicio + (cita.motivo ? " · " + cita.motivo : ""));

        //la etiqueta del estado (la clase estado-xxx le da el color)
        const celdaEstado = crearCelda(fila, "");
        const estado = document.createElement("span");
        estado.className = "estado estado-" + cita.estado;
        estado.textContent = textosEstado[cita.estado];
        celdaEstado.appendChild(estado);

        //la ultima celda tiene el boton Abrir
        const celdaAbrir = crearCelda(fila, "");
        const botonAbrir = crearBoton("Abrir", "boton boton-secundario boton-pequeno");
        botonAbrir.addEventListener("click", (event) => {
            abrirReparacion(cita);
        });
        celdaAbrir.appendChild(botonAbrir);

        tabla.appendChild(fila);

        //si habia una cita abierta, la volvemos a pintar con los datos nuevos
        if (citaAbierta != null && citaAbierta.id_cita == cita.id_cita) {
            abrirReparacion(cita);
        }
    }
}


// ---------- Reparacion abierta ----------

//enseña abajo la reparacion elegida con su estado
function abrirReparacion(cita){
    citaAbierta = cita;

    document.getElementById("tituloReparacion").textContent = cita.marca + " " + cita.modelo + " · " + cita.matricula;
    document.getElementById("detalleReparacion").textContent = cita.cliente + " · " + cita.tipo_servicio +
        (cita.motivo ? " · " + cita.motivo : "") + " · " + formatearFecha(cita.fecha_hora);

    const estado = document.getElementById("estadoReparacion");
    estado.textContent = textosEstado[cita.estado];
    estado.className = "estado estado-" + cita.estado;

    //solo se enseña el boton que toca segun el estado
    if (cita.estado == "confirmada") {
        buttonEmpezar.classList.remove("oculto");
    } else {
        buttonEmpezar.classList.add("oculto");
    }
    if (cita.estado == "en_curso") {
        buttonFinalizar.classList.remove("oculto");
    } else {
        buttonFinalizar.classList.add("oculto");
    }

    //las horas se rellenan con lo que ya habia guardado
    document.getElementById("horas").value = cita.horas ? cita.horas : "";
    document.getElementById("precioHora").value = cita.precio_hora ? cita.precio_hora : "";

    //las horas y las piezas solo se pueden tocar mientras el coche esta en el taller
    const editable = cita.estado == "en_curso";
    //los ids de los inputs y botones de los dos formularios
    const campos = ["horas", "precioHora", "guardarManoObra", "referencia", "descripcion", "unidades", "precioPieza", "anadirPieza"];
    for (let i = 0; i < campos.length; i++) {
        document.getElementById(campos[i]).disabled = !editable;
    }

    listarPiezas();

    const seccion = document.getElementById("reparacion");
    seccion.classList.remove("oculto");
}


// ---------- Mano de obra y piezas ----------

function guardarManoObra(){
    let manoObra = {};
    manoObra.id_cita = citaAbierta.id_cita;
    manoObra.horas = document.getElementById("horas").value;
    manoObra.precio_hora = document.getElementById("precioHora").value;

    if (manoObra.horas == "" || manoObra.precio_hora == "") {
        mostrarMensaje("Escribe las horas trabajadas y el precio por hora", "error");
        return;
    }

    let request = {};
    request.action = "guardarManoObra";
    request.data = manoObra;

    fetch(urlMecanico, {
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
            listarHoja(); //para que la cita abierta tenga las horas nuevas
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function listarPiezas(){
    let request = {};
    request.action = "listarPiezas";
    request.data = { id_cita: citaAbierta.id_cita };

    fetch(urlMecanico, {
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
            pintarPiezas(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//una fila por pieza con su importe (unidades x precio) y el boton Quitar
function pintarPiezas(piezas){
    const tabla = document.getElementById("tablaPiezas");
    tabla.textContent = "";

    if (piezas.length == 0) {
        tabla.appendChild(crearFilaVacia("Todavía no hay piezas en esta reparación.", 6));
        return;
    }

    for (let i = 0; i < piezas.length; i++) {
        const pieza = piezas[i];

        const fila = document.createElement("tr");
        crearCelda(fila, pieza.referencia);
        crearCelda(fila, pieza.descripcion);
        crearCelda(fila, pieza.unidades);
        crearCelda(fila, formatearEuros(pieza.precio));
        crearCelda(fila, formatearEuros(pieza.unidades * pieza.precio));

        //la ultima celda tiene el boton Quitar (solo se puede usar si el coche esta en el taller)
        const celdaQuitar = crearCelda(fila, "");
        const boton = crearBoton("Quitar", "boton boton-secundario boton-pequeno");
        boton.disabled = citaAbierta.estado != "en_curso";
        boton.addEventListener("click", (event) => {
            quitarPieza(pieza);
        });
        celdaQuitar.appendChild(boton);

        tabla.appendChild(fila);
    }
}


function anadirPieza(){
    let pieza = {};
    pieza.id_cita = citaAbierta.id_cita;
    pieza.referencia = document.getElementById("referencia").value.trim();
    pieza.descripcion = document.getElementById("descripcion").value.trim();
    pieza.unidades = document.getElementById("unidades").value;
    pieza.precio = document.getElementById("precioPieza").value;

    if (pieza.referencia == "" || pieza.descripcion == "" || pieza.unidades == "" || pieza.precio == "") {
        mostrarMensaje("Rellena la referencia, la descripción, las unidades y el precio de la pieza", "error");
        return;
    }

    let request = {};
    request.action = "anadirPieza";
    request.data = pieza;

    fetch(urlMecanico, {
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
            document.getElementById("formPieza").reset();
            listarPiezas();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


function quitarPieza(pieza){
    let seguro = confirm("¿Quitar " + pieza.descripcion + " de la reparación?");
    if (!seguro) {
        return;
    }

    let request = {};
    request.action = "quitarPieza";
    request.data = { id_cita_pieza: pieza.id_cita_pieza };

    fetch(urlMecanico, {
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
            listarPiezas();
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//9.9 -> "9,90 €" (toFixed deja 2 decimales y cambiamos el punto por coma)
function formatearEuros(numero){
    return Number(numero).toFixed(2).replace(".", ",") + " €";
}


//pasa la reparacion abierta al estado que se le pasa (en_curso o finalizada)
function cambiarEstado(nuevoEstado){
    if (nuevoEstado == "finalizada") {
        let seguro = confirm("¿Has terminado la reparación? Después ya no podrás cambiar las horas ni las piezas.");
        if (!seguro) {
            return;
        }
    }

    let request = {};
    request.action = "cambiarEstado";
    request.data = { id_cita: citaAbierta.id_cita, estado: nuevoEstado };

    fetch(urlMecanico, {
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
            listarHoja(); //al pintar la hoja se vuelve a abrir la cita con el estado nuevo
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
