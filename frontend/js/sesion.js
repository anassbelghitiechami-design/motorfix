//Este archivo lo cargan todas las paginas que necesitan login (cliente.html, oficina.html...)
//En cada pagina se llama a comprobarSesion() con el rol que puede entrar, por ejemplo:
//  <script src="js/sesion.js"></script>
//  <script>comprobarSesion("cliente");</script>

const urlAuth = "../backend/sw/auth_sw.php";


//pregunta al servidor quien ha hecho login. Si no hay nadie o no tiene el rol de la pagina, vuelve al login
function comprobarSesion(rolPagina){
    let request = {};
    request.action = "sesion";

    fetch(urlAuth, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        if (!data.success || data.data.rol != rolPagina) {
            window.location.href = "login.html";
        } else {
            //si la pagina tiene un sitio para el nombre, lo ponemos
            const nombre = document.getElementById("nombreUsuario");
            if (nombre) {
                nombre.textContent = data.data.nombre;
            }
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        window.location.href = "login.html";
    });
}


//cierra la sesion en el servidor y vuelve al login
function cerrarSesion(){
    let request = {};
    request.action = "logout";

    fetch(urlAuth, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        window.location.href = "login.html";
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
    });
}


//si la pagina tiene el enlace de Salir, al pulsarlo cerramos la sesion
const salir = document.getElementById("salir");
if (salir) {
    salir.addEventListener("click", (event) => {
        event.preventDefault(); //para que no vaya al login sin cerrar la sesion
        cerrarSesion();
    });
}
