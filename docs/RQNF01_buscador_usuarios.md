# RQNF01 — Buscador de usuarios

## Descripción
El usuario puede buscar a otros usuarios a través del buscador ubicado en el right rail de la aplicación.

## Cambios realizados

### Backend
- **Endpoint `GET /users/search?q=...&exclude_id=...`**: Busca usuarios por `username` o `display_name` usando `ILIKE` de PostgreSQL. Excluye al usuario actual si se proporciona `exclude_id`. Mínimo 2 caracteres para activar la búsqueda. Máximo 10 resultados.

### Frontend
- **Input de búsqueda activado** en `inicio.html` y `perfil-ajeno.html` (antes estaba `disabled`).
- **Dropdown de resultados**: Aparece debajo del input mostrando avatar, nombre y @handle de cada usuario encontrado. Click en un resultado navega al perfil.
- **Debounce de 300ms**: Evita peticiones excesivas al backend mientras el usuario escribe.
- **Comportamiento UX**: Se cierra al hacer click fuera, se reabre al enfocar el input si hay texto.

### Archivos modificados
| Archivo | Acción | Descripción |
|---|---|---|
| `backend/src/server.js` | MODIFICADO | Endpoint de búsqueda de usuarios |
| `frontend/inicio.html` | MODIFICADO | Input activado + contenedor de resultados |
| `frontend/perfil-ajeno.html` | MODIFICADO | Input activado + contenedor de resultados |
| `frontend/js/inicio.js` | MODIFICADO | Lógica de búsqueda con debounce |
| `frontend/js/perfil-ajeno.js` | MODIFICADO | Lógica de búsqueda con debounce |
| `frontend/css/base.css` | MODIFICADO | Estilos del dropdown de resultados |
