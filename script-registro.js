document.getElementById('formulario-registro').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const datos = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        contrasena: document.getElementById('contrasena').value,
        tipo: document.getElementById('tipo').value,
        mayorDeEdad: document.getElementById('edad').checked
    };

    fetch('https://privateroute-backend.onrender.com/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(async respuesta => {
        const mensaje = await respuesta.text();
        if (!respuesta.ok) {
            throw new Error(mensaje);
        }
        return mensaje;
    })
    .then(mensaje => {
        alert(mensaje);
        window.location.href = 'login.html';
    })
    .catch(error => {
        alert(error.message || 'Error al conectar con el servidor. ¿Está corriendo?');
        console.error(error);
    });
});