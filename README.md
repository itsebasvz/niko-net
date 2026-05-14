# niko-net

**niko-net** es una plataforma de interacción social basada en microblogging, diseñada específicamente para la comunicación técnica y asíncrona. 

Inspirada en redes como X, Threads y Bluesky, la aplicación busca resolver la dispersión de información técnica creando un ecosistema donde la brevedad obliga a la claridad. Es el espacio ideal para exponer ideas, compartir soluciones y resolver dudas de programación.

### ¿Para quién es?
Está orientada a toda la comunidad tecnológica:
- **Perfil Primario:** Estudiantes de ingeniería, desarrolladores autodidactas y profesionales junior.
- **Perfil Secundario:** Reclutadores técnicos, profesionales senior (mentoring) y entusiastas del software libre.
- **Acceso Abierto:** ¡Cualquier persona apasionada por el desarrollo de software es bienvenida!

## Tecnologías
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js, Express, JWT
- **Base de Datos**: PostgreSQL (ejecutada mediante Docker)

## Requisitos Previos
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) y Docker Compose
- [Git](https://git-scm.com/)

## Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/itsebasvz/niko-net.git
cd niko-net
```

### 2. Levantar la base de datos (Docker)
Asegúrate de que Docker Desktop esté corriendo:
```bash
docker compose up -d
```

Si es la **primera vez** que levantas el proyecto, el contenedor ejecutará automáticamente los scripts SQL de `backend/sql/`. Si necesitas **reiniciar la BD desde cero** (schema + datos de prueba):
```bash
docker exec -i nikonet_db psql -U postgres -d nikonet < backend/sql/001_schema.sql
docker exec -i nikonet_db psql -U postgres -d nikonet < backend/sql/002_seed.sql
```

### 3. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 4. Configurar variables de entorno
Crea un archivo `.env` en la carpeta `backend` (o cópialo del ejemplo):
```bash
cp .env.example .env
```

Las variables necesarias son:
```
PORT=4000
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=nikonet
JWT_SECRET=super_secret_jwt_key_123
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_123
```

### 5. Levantar el backend
```bash
npm run dev
```
El servidor correrá en **http://localhost:4000**.

### 6. Levantar el frontend
Desde la raíz del proyecto:
```bash
cd ..
npx serve frontend
```
El frontend se servirá en **http://localhost:3000**.

### 7. ¡Listo!
Abre http://localhost:3000 en tu navegador. Puedes registrar un usuario nuevo o usar los del seed:
- `sebas@test.com` / `password123`

## Documentación
- [Modelo relacional de la BD](docs/modelo_relacional.md)
- [RQF10 — Visualización de post](docs/RQF10_visualizacion_post.md)
- [RQF14 — Módulo de comentarios](docs/RQF14_modulo_comentarios.md)

## Licencia
MIT
