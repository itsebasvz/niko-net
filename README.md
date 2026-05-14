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

## Base de Datos

El modelo de datos relacional almacena la información central de los usuarios, sus publicaciones, interacciones y sesiones activas.

| Tabla | Se relaciona con | Tipo | Descripción |
|---|---|---|---|
| USERS | POSTS | 1 a muchos | Un usuario puede escribir muchas publicaciones |
| USERS | COMMENTS | 1 a muchos | Un usuario puede escribir muchos comentarios |
| USERS | FOLLOWS | 1 a muchos | Un usuario puede seguir a muchos otros |
| USERS | LIKES | 1 a muchos | Un usuario puede dar like a muchos posts |
| USERS | REFRESH_TOKENS | 1 a muchos | Un usuario puede tener varios tokens de sesión |
| POSTS | COMMENTS | 1 a muchos | Un post puede recibir muchos comentarios |
| POSTS | LIKES | 1 a muchos | Un post puede recibir muchos likes |

*Nota: Se implementa **soft delete** (borrado lógico a través de un flag `is_deleted`) en publicaciones y comentarios para preservar el historial sin perder referencias en la base de datos.*

→ [Documentación técnica completa](docs/database.md)

## Requisitos Previos
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) y Docker Compose

## Instalación y Ejecución Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/itsebasvz/niko-net.git
   cd niko-net
   ```

2. **Levantar la base de datos**
   Asegúrate de que Docker esté corriendo y ejecuta:
   ```bash
   docker compose up -d
   ```
   *Esto iniciará PostgreSQL y automáticamente creará las tablas base y un seed de prueba (usuarios y posts)*

3. **Configurar el Backend**
   ```bash
   cd backend
   npm install
   ```
   Crea un archivo `.env` en la carpeta `backend` guiándote del `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Correr el servidor Backend**
   ```bash
   npm run dev
   ```
   El servidor de API correrá en `http://localhost:3000`

5. **Levantar el Frontend**
   Puedes abrir `frontend/index.html` directamente en tu navegador, o usar la extensión *Live Server* de VS Code (puerto típico: 5500).

## Licencia
MIT
