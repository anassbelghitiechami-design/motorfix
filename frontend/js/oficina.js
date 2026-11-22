//Panel de la oficina: citas, clientes y vehiculos del taller
//Se carga en oficina.html despues de sesion.js

const urlOficina = "../backend/sw/oficina_sw.php";

//al abrir la pagina pedimos los clientes y los vehiculos
listarClientes();
listarVehiculos();

//al boton Guardar vehículo le añadimos un escuchador tipo click
const buttonGuardarVehiculo = document.getElementById("guardarVehiculo");
buttonGuardarVehiculo.addEventListener("click", (event) => {
    guardarVehiculo();
});


//como todas las peticiones de este panel van al mismo sw, esta funcion hace el fetch
//y le pasa la respuesta a la funcion que le digamos (alFinalizar)
function peticion(action, data, alFinalizar){
    let request = {};
    request.action = action;
    request.data = data;

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
        alFinalizar(response);
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


// ---------- Clientes ----------

function listarClientes(){
    peticion("listarClientes", {}, (response) => {
        if (response.success) {
            pintarClientes(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    });
}


//una fila por cliente en #tablaClientes y una opcion por cliente en el desplegable del formulario de vehiculo
function pintarClientes(clientes){
    const tabla = document.getElementById("tablaClientes");
    const select = document.getElementById("clienteVehiculo");
    tabla.innerHTML = "";
    select.innerHTML = "";

    if (clientes.length == 0) {
        tabla.innerHTML = '<tr><td colspan="6" class="detalle">Todavía no hay clientes registrados.</td></tr>';
        return;
    }

    for (let i = 0; i < clientes.length; i++) {
        const cliente = clientes[i];

        const fila = document.createElement("tr");
        fila.innerHTML = "<td></td><td></td><td></td><td></td><td></td><td></td>";
        const celdas = fila.querySelectorAll("td");
        celdas[0].textContent = cliente.nombre;
        celdas[1].textContent = cliente.dni;
        celdas[2].textContent = cliente.email;
        celdas[3].textContent = cliente.telefono;
        celdas[4].textContent = cliente.localidad ? cliente.localidad : "-";
        celdas[5].textContent = cliente.num_vehiculos;
        tabla.appendChild(fila);

        const opcion = document.createElement("option");
        opcion.value = cliente.id_usuario;
        opcion.textContent = cliente.nombre + " · " + cliente.dni;
        select.appendChild(opcion);
    }
}


// ---------- Vehiculos ----------

function listarVehiculos(){
    peticion("listarVehiculos", {}, (response) => {
        if (response.success) {
            pintarVehiculos(response.data);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    });
}


function pintarVehiculos(vehiculos){
    const tabla = document.getElementById("tablaVehiculos");
    tabla.innerHTML = "";

    if (vehiculos.length == 0) {
        tabla.innerHTML = '<tr><td colspan="5" class="detalle">Todavía no hay vehículos.</td></tr>';
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        const vehiculo = vehiculos[i];

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td></td><td></td><td></td><td></td>
            <td><button type="button" class="boton boton-secundario boton-pequeno">Borrar</button></td>
        `;
        const celdas = fila.querySelectorAll("td");
        celdas[0].textContent = vehiculo.matricula;
        celdas[1].textContent = vehiculo.marca + " " + vehiculo.modelo;
        celdas[2].textContent = vehiculo.anio ? vehiculo.anio : "-";
        celdas[3].textContent = vehiculo.cliente;

        fila.querySelector("button").addEventListener("click", (event) => {
            borrarVehiculo(vehiculo);
        });

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

    peticion("insertarVehiculo", vehiculo, (response) => {
        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            document.getElementById("formVehiculo").reset();
            listarVehiculos();
            listarClientes(); //para que se actualice el numero de vehiculos del cliente
        } else {
            mostrarMensaje(response.msg, "error");
        }
    });
}


function borrarVehiculo(vehiculo){
    //confirm enseña una ventana con Aceptar y Cancelar y devuelve true o false
    let seguro = confirm("¿Seguro que quieres borrar el " + vehiculo.marca + " " + vehiculo.modelo + " (" + vehiculo.matricula + ") de " + vehiculo.cliente + "?");
    if (!seguro) {
        return;
    }

    peticion("borrarVehiculo", { matricula: vehiculo.matricula }, (response) => {
        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            listarVehiculos();
            listarClientes();
        } else {
            mostrarMensaje(response.msg, "error");
        }
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
