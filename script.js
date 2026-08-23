const botonExplorar = document.querySelector('.btn-explorar');

botonExplorar.addEventListener('click', function() {
    document.querySelector('.creadores').scrollIntoView({ behavior: 'smooth' });
});