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

### RQF10: Previsualización de post antes de publicar
- Al redactar un post en el composer, el usuario puede hacer click en el **botón circular de ojo** (ícono Lucide `eye`) ubicado junto al botón "Postear".
- Al hacer click, se abre un **modal de previsualización** animado (fade + pop-in) que muestra **exactamente cómo se verá el post en el feed**, incluyendo:
  - Avatar con gradiente de marca
  - Nombre y @username del autor en fuente mono
  - Contenido completo tal como se publicará
  - Timestamp simulado ("ahora")
  - Íconos de acciones (responder, repostear, like) en estado inactivo
- El modal presenta dos opciones en el footer:
  - **"Seguir editando"**: cierra el modal y devuelve el foco al textarea del composer para que el usuario continúe editando.
  - **"Publicar"**: publica el post directamente desde la previsualización.
- El modal también se cierra con: botón ×, click fuera del modal, o tecla Escape.

### Visualización de post publicado
- Los posts en el feed se **truncan a 140 caracteres** con un enlace "Ver más" en estilo mono amarillo.
- Al hacer **click en cualquier parte del post**, se abre un **modal overlay** con el contenido completo, fecha formateada y datos del autor.

### Archivos modificados/creados
| Archivo | Acción | Descripción |
|---|---|---|
| `frontend/css/tokens.css` | NUEVO | Tokens del design system (colores, tipografía, espaciado, shadows, glows, motion) |
| `frontend/css/base.css` | MODIFICADO | Reescritura completa con estilos del design system, incluyendo `.btn-preview` y `.preview-card` |
| `frontend/assets/` | NUEVO | Carpeta con assets de marca (niko-logo.png, niko-bulb.png, niko-character.png) |
| `frontend/index.html` | MODIFICADO | Landing page con hero Niko-net |
| `frontend/login.html` | MODIFICADO | Auth card con design system |
| `frontend/registro.html` | MODIFICADO | Auth card con design system |
| `frontend/inicio.html` | MODIFICADO | Layout 3 columnas, composer con botón de preview, dos modales (preview + post completo) |
| `frontend/js/inicio.js` | MODIFICADO | Composer con preview, truncado, timestamps relativos, dos modales |
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
   - Escribir un post en el composer → Verificar que aparecen el botón de ojo y "Postear"
   - **Click en el botón de ojo** → Verificar que se abre el modal de previsualización con el post tal como se verá en el feed
   - Click en "Seguir editando" → Verificar que regresa al composer con el texto intacto
   - Click en el botón de ojo de nuevo → Click en "Publicar" → Verificar que el post se publica
   - Crear un post largo (>140 chars) → Verificar truncado con "Ver más" en el feed
   - Click en el post publicado → Verificar que el modal muestra el contenido completo
   - Cerrar modal con ×, click fuera, o Escape
5. Verificar tipografía: Outfit (headers), Manrope (body), JetBrains Mono (@handles, timestamps)
6. Verificar paleta: fondo purple `#1a0e2e`, CTAs amarillos `#f3c43b`, glows en hover

### Resultado esperado
- Flujo completo funcional: registro → login → feed → previsualizar → publicar → ver post completo
- Identidad visual fiel al Niko-net Design System
