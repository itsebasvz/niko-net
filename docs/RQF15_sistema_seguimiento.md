# RQF15 — Sistema de Seguimiento (Follow/Unfollow)

## Descripción
Un usuario autenticado puede seguir o dejar de seguir a otros usuarios desde su perfil. El estado del seguimiento se refleja en tiempo real en el botón de la vista de perfil ajeno y en los conteos de seguidores/siguiendo.

---

## Arquitectura

```
[perfil-ajeno.js]
  ├── GET /users/:username/is-following   → verifica estado al cargar
  ├── POST /users/:username/follow        → toggle follow/unfollow
  └── GET /users/:username/profile        → recarga conteos tras acción
```

---

## Base de datos

**Tabla:** `follows` (`backend/sql/001_schema.sql`)

```sql
CREATE TABLE follows (
    follower_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_auto_follow CHECK (follower_id <> following_id)
);
```

| Restricción | Efecto |
|---|---|
| PK compuesta | Previene follows duplicados |
| `CHECK` constraint | Impide que un usuario se siga a sí mismo |
| `ON DELETE CASCADE` | Limpia follows al eliminar un usuario |

---

## Endpoints

### `GET /users/:username/is-following`

Verifica si el usuario actual sigue al dueño del perfil.

**Query params:**
- `follower_id` (requerido) — ID del usuario que consulta

**Query SQL:**
```sql
SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2
```

**Respuesta:**
```json
{ "success": true, "is_following": true }
```

---

### `POST /users/:username/follow`

Toggle: si ya sigue → elimina la relación; si no sigue → la crea.

**Body:**
```json
{ "follower_id": 1 }
```

**Lógica:**
1. Busca `id` del target por `username` → 404 si no existe
2. Valida `follower_id !== target_id` → 400 si son iguales
3. Consulta si existe la relación en `follows`
4. Si existe → `DELETE` → responde `{ "action": "unfollowed" }`
5. Si no existe → `INSERT` → responde `{ "action": "followed" }`

**Respuesta:**
```json
{ "success": true, "action": "followed" }
```

---

### `GET /users/:username/profile`

Retorna datos del perfil incluyendo conteos calculados en tiempo real.

**Query SQL relevante:**
```sql
SELECT COUNT(*) FROM follows WHERE following_id = $1  -- seguidores
SELECT COUNT(*) FROM follows WHERE follower_id  = $1  -- siguiendo
```

**Respuesta (fragmento):**
```json
{
  "success": true,
  "user": {
    "username": "maria_dev",
    "followers_count": 3,
    "following_count": 1
  }
}
```

---

## Frontend (`frontend/js/perfil-ajeno.js`)

### Al cargar la página
1. `verificarFollow()` (L.120) — GET a `is-following` con `follower_id` del `localStorage`
2. `actualizarBotonFollow(isFollowing)` (L.135) — pinta botón según estado:
   - `true` → clase `btn-secondary`, texto "Siguiendo"
   - `false` → clase `btn-primary`, texto "Seguir"

### Al hacer click en el botón
```javascript
// perfil-ajeno.js L.158
const resp = await fetch(`http://localhost:4000/users/${targetUsername}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ follower_id: myUserId })
});
```
- Lee `data.action` → actualiza botón
- Llama `cargarPerfil()` → refresca conteos en pantalla

### Estado en localStorage
| Key | Uso |
|---|---|
| `nikonet_userId` | `follower_id` en todas las llamadas |
| `nikonet_username` | Identifica si se está viendo perfil propio |

> Si no hay sesión activa, el click redirige a `login.html` antes de hacer fetch.

---

## Archivos modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `backend/sql/001_schema.sql` | MODIFICADO | Tabla `follows` con constraints |
| `backend/src/server.js` | MODIFICADO | 3 endpoints: is-following, follow toggle, profile |
| `frontend/js/perfil-ajeno.js` | MODIFICADO | Botón seguir conectado al backend, conteos en tiempo real |

---

## Cómo verificar (Definition of Done)

### Prerrequisitos
1. `docker compose up -d`
2. `cd backend && npm run dev` (puerto 4000)
3. Frontend servido (`npx serve frontend` o Live Server)

### Pasos
1. Iniciar sesión con usuario A
2. Navegar al perfil de usuario B
3. Verificar que el botón muestra "Seguir" (estado inicial)
4. Click en "Seguir" → botón cambia a "Siguiendo", contador de seguidores de B aumenta en 1
5. Click en "Siguiendo" → botón vuelve a "Seguir", contador disminuye en 1
6. Recargar la página → estado del botón persiste correctamente
7. Verificar en DB: `SELECT * FROM follows WHERE follower_id = <id_A>;`
8. Intentar seguirse a sí mismo (navegar al propio perfil) → botón no debe aparecer
