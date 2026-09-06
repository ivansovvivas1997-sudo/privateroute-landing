// Leemos el ID del creador desde la URL (ej: perfil.html?id=abc123)
const parametros = new URLSearchParams(window.location.search);
const idCreador = parametros.get('id');
const contenedorPerfil = document.getElementById('perfil-creador');

// Si ya hay una sesión activa, cambiamos el nav igual que en las demás páginas
const nombreUsuario = localStorage.getItem('nombreUsuario');

if (nombreUsuario) {
    const navLogin = document.getElementById('nav-login');
    const navRegistro = document.getElementById('nav-registro');

    navLogin.textContent = 'Mi panel';
    navLogin.href = 'panel.html';

    navRegistro.textContent = 'Cerrar sesión';
    navRegistro.href = '#';
    navRegistro.addEventListener('click', function(evento) {
        evento.preventDefault();
        localStorage.removeItem('nombreUsuario');
        localStorage.removeItem('tipoUsuario');
        window.location.reload();
    });
}

if (!idCreador) {
    contenedorPerfil.innerHTML = '<p class="cargando-creadores">No se especificó ningún creador.</p>';
} else {
    fetch(`https://privateroute-backend.onrender.com/creadores/${idCreador}`)
        .then(async respuesta => {
            if (!respuesta.ok) {
                throw new Error('No se pudo encontrar este creador.');
            }
            return respuesta.json();
        })
        .then(creador => {
            const inicial = creador.nombre ? creador.nombre.charAt(0).toUpperCase() : '?';
            const descripcion = creador.descripcion || 'Este creador todavía no agregó una descripción.';

            document.title = `${creador.nombre} - PrivateRoute`;

            contenedorPerfil.innerHTML = `
                <div class="portada-perfil"></div>
                <div class="avatar-perfil">${inicial}</div>
                <h1>${creador.nombre}</h1>
                <p class="categoria-perfil">${creador.categoria || 'Sin categoría'}</p>
                <p class="bio-perfil">${descripcion}</p>
                <button class="btn-suscribir" id="btn-suscribir-perfil">Suscribirse</button>
                <p class="nota-perfil">Los pagos y suscripciones todavía no están disponibles — ¡muy pronto!</p>
            `;

            document.getElementById('btn-suscribir-perfil').addEventListener('click', function() {
                alert('Las suscripciones todavía no están disponibles. ¡Pronto vamos a habilitar los pagos!');
            });
        })
        .catch(error => {
            contenedorPerfil.innerHTML = '<p class="cargando-creadores">No se pudo cargar este perfil. Puede que el creador ya no exista.</p>';
            console.error(error);
        });
}