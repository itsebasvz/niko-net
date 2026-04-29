require('dotenv').config(); //Carga las variables de entorno
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[SERVER] Niko-net Backend corriendo en http://localhost:${PORT}`);
});
