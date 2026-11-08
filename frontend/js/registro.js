const url = "../backend/sw/auth_sw.php";

const formRegistro = document.getElementById("formRegistro");
//al formulario le añadimos un escuchador tipo submit
// El evento "submit" se activa cuando se pulsa el boton Crear cuenta y llama a la funcion registro()
formRegistro.addEventListener("submit", (event) => {
    event.preventDefault(); //para que el formulario no recargue la pagina
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
    let password2 = document.getElementById("password2").value;

    //antes de enviar nada comprobamos los campos
    if (!validarCampos(cliente, password2)) {
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


//comprueba que los campos obligatorios estan rellenos y que las contraseñas coinciden
function validarCampos(cliente, password2){
    const errorPassword = document.getElementById("errorPassword");
    errorPassword.classList.add("oculto");
    document.getElementById("password2").parentElement.classList.remove("campo-error");

    if (cliente.dni == "" || cliente.telefono == "" || cliente.nombre == "" || cliente.email == "" || cliente.password == "") {
        mostrarMensaje("Rellena todos los campos obligatorios", "error");
        return false;
    }

    //DNI: 8 numeros y una letra
    if (!/^[0-9]{8}[A-Za-z]$/.test(cliente.dni)) {
        mostrarMensaje("El DNI tiene que tener 8 números y una letra", "error");
        return false;
    }

    if (!cliente.email.includes("@")) {
        mostrarMensaje("El email no es válido", "error");
        return false;
    }

    if (cliente.password != password2) {
        errorPassword.classList.remove("oculto");
        document.getElementById("password2").parentElement.classList.add("campo-error");
        mostrarMensaje("Las contraseñas no coinciden", "error");
        return false;
    }

    return true;
}


//enseña un mensaje en el div de mensaje (en vez de un alert). tipo puede ser "error" o "exito"
function mostrarMensaje(texto, tipo){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto", "mensaje-error", "mensaje-exito");
    mensaje.classList.add("mensaje-" + tipo);
}
