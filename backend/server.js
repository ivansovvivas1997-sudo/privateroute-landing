require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // evita el error SSL que da Windows al preferir IPv6

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // máximo 5MB por foto
});

function subirACloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'privateroute' },
            (error, resultado) => {
                if (error) reject(error);
                else resolve(resultado);
            }
        );
        stream.end(buffer);
    });
}

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

        if (!nombre || !correo || !contrasena) {
            return res.status(400).send('Faltan datos obligatorios (nombre, correo o contraseña).');
        }

        if (contrasena.length < 8) {
            return res.status(400).send('La contraseña debe tener al menos 8 caracteres.');
        }

        if (!mayorDeEdad) {
            return res.status(400).send('Debes confirmar que eres mayor de 18 años para registrarte.');
        }

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

app.get('/creadores', async (req, res) => {
    try {
        const creadores = await db.collection('usuarios')
            .find({ tipo: 'creador' })
            .project({ contrasena: 0 })
            .toArray();

        res.json(creadores);
    } catch (error) {
        console.error('Error al obtener creadores:', error);
        res.status(500).send('Error al obtener los creadores.');
    }
});

app.get('/creadores/:id', async (req, res) => {
    try {
        const creador = await db.collection('usuarios').findOne(
            { _id: new ObjectId(req.params.id), tipo: 'creador' },
            { projection: { contrasena: 0 } }
        );

        if (!creador) {
            return res.status(404).send('Creador no encontrado.');
        }

        res.json(creador);
    } catch (error) {
        console.error('Error al obtener creador:', error);
        res.status(500).send('Error al obtener el creador.');
    }
});

app.get('/perfil/:correo', async (req, res) => {
    try {
        const creador = await db.collection('usuarios').findOne(
            { correo: req.params.correo, tipo: 'creador' },
            { projection: { contrasena: 0 } }
        );

        if (!creador) {
            return res.status(404).send('Creador no encontrado.');
        }

        res.json(creador);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).send('Error al obtener el perfil.');
    }
});

app.put('/perfil', async (req, res) => {
    try {
        const { correo, categoria, descripcion } = req.body;

        if (!correo) {
            return res.status(400).send('Falta el correo del usuario.');
        }

        const resultado = await db.collection('usuarios').updateOne(
            { correo, tipo: 'creador' },
            { $set: { categoria, descripcion } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).send('No se encontró el creador.');
        }

        res.send('Perfil actualizado correctamente.');
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).send('Error al actualizar el perfil.');
    }
});

app.post('/contenido', upload.single('imagen'), async (req, res) => {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).send('Falta el correo del creador.');
        }
        if (!req.file) {
            return res.status(400).send('No se recibió ninguna imagen.');
        }

        const creador = await db.collection('usuarios').findOne({ correo, tipo: 'creador' });
        if (!creador) {
            return res.status(404).send('Creador no encontrado.');
        }

        const resultado = await subirACloudinary(req.file.buffer);

        const nuevoContenido = {
            correoCreador: correo,
            url: resultado.secure_url,
            fecha: new Date()
        };

        await db.collection('contenido').insertOne(nuevoContenido);
        res.send('¡Contenido subido correctamente!');
    } catch (error) {
        console.error('Error al subir contenido:', error);
        res.status(500).send('Error al subir el contenido.');
    }
});

app.get('/contenido/:correo', async (req, res) => {
    try {
        const contenido = await db.collection('contenido')
            .find({ correoCreador: req.params.correo })
            .sort({ fecha: -1 })
            .toArray();

        res.json(contenido);
    } catch (error) {
        console.error('Error al obtener contenido:', error);
        res.status(500).send('Error al obtener el contenido.');
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

        res.json({
            nombre: usuario.nombre,
            tipo: usuario.tipo,
            correo: usuario.correo
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).send('Error al iniciar sesión.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});