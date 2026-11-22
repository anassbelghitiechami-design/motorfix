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


//como todas las peticiones de este panel van al mismo sw, esta funcion hace el fetch
//y le pasa la respuesta a la funcion que le digamos (alFinalizar)
function peticion(action, data, alFinalizar){
    let request = {};
    request.action = action;
    request.data = data;

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
        alFinalizar(response);
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


// ---------- Hoja de trabajo ----------

function listarHoja(){
    peticion("listar", {}, (response) => {
        if (response.success) {
            pintarHoja(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    });
}


//una fila por cita asignada en #tablaHoja con el boton Abrir
function pintarHoja(citas){
    const tabla = document.getElementById("tablaHoja");
    tabla.innerHTML = "";

    if (citas.length == 0) {
        tabla.innerHTML = '<tr><td colspan="6" class="detalle">No tienes reparaciones asignadas.</td></tr>';
        return;
    }

    for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td></td><td></td><td></td><td></td>
            <td><span class="estado"></span></td>
            <td><button type="button" class="boton boton-secundario boton-pequeno">Abrir</button></td>
        `;
        const celdas = fila.querySelectorAll("td");
        celdas[0].textContent = formatearFecha(cita.fecha_hora);
        celdas[1].textContent = cita.marca + " " + cita.modelo + " · " + cita.matricula;
        celdas[2].textContent = cita.cliente;
        celdas[3].textContent = cita.tipo_servicio + (cita.motivo ? " · " + cita.motivo : "");

        const estado = fila.querySelector(".estado");
        estado.textContent = textosEstado[cita.estado];
        estado.classList.add("estado-" + cita.estado);

        fila.querySelector("button").addEventListener("click", (event) => {
            abrirReparacion(cita);
        });

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

    const seccion = document.getElementById("reparacion");
    seccion.classList.remove("oculto");
}


//"2026-10-28 09:30:00" -> "28/10/2026 09:30"
function formatearFecha(fechaHora){
    const partes = fechaHora.split(" ");
    const fecha = partes[0].split("-");
    return fecha[2] + "/" + fecha[1] + "/" + fecha[0] + " " + partes[1].substring(0, 5);
}


//enseña el msg del servidor en el div de mensaje (en vez de un alert). tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto", "mensaje-error", "mensaje-exito");
    mensaje.classList.add("mensaje-" + tipo);
    //el div esta arriba del todo, asi que lo llevamos a la vista para que se lea
    mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
}
