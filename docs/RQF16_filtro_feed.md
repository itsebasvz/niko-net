# RQF16 — Filtro de Feed (Siguiendo vs. Para ti) y Sub-filtro de Cuentas (v2)

El requerimiento **RQF16** introduce la capacidad de segmentar el muro de publicaciones principal según la red de seguimiento del usuario autenticado, evolucionando en su **v2** para permitir una inspección granular y específica de cada creador seguido.

## 📌 Descripción General
Para mitigar el ruido de información en la plataforma y brindar una experiencia más curada, se proporcionan dos niveles de filtrado en el feed:
1. **Pestañas Generales**:
   - **Para ti**: Muestra todas las publicaciones públicas de la plataforma (excluyendo aquellas con borrado lógico `is_deleted = TRUE`).
   - **Siguiendo**: Filtra dinámicamente el contenido para mostrar únicamente las publicaciones creadas por los usuarios a los que el usuario actual sigue activamente.
2. **Sub-filtro de Cuentas Seguidas (v2)**:
   - Al activar la pestaña **Siguiendo**, se despliega automáticamente un menú secundario con las cuentas a las que el usuario sigue, permitiendo aislar el muro para visualizar en tiempo real únicamente los posts de un creador en particular o de todos en conjunto.

---

## 🏗️ Arquitectura de la Solución

### 1. Interfaz de Usuario (Frontend)
- **Componentes**: 
  - Pestañas de navegación (`<div class="feed-tabs">`).
  - Menú secundario desplegable (`<div id="followingUserFilter">`).
- **Comportamiento**:
  - Al hacer clic en **"Siguiendo"**, se valida en `localStorage` la existencia de una sesión (`nikonet_userId`).
  - **Sin sesión**: Redirige de forma automática a `login.html`.
  - **Con sesión**: 
    - Activa la pestaña y solicita al backend la lista de cuentas seguidas mediante el endpoint `GET /users/:userId/following-list`.
    - Renderiza dinámicamente cada cuenta en el menú desplegable secundario.
    - Permite al usuario seleccionar una cuenta para inyectar el parámetro `specific_author_id` en las subsiguientes llamadas a la API de posts.
- **Estados Vacíos**: Implementa un diseño amigable diferenciado para notificar al usuario cuando su red de seguidos aún no ha publicado contenido.

### 2. Capa de Servicios y Base de Datos (Backend)
- **Endpoint de Lista de Seguidos**: `GET /users/:user_id/following-list`
  - Retorna un listado en formato JSON con `id`, `username` y `display_name` de los usuarios seguidos, ordenado alfabéticamente para facilitar su localización en la interfaz.
- **Endpoint de Posts**: `GET /posts`
  - **Parámetros Soportados**:
    - `order` (Opcional, por defecto `desc`).
    - `date` (Opcional): Filtrado por fecha en zona horaria local.
    - `filter` (Opcional): Activa el filtrado de red de seguimiento si es igual a `following`.
    - `user_id` (Requerido si `filter=following`).
    - `specific_author_id` (Opcional, **v2**): Sobrescribe el filtro masivo para buscar un autor exacto.
  - **Consulta SQL Dinámica y Parametrizada**:
    ```sql
    -- Caso A: Viendo todos los seguidos
    AND p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $X)
    
    -- Caso B (v2): Viendo un creador específico seleccionado del sub-filtro
    AND p.author_id = $Y
    ```

---

## 🔒 Consideraciones de Seguridad
- **Validación Estricta**: El backend rechaza peticiones con `filter=following` que carezcan de un `user_id` válido, previniendo accesos anómalos o malformados.
- **Prevención de Inyección SQL**: Todas las subconsultas y filtros inyectan de forma calculada y segura los índices `$${values.length}` pasados directamente al driver de PostgreSQL en Node.js.
