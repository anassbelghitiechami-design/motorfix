const url = "../backend/sw/auth_sw.php";

const formLogin = document.getElementById("formLogin");
//al formulario le añadimos un escuchador tipo submit
// El evento "submit" se activa cuando se pulsa el boton Entrar y llama a la funcion login()
formLogin.addEventListener("submit", (event) => {
    event.preventDefault(); //para que el formulario no recargue la pagina
    login();
});


function login(){
    console.log("Pulsado botón entrar");

    let request = {};
    request.action = "login";
    request.data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    fetch(url, {
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
            //segun el rol del usuario lo mandamos a su panel
            if (data.data.rol == "cliente") {
                window.location.href = "cliente.html";
            } else if (data.data.rol == "oficina") {
                window.location.href = "oficina.html";
            } else if (data.data.rol == "mecanico") {
                window.location.href = "mecanico.html";
            } else if (data.data.rol == "admin") {
                window.location.href = "admin.html";
            }
        } else {
            mostrarMensaje(data.msg);
        }
    })
    .catch(function (error) {
        console.log("Hubo un problema con la peticion fetch:" + error.message);
        mostrarMensaje("No se ha podido conectar con el servidor");
    });
}


//enseña el msg del servidor en el div de mensaje (en vez de un alert)
function mostrarMensaje(texto){
    const mensaje = document.getElementById("mensaje");
    mensaje.textContent = texto;
    mensaje.classList.remove("oculto");
}
