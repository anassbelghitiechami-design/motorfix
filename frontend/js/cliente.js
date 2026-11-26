//Panel del cliente: sus vehiculos y sus citas
//Se carga en cliente.html despues de sesion.js

const urlVehiculo = "../backend/sw/vehiculo_sw.php";
const urlCita = "../backend/sw/cita_sw.php";
const urlFactura = "../backend/sw/factura_sw.php";

//matricula del vehiculo que se esta editando. Si es null, el formulario es para añadir uno nuevo
let matriculaEditando = null;

//al abrir la pagina pedimos los vehiculos, las citas y las facturas del cliente
listarVehiculos();
listarCitas();
listarFacturas();

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
//Como no sabemos cuantos coches tiene el cliente, cada etiqueta se crea con createElement,
//se le pone el dato con textContent (asi no se ejecuta como HTML) y se mete en la pagina con appendChild.
//Son metodos del DOM, igual que getElementById (https://es.wikipedia.org/wiki/Document_Object_Model)
function pintarVehiculos(vehiculos){
    const lista = document.getElementById("listaVehiculos");
    lista.textContent = ""; //borramos lo que hubiera antes (dejar el texto vacio quita todo lo de dentro)

    //el desplegable del formulario de cita tiene los mismos vehiculos
    rellenarSelectVehiculos(vehiculos);

    if (vehiculos.length == 0) {
        const aviso = document.createElement("p");
        aviso.className = "detalle";
        aviso.textContent = "Todavía no tienes vehículos. Añade uno para poder pedir cita.";
        lista.appendChild(aviso);
        return;
    }

    for (let i = 0; i < vehiculos.length; i++) {
        const vehiculo = vehiculos[i];

        //la tarjeta: <article class="tarjeta vehiculo">
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta vehiculo";

        //cabecera con la matricula: <div class="vehiculo-cabecera"><span class="matricula">1234ABC</span></div>
        const cabecera = document.createElement("div");
        cabecera.className = "vehiculo-cabecera";
        const matricula = document.createElement("span");
        matricula.className = "matricula";
        matricula.textContent = vehiculo.matricula;
        cabecera.appendChild(matricula);
        tarjeta.appendChild(cabecera);

        //marca, modelo y año
        const datos = document.createElement("div");
        const nombre = document.createElement("p");
        nombre.className = "vehiculo-nombre";
        nombre.textContent = vehiculo.marca + " " + vehiculo.modelo;
        datos.appendChild(nombre);
        const anio = document.createElement("p");
        anio.className = "detalle";
        anio.textContent = vehiculo.anio ? vehiculo.anio : "Año sin indicar";
        datos.appendChild(anio);
        tarjeta.appendChild(datos);

        //los botones de la tarjeta
        const acciones = document.createElement("div");
        acciones.className = "vehiculo-acciones";

        //al pulsar "Pedir cita" se deja elegido este vehiculo en el formulario de cita
        const pedir = document.createElement("a");
        pedir.href = "#pedir";
        pedir.className = "boton";
        pedir.textContent = "Pedir cita";
        pedir.addEventListener("click", (event) => {
            document.getElementById("vehiculoCita").value = vehiculo.matricula;
        });
        acciones.appendChild(pedir);

        //al pulsar el lapiz se rellena el formulario con este vehiculo y se muestra
        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "boton-cuadrado boton-editar";
        editar.textContent = "✎";
        editar.title = "Editar vehículo";
        editar.addEventListener("click", (event) => {
            prepararFormulario(vehiculo);
            location.href = "#nuevoVehiculo";
        });
        acciones.appendChild(editar);

        //al pulsar la X se borra el vehiculo (preguntando antes)
        const borrar = document.createElement("button");
        borrar.type = "button";
        borrar.className = "boton-cuadrado boton-borrar";
        borrar.textContent = "✕";
        borrar.title = "Borrar vehículo";
        borrar.addEventListener("click", (event) => {
            borrarVehiculo(vehiculo);
        });
        acciones.appendChild(borrar);

        tarjeta.appendChild(acciones);

        //y por ultimo metemos la tarjeta en la lista para que se vea
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
    select.textContent = ""; //quitamos las opciones que hubiera

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
    lista.textContent = "";

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
        lista.appendChild(crearFilaVacia("Todavía no has pedido ninguna cita."));
        return;
    }

    for (let i = 0; i < citas.length; i++) {
        const cita = citas[i];

        //fecha_hora viene como "2026-10-28 09:30:00"
        const partes = cita.fecha_hora.split(" ");
        const fecha = partes[0].split("-");      //["2026", "10", "28"]
        const hora = partes[1].substring(0, 5);  //"09:30"

        //cada etiqueta se crea con createElement, se rellena con textContent y se mete con appendChild
        const fila = document.createElement("li");
        fila.className = "fila";

        //la fecha a la izquierda: <p class="fecha-cita"><span class="dia">28</span> <span class="mes">oct</span></p>
        const fechaCita = document.createElement("p");
        fechaCita.className = "fecha-cita";
        const dia = document.createElement("span");
        dia.className = "dia";
        dia.textContent = fecha[2];
        fechaCita.appendChild(dia);
        const mes = document.createElement("span");
        mes.className = "mes";
        mes.textContent = meses[parseInt(fecha[1]) - 1];
        fechaCita.appendChild(mes);
        fila.appendChild(fechaCita);

        //el texto del medio
        const texto = document.createElement("div");
        texto.className = "fila-texto";
        const titulo = document.createElement("p");
        titulo.className = "fila-titulo";
        //si el cliente escribio un motivo se enseña ese, si no el tipo de servicio
        titulo.textContent = cita.motivo ? cita.motivo : cita.tipo_servicio;
        texto.appendChild(titulo);
        const detalle = document.createElement("p");
        detalle.className = "detalle";
        detalle.textContent = cita.marca + " " + cita.modelo + " · " + cita.tipo_servicio + " · " + hora;
        texto.appendChild(detalle);
        fila.appendChild(texto);

        //la etiqueta del estado a la derecha (la clase estado-xxx le da el color)
        const estado = document.createElement("span");
        estado.className = "estado estado-" + cita.estado;
        estado.textContent = textosEstado[cita.estado];
        fila.appendChild(estado);

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
    //de los radio buttons cogemos el que esta marcado: getElementsByName da todos los que se llaman tipo_servicio
    //y con un for miramos cual tiene checked a true
    const radios = document.getElementsByName("tipo_servicio");
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            cita.tipo_servicio = radios[i].value;
        }
    }
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


