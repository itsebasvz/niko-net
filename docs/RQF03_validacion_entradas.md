# Documentación de Tarea: RQF03 - Validación de Entradas

## Resumen
Se implementó un middleware general en el backend para validar que un usuario exista en la base de datos (PostgreSQL) antes de permitir que una petición HTTP prosiga. Esta tarea cumple con la **Definition of Done (DoD)** establecida para el Sprint.

## Archivos Modificados/Creados
- **`backend/src/middleware.js`** (Nuevo): Contiene la lógica principal de la base de datos.
- **`backend/src/app.js`** (Modificado): Integra el middleware y crea una ruta de prueba.

## Criterios de Aceptación (Verificación)
Para reproducir y verificar que la tarea está lista para la "Review", sigue estos pasos en tu terminal local:

1. **Asegurar Base de Datos:**
   ```bash
   docker compose up -d
   ```
2. **Levantar el Servidor:**
   ```bash
   cd backend
   npm run dev
   ```
3. **Prueba de Funcionalidad Básica Pasó (DoD):**
   - **Caso Exitoso:** `curl http://localhost:3000/api/v1/users/sebas`
     - *Esperado:* Retorna status HTTP 200 y el JSON del usuario validado.
   - **Caso de Error:** `curl http://localhost:3000/api/v1/users/x`
     - *Esperado:* Retorna status HTTP 404 indicando que no existe.
