// Si abres la página con Live Server (en tu computadora), habla con tu backend local.
// Si la abres desde GitHub Pages, habla con el backend de Render.
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:3000'
    : 'https://privateroute-backend.onrender.com';

const selectTipo = document.getElementById('tipo');
const camposCreador = document.getElementById('campos-creador');

selectTipo.addEventListener('change', function() {
    if (selectTipo.value === 'creador') {
        camposCreador.style.display = 'flex';
    } else {
        camposCreador.style.display = 'none';
    }
});

document.getElementById('formulario-registro').addEventListener('submit', function(evento) {
    evento.preventDefault();

    const datos = {
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        contrasena: document.getElementById('contrasena').value,
        tipo: document.getElementById('tipo').value,
        mayorDeEdad: document.getElementById('edad').checked,
        categoria: document.getElementById('categoria').value,
        descripcion: document.getElementById('descripcion').value
    };

    fetch(`${API}/registro`, {
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