# RQF14 — Módulo de comentarios

## Descripción
El usuario puede escribir comentarios en las publicaciones de otras personas.

## Cambios realizados

### Backend: Endpoints de comentarios
Se añadieron dos endpoints REST al servidor:

- **`POST /posts/:id/comments`** — Crear un comentario en un post
  - Valida que el contenido no esté vacío y no supere 500 caracteres
  - Verifica que el post existe y no fue eliminado (soft delete)
  - Retorna el comentario creado con su ID y timestamp

- **`GET /posts/:id/comments`** — Obtener todos los comentarios de un post
  - JOIN con tabla `users` para obtener `display_name` y `username` del autor
  - Filtra comentarios eliminados (`is_deleted = FALSE`)
  - Ordenados cronológicamente (ASC) para lectura natural

### Frontend: Sección de comentarios en modal de post
Al abrir un post en el modal overlay, se muestra una sección de comentarios debajo del contenido del post:

- **Formulario de comentario**: textarea con placeholder "Escribe un comentario…", botón circular de envío (ícono Lucide `send`), avatar del usuario actual
- **Lista de comentarios**: cada comentario muestra avatar con gradiente de marca, nombre, @handle en mono, timestamp relativo, y contenido
- **Interacciones**: Enter envía el comentario (Shift+Enter para nueva línea), el botón se deshabilita si el textarea está vacío
- **Estado vacío**: si no hay comentarios, muestra "Sé el primero en comentar ✨"

### Archivos modificados/creados
| Archivo | Acción | Descripción |
|---|---|---|
| `backend/src/server.js` | MODIFICADO | Endpoints POST y GET para comentarios |
| `frontend/js/inicio.js` | MODIFICADO | Lógica de carga, envío y renderizado de comentarios en el modal |
| `frontend/css/base.css` | MODIFICADO | Estilos de la sección de comentarios, formulario, lista y estados vacíos |

## Cómo verificar (Definition of Done)

### Prerrequisitos
1. Docker corriendo (`docker compose up -d`)
2. Backend corriendo (`cd backend && npm run dev`) — puerto 4000
3. Frontend servido (`npx serve frontend`)

### Pasos de verificación
1. Iniciar sesión en la app
2. Crear un post (o usar uno existente)
3. Click en el post para abrir el modal
4. Verificar que aparece la sección "COMENTARIOS" debajo del contenido
5. Verificar que aparece "Sé el primero en comentar ✨" si no hay comentarios
6. Escribir un comentario en el textarea → click en botón de envío (o Enter)
7. Verificar que el comentario aparece en la lista con avatar, nombre, @handle y timestamp
8. Escribir otro comentario → verificar que se añade en orden cronológico
9. Cerrar el modal, volver a abrir → verificar que los comentarios persisten
10. Verificar que otro usuario puede comentar en el mismo post
