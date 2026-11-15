//Panel del cliente: sus vehiculos y sus citas
//Se carga en cliente.html despues de sesion.js

const urlVehiculo = "../backend/sw/vehiculo_sw.php";
const urlCita = "../backend/sw/cita_sw.php";

//matricula del vehiculo que se esta editando. Si es null, el formulario es para añadir uno nuevo
let matriculaEditando = null;

//al abrir la pagina pedimos los vehiculos y las citas del cliente
listarVehiculos();
listarCitas();

//la fecha de la cita no puede ser anterior a hoy (toISOString da 2026-11-14T..., nos quedamos con la fecha)
document.getElementById("fecha").min = new Date().toISOString().substring(0, 10);

//al boton Solicitar cita le añadimos un escuchador tipo click
const buttonSolicitar = document.getElementById("solicitarCita");
buttonSolicitar.addEventListener("click", (event) => {
    solicitarCita();
});

//al pulsar "+ Añadir vehículo" dejamos el formulario vacio (el enlace ya lo muestra al ir a #nuevoVehiculo)
const enlaceAnadir = document.getElementById("anadirVehiculo");
enlaceAnadir.addEventListener("click", (event) => {
    prepararFormulario(null);
});

//al boton Guardar vehículo le añadimos un escuchador tipo click
const buttonGuardarVehiculo = document.getElementById("guardarVehiculo");
buttonGuardarVehiculo.addEventListener("click", (event) => {
    guardarVehiculo();
});