//pide al servidor las facturas del cliente y las pinta
function listarFacturas(){
    let request = {};
    request.action = "listarCliente";

    fetch(urlFactura, {
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
            pintarFacturas(data.data);
        } else {
            mostrarMensaje(data.msg, "error");
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//una fila por factura con el vehiculo, la fecha, el desglose (base + IVA) y el total
function pintarFacturas(facturas){
    const lista = document.getElementById("listaFacturas");
    lista.textContent = "";

    if (facturas.length == 0) {
        lista.appendChild(crearFilaVacia("Todavía no tienes facturas."));
        return;
    }

    for (let i = 0; i < facturas.length; i++) {
        const factura = facturas[i];

        //la fecha viene como "2026-11-22"
        const fecha = factura.fecha.split("-");

        const fila = document.createElement("li");
        fila.className = "fila";

        const texto = document.createElement("div");
        texto.className = "fila-texto";

        const titulo = document.createElement("p");
        titulo.className = "fila-titulo";
        titulo.textContent = "Factura " + factura.numero;
        texto.appendChild(titulo);

        const detalle = document.createElement("p");
        detalle.className = "detalle";
        detalle.textContent = factura.marca + " " + factura.modelo + " · " + factura.tipo_servicio + " · " + fecha[2] + "/" + fecha[1] + "/" + fecha[0];
        texto.appendChild(detalle);

        const desglose = document.createElement("p");
        desglose.className = "detalle desglose";
        desglose.textContent = "Base " + formatearEuros(factura.base_imponible) + " + IVA " + Number(factura.iva_pct) + "% " + formatearEuros(factura.cuota_iva);
        texto.appendChild(desglose);

        fila.appendChild(texto);

        const total = document.createElement("p");
        total.className = "total";
        total.textContent = formatearEuros(factura.total);
        fila.appendChild(total);

        lista.appendChild(fila);
    }
}


//crea la fila <li class="fila"><p class="detalle">texto</p></li> que sale cuando una lista esta vacia
function crearFilaVacia(texto){
    const fila = document.createElement("li");
    fila.className = "fila";
    const aviso = document.createElement("p");
    aviso.className = "detalle";
    aviso.textContent = texto;
    fila.appendChild(aviso);
    return fila;
}


//93.4 -> "93,40 €" (toFixed deja 2 decimales y cambiamos el punto por coma)
function formatearEuros(numero){
    return Number(numero).toFixed(2).replace(".", ",") + " €";
}


//enseña el msg del servidor en el div de mensaje (en vez de un alert). tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto", "mensaje-error", "mensaje-exito");
    mensaje.classList.add("mensaje-" + tipo);
}
