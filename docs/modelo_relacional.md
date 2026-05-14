# Base de Datos — Modelo Relacional

El modelo de datos relacional almacena la información central de los usuarios, sus publicaciones, interacciones y sesiones activas.

## Relaciones entre tablas

| Tabla | Se relaciona con | Tipo | Descripción |
|---|---|---|---|
| USERS | POSTS | 1 a muchos | Un usuario puede escribir muchas publicaciones |
| USERS | COMMENTS | 1 a muchos | Un usuario puede escribir muchos comentarios |
| USERS | FOLLOWS | 1 a muchos | Un usuario puede seguir a muchos otros |
| USERS | LIKES | 1 a muchos | Un usuario puede dar like a muchos posts |
| USERS | REFRESH_TOKENS | 1 a muchos | Un usuario puede tener varios tokens de sesión |
| POSTS | COMMENTS | 1 a muchos | Un post puede recibir muchos comentarios |
| POSTS | LIKES | 1 a muchos | Un post puede recibir muchos likes |

## Notas

- Se implementa **soft delete** (borrado lógico a través de un flag `is_deleted`) en publicaciones y comentarios para preservar el historial sin perder referencias en la base de datos.
- El schema completo se encuentra en `backend/sql/001_schema.sql`.
- Los datos de prueba (seed) están en `backend/sql/002_seed.sql`.

→ [Documentación técnica completa](database.md)
