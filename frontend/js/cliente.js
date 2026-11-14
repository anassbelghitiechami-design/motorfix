//Panel del cliente: sus vehiculos y sus citas
//Se carga en cliente.html despues de sesion.js

const urlVehiculo = "../backend/sw/vehiculo_sw.php";

//al abrir la pagina pedimos los vehiculos del cliente
listarVehiculos();


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
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
    });
}


//crea una tarjeta por cada vehiculo dentro de #listaVehiculos
function pintarVehiculos(vehiculos){
    const lista = document.getElementById("listaVehiculos");
    lista.innerHTML = ""; //borramos lo que hubiera antes

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

        lista.appendChild(tarjeta);
    }
}
