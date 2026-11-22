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


//como todas las peticiones de este panel van al mismo sw, esta funcion hace el fetch
//y le pasa la respuesta a la funcion que le digamos (alFinalizar)
function peticion(action, data, alFinalizar){
    let request = {};
    request.action = action;
    request.data = data;

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
        alFinalizar(response);
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


// ---------- Metricas ----------

function cargarMetricas(){
    peticion("metricas", {}, (response) => {
        if (response.success) {
            pintarMetricas(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
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
    tabla.innerHTML = "";

    //for...in recorre las claves del objeto: pendiente, confirmada...
    for (let estado in metricas.citas) {
        const fila = document.createElement("tr");
        fila.innerHTML = '<td><span class="estado"></span></td><td></td>';
        const etiqueta = fila.querySelector(".estado");
        etiqueta.textContent = textosEstado[estado];
        etiqueta.classList.add("estado-" + estado);
        fila.querySelectorAll("td")[1].textContent = metricas.citas[estado];
        tabla.appendChild(fila);
    }
}


//93.4 -> "93,40 €" (toFixed deja 2 decimales y cambiamos el punto por coma)
function formatearEuros(numero){
    return Number(numero).toFixed(2).replace(".", ",") + " €";
}


// ---------- Usuarios ----------

function listarUsuarios(){
    peticion("listarUsuarios", {}, (response) => {
        if (response.success) {
            pintarUsuarios(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    });
}


//una fila por usuario. A los del taller se les puede cambiar el rol con un desplegable; a los clientes no
function pintarUsuarios(usuarios){
    const tabla = document.getElementById("tablaUsuarios");
    tabla.innerHTML = "";

    for (let i = 0; i < usuarios.length; i++) {
        const usuario = usuarios[i];

        const fila = document.createElement("tr");
        fila.innerHTML = "<td></td><td></td><td></td><td></td>";
        const celdas = fila.querySelectorAll("td");
        celdas[0].textContent = usuario.nombre;
        celdas[1].textContent = usuario.email;

        if (usuario.rol == "cliente") {
            celdas[2].textContent = textosRol[usuario.rol];
        } else {
            const select = document.createElement("select");
            select.setAttribute("aria-label", "Rol de " + usuario.nombre);
            select.innerHTML = `
                <option value="admin">Administrador</option>
                <option value="oficina">Oficina</option>
                <option value="mecanico">Mecánico</option>
            `;
            select.value = usuario.rol;
            celdas[2].appendChild(select);

            celdas[3].innerHTML = '<button type="button" class="boton boton-pequeno">Guardar</button>';
            celdas[3].querySelector("button").addEventListener("click", (event) => {
                cambiarRol(usuario, select.value);
            });
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

    peticion("cambiarRol", { id_usuario: usuario.id_usuario, rol: nuevoRol }, (response) => {
        if (response.success) {
            mostrarMensaje(response.msg, "exito");
        } else {
            mostrarMensaje(response.msg, "error");
        }
        listarUsuarios(); //si ha fallado, el desplegable vuelve a su rol de verdad
    });
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
