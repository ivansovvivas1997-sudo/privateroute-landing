// Si abres la página con Live Server (en tu computadora), habla con tu backend local.
// Si la abres desde GitHub Pages, habla con el backend de Render.
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://privateroute-backend.onrender.com';

document.getElementById('formulario-login').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const datos = {
        correo: document.getElementById('correo').value,
        contrasena: document.getElementById('contrasena').value
    };

    fetch(`${API}/login`, {
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
        localStorage.setItem('tokenUsuario', datosUsuario.token);
        localStorage.setItem('nombreUsuario', datosUsuario.nombre);
        localStorage.setItem('tipoUsuario', datosUsuario.tipo);
        localStorage.removeItem('correoUsuario');
        window.location.href = 'panel.html';
    })
    .catch(error => {
        alert(error.message || 'Correo o contraseña incorrectos.');
        console.error(error);
    });
});