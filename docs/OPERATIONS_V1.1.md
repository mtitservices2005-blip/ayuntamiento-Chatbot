# Operación y staging de V1.1

## Hosting y cabeceras requeridas

El hosting aprobado debe aplicar HTTPS, redirección a HTTPS, CSP restrictiva, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, permisos de geolocalización mínimos y protección de caché para páginas autenticadas. La CSP debe permitir únicamente el dominio de la aplicación, Supabase autorizado y el CDN fijado o, preferiblemente, un bundle propio.

## Observabilidad y soporte

- Registrar errores con identificador de correlación, ambiente y operación, sin secretos, contraseñas, fotos, coordenadas completas ni contenido de tickets.
- Alertar sobre fallos de migración, denegaciones anómalas, cola de integraciones y errores de carga de evidencia.
- Documentar responsables, ventanas de cambio, copia de seguridad y restauración antes de staging.

## Checklist de staging

1. Proyecto Supabase de staging separado y sin claves de producción.
2. Migraciones revisadas y aplicadas en orden.
3. Buckets privados creados manualmente y políticas verificadas.
4. Matriz de seguridad aprobada con usuarios sintéticos.
5. Dominio, CSP, HTTPS y monitoreo validados.
6. Revisión humana de retención, privacidad y plan de reversión.

No existe autorización para desplegar ni realizar este checklist contra staging o producción durante esta misión.
