document.getElementById('formulario-login').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const datos = {
        correo: document.getElementById('correo').value,
        contrasena: document.getElementById('contrasena').value
    };

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(async respuesta => {
        if (!respuesta.ok) {
            const mensajeError = await respuesta.text();
            throw new Error(mensajeError);
        }
        return respuesta.json();
    })
    .then(datosUsuario => {
        localStorage.setItem('nombreUsuario', datosUsuario.nombre);
        localStorage.setItem('tipoUsuario', datosUsuario.tipo);
        window.location.href = 'panel.html';
    })
    .catch(error => {
        alert(error.message || 'Correo o contraseña incorrectos.');
        console.error(error);
    });
});