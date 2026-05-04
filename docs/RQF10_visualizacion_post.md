# RQF10 — Visualización de post

## Descripción
El software muestra una previsualización en el feed que se puede abrir para ver la publicación completa.

## Cambios realizados

### Identidad visual (Niko-net Design System)
Se rediseñaron las **4 páginas** del frontend para aplicar fielmente el sistema de diseño de Niko-net:
- **Landing (`index.html`)**: Hero page con fondo degradado purple, ilustración de Niko, pixel-sparkles decorativos, y CTAs hacia login/registro.
- **Login (`login.html`)**: Auth card centrada sobre hero background con sparkles, campos `.field`, botón amarillo primario, y feedback inline de errores.
- **Registro (`registro.html`)**: Auth card con todos los campos (username, email, password, display_name, bio), feedback visual, y redirección a login.
- **Feed (`inicio.html`)**: Layout de 3 columnas (nav rail + feed + right rail), composer con contador de caracteres, posts con avatares de gradiente.

### RQF10: Visualización de post completo
- Los posts en el feed se **truncan a 140 caracteres** con un enlace "Ver más" en estilo mono amarillo.
- Al hacer **click en cualquier parte del post** (o en "Ver más"), se abre un **modal overlay** animado (fade + pop-in) con:
  - Avatar y nombre del autor
  - @username en fuente mono
  - Contenido completo sin truncar
  - Fecha formateada en español (ej. "lunes, 4 de mayo de 2026, 02:41 p.m.")
- El modal se cierra con: botón ×, click fuera del modal, o tecla Escape.

### Archivos modificados/creados
| Archivo | Acción | Descripción |
|---|---|---|
| `frontend/css/tokens.css` | NUEVO | Tokens del design system (colores, tipografía, espaciado, shadows, glows, motion) |
| `frontend/css/base.css` | MODIFICADO | Reescritura completa con estilos del design system |
| `frontend/assets/` | NUEVO | Carpeta con assets de marca (niko-logo.png, niko-bulb.png, niko-character.png) |
| `frontend/index.html` | MODIFICADO | Landing page con hero Niko-net |
| `frontend/login.html` | MODIFICADO | Auth card con design system |
| `frontend/registro.html` | MODIFICADO | Auth card con design system |
| `frontend/inicio.html` | MODIFICADO | Layout 3 columnas + modal overlay RQF10 |
| `frontend/js/inicio.js` | MODIFICADO | Composer, truncado, timestamps relativos, modal overlay |
| `frontend/js/login.js` | MODIFICADO | Feedback visual inline, guarda username/displayName |
| `frontend/js/registro.js` | MODIFICADO | Feedback visual inline, sin alerts |
| `frontend/js/auth-check.js` | NUEVO | Reemplazo de auth-chech.js (typo corregido), redirección silenciosa |
| `backend/src/server.js` | MODIFICADO | Login retorna username y display_name |
| `.gitignore` | MODIFICADO | Añadido Design System y archivos de contexto IA |

## Cómo verificar (Definition of Done)

### Prerrequisitos
1. Docker corriendo (`docker compose up -d`)
2. Backend corriendo (`cd backend && npm run dev`) — puerto 4000
3. Frontend servido (`npx serve frontend`) — cualquier puerto disponible

### Pasos de verificación
1. Abrir `index.html` → Verificar hero purple con ilustración de Niko y sparkles
2. Ir a `registro.html` → Registrar un usuario → Verificar mensaje verde de éxito y redirección
3. Ir a `login.html` → Iniciar sesión → Verificar redirección a `inicio.html`
4. En `inicio.html`:
   - Verificar layout de 3 columnas (nav rail, feed, right rail)
   - Crear un post largo (>140 chars) → Verificar truncado con "Ver más"
   - Click en el post → Verificar que el modal overlay muestra el contenido completo
   - Cerrar modal con ×, click fuera, o Escape
5. Verificar tipografía: Outfit (headers), Manrope (body), JetBrains Mono (@handles, timestamps)
6. Verificar paleta: fondo purple `#1a0e2e`, CTAs amarillos `#f3c43b`, glows en hover

### Resultado esperado
- Flujo completo funcional: registro → login → feed → publicar → ver post completo
- Identidad visual fiel al Niko-net Design System
