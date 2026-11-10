const url = "../backend/sw/auth_sw.php";

const formRegistro = document.getElementById("formRegistro");

const buttonCrear = document.getElementById("crear");
//al boton le añadimos un escuchador tipo click
// El evento "click" se activa en el momento que se hace click en el boton Crear cuenta y llama a la funcion registro()
buttonCrear.addEventListener("click", (event) => {
    registro();
});


//A cada una de las propiedades del objeto se le asigna un valor
// que es el que se obtiene de la casilla del form correspondiente
function registro(){
    let cliente = {};
    cliente.dni = document.getElementById("dni").value.trim();
    cliente.telefono = document.getElementById("telefono").value.trim();
    cliente.nombre = document.getElementById("nombre").value.trim();
    cliente.calle = document.getElementById("calle").value.trim();
    cliente.numero = document.getElementById("numero").value.trim();
    cliente.cp = document.getElementById("cp").value.trim();
    cliente.localidad = document.getElementById("localidad").value.trim();
    cliente.email = document.getElementById("email").value.trim();
    cliente.password = document.getElementById("password").value;

    //si falta algun campo obligatorio no se envia nada
    if (cliente.dni == "" || cliente.nombre == "" || cliente.email == "" || cliente.password == "") {
        mostrarMensaje("Rellena todos los campos obligatorios", "error");
        return;
    }

    let request = {}; // objeto request que se enviará al backend
    request.action = "registro";
    request.data = cliente;

    fetch(url, { // enviamos la petición al backend
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
            mostrarMensaje(response.msg + ". Ya puedes iniciar sesión", "exito");
            formRegistro.reset();
            //a los 2 segundos lo mandamos al login
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            mostrarMensaje(response.msg, "error");
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        mostrarMensaje("No se ha podido conectar con el servidor", "error");
    });
}


//enseña un mensaje en el div de mensaje (en vez de un alert). tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto", "mensaje-error", "mensaje-exito");
    mensaje.classList.add("mensaje-" + tipo);
}
