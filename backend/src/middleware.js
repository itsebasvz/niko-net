// Importamos la configuración de la base de datos para poder ejecutar consultas SQL
const db = require('./config/db');

// Definimos el middleware como una función asíncrona que recibe req (petición), res (respuesta) y next (continuar)
const verifyUserExists = async (req, res, next) => {
    // Usamos un bloque try-catch para capturar y manejar cualquier error inesperado
    try {
        // Extraemos el 'username' desde los parámetros de la URL (req.params) o del cuerpo JSON (req.body)
        const username = req.params.username || req.body.username;

        // Si el cliente no proporcionó ningún username, detenemos la petición
        if (!username) {
            // Retornamos un status 400 (Bad Request) con un mensaje de error en JSON
            return res.status(400).json({ 
                error: 'Falta el nombre de usuario para validar.' 
            });
        }

        // Ejecutamos una consulta SQL parametrizada ($1) para evitar inyecciones SQL
        // Buscamos únicamente el 'id' del usuario cuyo 'username' coincida con el proporcionado
        const result = await db.query(
            'SELECT id FROM users WHERE username = $1', 
            [username] // Pasamos el valor dinámico de username
        );

        // Verificamos si la consulta no devolvió ninguna fila (el usuario no existe)
        if (result.rows.length === 0) {
            // Retornamos un status 404 (Not Found) indicando que el usuario no fue hallado
            return res.status(404).json({ 
                error: `El usuario '${username}' no existe.` 
            });
        }

        // Si el usuario sí existe, tomamos su 'id' de la base de datos y lo guardamos en el objeto req
        // Esto permite que las siguientes funciones en la cadena tengan acceso rápido al ID del usuario
        req.userId = result.rows[0].id;
        
        // Llamamos a next() para indicarle a Express que puede pasar al siguiente middleware o controlador
        next();

    } catch (error) {
        // Si ocurre un fallo en la base de datos o error de código, lo imprimimos en consola
        console.error('Error al verificar usuario:', error);
        // Devolvemos al cliente un status 500 (Internal Server Error) genérico para no exponer detalles
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Exportamos la función para que pueda ser requerida (require) y usada en otros archivos como app.js
module.exports = {
    verifyUserExists
};
