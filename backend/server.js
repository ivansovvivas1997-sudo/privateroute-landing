require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // evita el error SSL que da Windows al preferir IPv6

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);
let db;

async function conectarMongo() {
    try {
        await client.connect();
        db = client.db('privateroute');
        console.log('✅ Conectado a MongoDB correctamente');
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error);
    }
}

conectarMongo();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('¡El servidor de PrivateRoute está funcionando!');
});

app.post('/registro', async (req, res) => {
    try {
        const { nombre, correo, contrasena, tipo, mayorDeEdad, categoria, descripcion } = req.body;

        // Validación: campos obligatorios
        if (!nombre || !correo || !contrasena) {
            return res.status(400).send('Faltan datos obligatorios (nombre, correo o contraseña).');
        }

        // Validación: contraseña mínima
        if (contrasena.length < 8) {
            return res.status(400).send('La contraseña debe tener al menos 8 caracteres.');
        }

        // Validación: confirmación de mayoría de edad
        if (!mayorDeEdad) {
            return res.status(400).send('Debes confirmar que eres mayor de 18 años para registrarte.');
        }

        // Validación: correo no repetido
        const usuarioExistente = await db.collection('usuarios').findOne({ correo });
        if (usuarioExistente) {
            return res.status(409).send('Ya existe una cuenta registrada con ese correo.');
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = {
            nombre,
            correo,
            contrasena: contrasenaEncriptada,
            tipo,
            categoria: tipo === 'creador' ? (categoria || 'Otro') : null,
            descripcion: tipo === 'creador' ? (descripcion || '') : null,
            fechaRegistro: new Date()
        };

        const resultado = await db.collection('usuarios').insertOne(nuevoUsuario);
        console.log('Usuario guardado con ID:', resultado.insertedId);
        res.send('¡Cuenta creada y guardada correctamente!');
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        res.status(500).send('Error al guardar el registro.');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const usuario = await db.collection('usuarios').findOne({ correo });

        if (!usuario) {
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(401).send('Correo o contraseña incorrectos.');
        }

        // Ahora devolvemos un JSON con nombre y tipo, en vez de solo texto,
        // para que el panel sepa si mostrar la vista de Fan o de Creador.
        res.json({
            nombre: usuario.nombre,
            tipo: usuario.tipo
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).send('Error al iniciar sesión.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});