# RQF16 — Filtro de Feed (Siguiendo vs. Para ti)

El requerimiento **RQF16** introduce la capacidad de segmentar el muro de publicaciones principal según la red de seguimiento del usuario autenticado.

## 📌 Descripción General
Para mitigar el ruido de información en la plataforma y brindar una experiencia más curada, se proporcionan dos vistas principales en la cabecera del feed:
1. **Para ti**: Muestra todas las publicaciones públicas de la plataforma (excluyendo aquellas con borrado lógico `is_deleted = TRUE`).
2. **Siguiendo**: Filtra dinámicamente el contenido para mostrar únicamente las publicaciones creadas por los usuarios a los que el usuario actual sigue activamente.

---

## 🏗️ Arquitectura de la Solución

### 1. Interfaz de Usuario (Frontend)
- **Componente**: Pestañas de navegación (`<div class="feed-tabs">`).
- **Comportamiento**:
  - Al hacer clic en **"Siguiendo"**, el sistema valida en el almacenamiento local (`localStorage`) la existencia de una sesión válida (`nikonet_userId`).
  - **Sin sesión**: Redirige de forma automática e inmediata a la página de autenticación (`login.html`).
  - **Con sesión**: Añade los parámetros `filter=following` y `user_id=<ID>` a las peticiones dirigidas a la API.
- **Estados Vacíos**: Implementa un diseño amigable diferenciado para notificar al usuario cuando su red de seguidos aún no ha publicado contenido.

### 2. Capa de Servicios y Base de Datos (Backend)
- **Endpoint**: `GET /posts`
- **Parámetros Soportados**:
  - `order` (Opcional, por defecto `desc`): Criterio cronológico.
  - `date` (Opcional): Filtrado exacto por fecha en zona horaria local.
  - `filter` (Opcional): Si es igual a `following`, activa la subconsulta de filtrado.
  - `user_id` (Requerido si `filter=following`): Identificador del usuario solicitante.
- **Consulta SQL Parametrizada**:
  Se utiliza inyección segura de parámetros mediante índices calculados dinámicamente (`$${values.length}`) para asegurar su interoperabilidad con el resto de filtros:
  ```sql
  SELECT p.id, p.content, p.author_id, p.created_at, u.display_name, u.username, ...
  FROM posts p
  JOIN users u ON p.author_id = u.id
  WHERE p.is_deleted = FALSE 
    AND p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $X)
  ORDER BY p.created_at DESC;
  ```

---

## 🔒 Consideraciones de Seguridad
- **Validación Estricta**: El backend rechaza peticiones con `filter=following` que carezcan de un `user_id` válido, previniendo accesos anómalos o malformados.
- **Prevención de Inyección SQL**: Todas las subconsultas y filtros utilizan paso directo de valores de cliente al driver `pg` de Node.js, aislando completamente las cadenas SQL de la entrada del usuario.