//pide al servidor los vehiculos del cliente que ha hecho login y los pinta
function listarVehiculos(){
    let request = {};
    request.action = "listar";

    fetch(urlVehiculo, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        if (data.success) {
            pintarVehiculos(data.data);
        } else {
            mostrarMensaje(data.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//crea una tarjeta por cada vehiculo dentro de #listaVehiculos
function pintarVehiculos(vehiculos){
    const lista = document.getElementById("listaVehiculos");
    lista.innerHTML = ""; //borramos lo que hubiera antes

    //el desplegable del formulario de cita tiene los mismos vehiculos
    rellenarSelectVehiculos(vehiculos);

    if (vehiculos.length == 0) {
        lista.innerHTML = '<p class="detalle">Todavía no tienes vehículos. Añade uno para poder pedir cita.</p>';
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        const vehiculo = vehiculos[i];

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta vehiculo";
        tarjeta.innerHTML = `
            <div class="vehiculo-cabecera">
                <span class="matricula"></span>
            </div>
            <div>
                <p class="vehiculo-nombre"></p>
                <p class="detalle"></p>
            </div>
            <div class="vehiculo-acciones">
                <a href="#pedir" class="boton">Pedir cita</a>
                <button type="button" class="boton-cuadrado boton-editar" aria-label="Editar vehículo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
                </button>
                <button type="button" class="boton-cuadrado boton-borrar" aria-label="Borrar vehículo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"></path></svg>
                </button>
            </div>
        `;

        //los datos se ponen con textContent para que no se interpreten como HTML
        tarjeta.querySelector(".matricula").textContent = vehiculo.matricula;
        tarjeta.querySelector(".vehiculo-nombre").textContent = vehiculo.marca + " " + vehiculo.modelo;
        tarjeta.querySelector(".detalle").textContent = vehiculo.anio ? vehiculo.anio : "Año sin indicar";

        //al pulsar "Pedir cita" se deja elegido este vehiculo en el formulario de cita
        tarjeta.querySelector(".boton").addEventListener("click", (event) => {
            document.getElementById("vehiculoCita").value = vehiculo.matricula;
        });

        //al pulsar el lapiz se rellena el formulario con este vehiculo y se muestra
        tarjeta.querySelector(".boton-editar").addEventListener("click", (event) => {
            prepararFormulario(vehiculo);
            location.href = "#nuevoVehiculo";
        });

        //al pulsar la papelera se borra el vehiculo (preguntando antes)
        tarjeta.querySelector(".boton-borrar").addEventListener("click", (event) => {
            borrarVehiculo(vehiculo);
        });

        lista.appendChild(tarjeta);
    }
}


//deja el formulario listo para añadir (vehiculo = null) o para editar el vehiculo que se le pasa
function prepararFormulario(vehiculo){
    const titulo = document.getElementById("tituloFormVehiculo");
    const matricula = document.getElementById("matricula");

    if (vehiculo == null) {
        matriculaEditando = null;
        titulo.textContent = "Añadir vehículo";
        document.getElementById("nuevoVehiculo").reset();
        matricula.disabled = false;
    } else {
        matriculaEditando = vehiculo.matricula;
        titulo.textContent = "Editar vehículo";
        matricula.value = vehiculo.matricula;
        matricula.disabled = true; //la matricula es la clave, no se puede cambiar
        document.getElementById("marca").value = vehiculo.marca;
        document.getElementById("modelo").value = vehiculo.modelo;
        document.getElementById("anio").value = vehiculo.anio ? vehiculo.anio : "";
    }
}


//envia el formulario: si se esta editando un vehiculo hace "editar" y si no "insertar"
function guardarVehiculo(){
    let vehiculo = {};
    vehiculo.matricula = document.getElementById("matricula").value.trim();
    vehiculo.marca = document.getElementById("marca").value.trim();
    vehiculo.modelo = document.getElementById("modelo").value.trim();
    vehiculo.anio = document.getElementById("anio").value;

    if (vehiculo.matricula == "" || vehiculo.marca == "" || vehiculo.modelo == "") {
        mostrarMensaje("Rellena la matrícula, la marca y el modelo", "error");
        return;
    }

    let request = {};
    if (matriculaEditando == null) {
        request.action = "insertar";
    } else {
        request.action = "editar";
        vehiculo.matricula = matriculaEditando;
    }
    request.data = vehiculo;

    fetch(urlVehiculo, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then((res) => res.json())
    .then((response) => {
        console.log("Success:", response);

        if (response.success) {
            prepararFormulario(null);
            location.href = "#vehiculos"; //al quitar #nuevoVehiculo el formulario se esconde
            mostrarMensaje(response.msg, "exito");
            listarVehiculos(); //volvemos a pedir la lista para que salga el cambio
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//pide confirmacion y si el usuario acepta borra el vehiculo
function borrarVehiculo(vehiculo){
    //confirm enseña una ventana con Aceptar y Cancelar y devuelve true o false
    let seguro = confirm("¿Seguro que quieres borrar el " + vehiculo.marca + " " + vehiculo.modelo + " (" + vehiculo.matricula + ")?");
    if (!seguro) {
        return;
    }

    let request = {};
    request.action = "borrar";
    request.data = {
        matricula: vehiculo.matricula
    };

    fetch(urlVehiculo, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then((res) => res.json())
    .then((response) => {
        console.log("Success:", response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            listarVehiculos();
        } else {
            mostrarMensaje(response.msg, "error"); //por ejemplo si el vehiculo tiene citas
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//pone una opcion en el desplegable de la cita por cada vehiculo
function rellenarSelectVehiculos(vehiculos){
    const select = document.getElementById("vehiculoCita");
    select.innerHTML = "";

    for (let i = 0; i < vehiculos.length; i++) {
        const opcion = document.createElement("option");
        opcion.value = vehiculos[i].matricula;
        opcion.textContent = vehiculos[i].matricula + " · " + vehiculos[i].marca + " " + vehiculos[i].modelo;
        select.appendChild(opcion);
    }
}


//pide al servidor las citas del cliente y las pinta
function listarCitas(){
    let request = {};
    request.action = "listar";

    fetch(urlCita, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        if (data.success) {
            pintarCitas(data.data);
        } else {
            mostrarMensaje(data.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//crea una fila por cada cita en #listaCitas con su fecha, su vehiculo y su estado
function pintarCitas(citas){
    const lista = document.getElementById("listaCitas");
    lista.innerHTML = "";

    //textos que se enseñan para cada estado de la BD
    const textosEstado = {
        pendiente: "Pendiente",
        confirmada: "Confirmada",
        rechazada: "Rechazada",
        en_curso: "En el taller",
        finalizada: "Finalizada"
    };
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    //la reparacion en curso solo se enseña si hay alguna cita en_curso
    document.getElementById("reparacion").classList.add("oculto");

    if (citas.length == 0) {
        lista.innerHTML = '<li class="fila"><p class="detalle">Todavía no has pedido ninguna cita.</p></li>';
        return;
    }

    for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        //fecha_hora viene como "2026-10-28 09:30:00"
        const partes = cita.fecha_hora.split(" ");
        const fecha = partes[0].split("-");      //["2026", "10", "28"]
        const hora = partes[1].substring(0, 5);  //"09:30"

        const fila = document.createElement("li");
        fila.className = "fila";
        fila.innerHTML = `
            <p class="fecha-cita"><span class="dia"></span> <span class="mes"></span></p>
            <div class="fila-texto">
                <p class="fila-titulo"></p>
                <p class="detalle"></p>
            </div>
            <span class="estado"></span>
        `;

        fila.querySelector(".dia").textContent = fecha[2];
        fila.querySelector(".mes").textContent = meses[parseInt(fecha[1]) - 1];
        //si el cliente escribio un motivo se enseña ese, si no el tipo de servicio
        fila.querySelector(".fila-titulo").textContent = cita.motivo ? cita.motivo : cita.tipo_servicio;
        fila.querySelector(".detalle").textContent = cita.marca + " " + cita.modelo + " · " + cita.tipo_servicio + " · " + hora;

        const estado = fila.querySelector(".estado");
        estado.textContent = textosEstado[cita.estado];
        estado.classList.add("estado-" + cita.estado);

        lista.appendChild(fila);

        if (cita.estado == "en_curso") {
            pintarReparacion(cita, fecha);
        }
    }
}


//rellena el recuadro de "Reparación en curso" con la cita que esta en el taller
function pintarReparacion(cita, fecha){
    document.getElementById("tituloReparacion").textContent = cita.marca + " " + cita.modelo + " · " + cita.matricula;
    document.getElementById("detalleReparacion").textContent = cita.tipo_servicio + " · Entrada " + fecha[2] + "/" + fecha[1] + "/" + fecha[0];
    document.getElementById("reparacion").classList.remove("oculto");
}


//envia la solicitud de cita previa
function solicitarCita(){
    let cita = {};
    cita.matricula = document.getElementById("vehiculoCita").value;
    cita.fecha = document.getElementById("fecha").value;
    cita.hora = document.getElementById("hora").value;
    //de los radio buttons cogemos el que esta marcado
    cita.tipo_servicio = document.querySelector('input[name="tipo_servicio"]:checked').value;
    cita.motivo = document.getElementById("motivo").value.trim();

    if (cita.matricula == "") {
        mostrarMensaje("Primero añade un vehículo para poder pedir cita", "error");
        return;
    }

    if (cita.fecha == "" || cita.hora == "") {
        mostrarMensaje("Elige la fecha y la hora de la cita", "error");
        return;
    }

    let request = {};
    request.action = "solicitar";
    request.data = cita;

    fetch(urlCita, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then((res) => res.json())
    .then((response) => {
        console.log("Success:", response);

        if (response.success) {
            mostrarMensaje(response.msg, "exito");
            document.getElementById("formCita").reset();
            listarCitas(); //para que salga la nueva cita en la lista
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
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
