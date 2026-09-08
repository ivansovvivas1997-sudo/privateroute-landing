const nombreUsuario = localStorage.getItem('nombreUsuario');
const tipoUsuario = localStorage.getItem('tipoUsuario');
const correoUsuario = localStorage.getItem('correoUsuario');

if (!nombreUsuario) {
    window.location.href = 'login.html';
} else {
    document.getElementById('saludo-usuario').textContent = `Hola, ${nombreUsuario} 👋`;

    if (tipoUsuario === 'creador') {
        document.getElementById('subtitulo-panel').textContent = 'Este es tu espacio para gestionar tu contenido.';
        document.getElementById('panel-creador').style.display = 'block';

        // Traemos los datos actuales del creador para precargar el formulario de edición
        fetch(`https://privateroute-backend.onrender.com/perfil/${encodeURIComponent(correoUsuario)}`)
            .then(respuesta => respuesta.json())
            .then(creador => {
                document.getElementById('categoria-editar').value = creador.categoria || 'Otro';
                document.getElementById('descripcion-editar').value = creador.descripcion || '';
            })
            .catch(error => console.error('No se pudo cargar el perfil actual:', error));

        document.getElementById('formulario-editar-perfil').addEventListener('submit', function(evento) {
            evento.preventDefault();

            const datos = {
                correo: correoUsuario,
                categoria: document.getElementById('categoria-editar').value,
                descripcion: document.getElementById('descripcion-editar').value
            };

            fetch('https://privateroute-backend.onrender.com/perfil', {
                method: 'PUT',
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
            })
            .catch(error => {
                alert(error.message || 'Error al guardar los cambios.');
                console.error(error);
            });
        });
    } else {
        document.getElementById('subtitulo-panel').textContent = 'Explorá y disfrutá de contenido exclusivo.';
        document.getElementById('panel-fan').style.display = 'block';
    }
}

document.getElementById('btn-cerrar-sesion').addEventListener('click', function() {
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('tipoUsuario');
    localStorage.removeItem('correoUsuario');
    window.location.href = 'index.html';
});