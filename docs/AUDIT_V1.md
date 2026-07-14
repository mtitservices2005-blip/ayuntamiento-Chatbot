# Auditoría V1 — Chatbot Municipal

Fecha: 2026-07-14  
Alcance: todos los archivos del repositorio en `saibot/v1.1`. Revisión estática; no se consultó ni modificó Supabase remoto.

## Resultado ejecutivo

La V1 es una demo funcional de flujo ciudadano, gestión administrativa y brigada, pero no es apta para operación real ni multiinstitución. Los controles de acceso, tenant y transiciones están en el navegador y no existe autenticación. La seguridad efectiva depende por completo de políticas remotas de Supabase que no están versionadas ni pueden verificarse desde este repositorio.

## Hallazgos críticos

### C-01 — Panel administrativo sin autenticación ni autorización

- Evidencia: `admin.html` carga y actualiza tickets/brigadas directamente (líneas 964–2304) sin iniciar sesión ni verificar rol.
- Impacto: cualquier persona que conozca la URL puede intentar leer, asignar, aprobar o devolver tickets, según las políticas remotas.
- Recomendación: implementar Auth, perfiles/roles y RLS de denegación por defecto; mover acciones sensibles a RPC/servicio autorizado.

### C-02 — Portal de brigada con identidad fija y suplantable

- Evidencia: `brigada.html:413` fija `BRIGADA_ID_PRUEBA = 2`; no hay autenticación.
- Impacto: un visitante opera como la brigada de prueba y puede iniciar/completar sus tickets si RLS no lo bloquea.
- Recomendación: derivar institución, usuario y brigada desde sesión validada del lado de datos; eliminar identificadores de prueba antes de operación.

### C-03 — Aislamiento municipal solo en filtros manipulables de cliente

- Evidencia: las tres páginas envían/filtran `municipio_id = 1` (por ejemplo `index.html:623`, `admin.html:971`, `brigada.html:426`).
- Impacto: no existe garantía de aislamiento multiinstitución; una petición directa puede omitir o alterar el filtro si RLS no lo impide.
- Recomendación: usar `institution_id` obligatorio, RLS por membresía y validación en funciones de servidor.

### C-04 — Riesgo de XSS almacenado en paneles internos

- Evidencia: valores de tickets y brigadas procedentes de Supabase se interpolan con `innerHTML` y atributos `onclick` en `admin.html:1528–1740` y `brigada.html:548–714`.
- Impacto: texto o rutas maliciosas almacenadas pueden ejecutar JavaScript en sesiones administrativas/de brigada.
- Recomendación: renderizar con `textContent`/DOM seguro, eliminar eventos inline y validar/codificar toda salida.

## Hallazgos altos

### A-01 — Configuración de Supabase pública y repetida

- Evidencia: URL y clave pública de Supabase están embebidas en `index.html:345–354`, `admin.html:925–933` y `brigada.html:393–401`.
- Impacto: la clave pública por sí sola no es un secreto privilegiado, pero expone el proyecto al cliente y hace que una RLS/bucket permisiva sea explotable. La repetición complica rotación y separación por ambiente.
- Recomendación: conservar solo configuración pública necesaria por ambiente, centralizarla y revisar/forzar RLS y políticas de Storage. No usar claves de servicio en frontend.

### A-02 — Operaciones sensibles ejecutadas desde el cliente y sin trazabilidad

- Evidencia: asignación, cambio de estado, cierre y devolución son `update` directos en `admin.html:1814–1821`, `2155–2161`, `2236–2245`; brigada hace equivalentes en `brigada.html:834–841`, `976–987`.
- Impacto: falta de actor verificable, reglas de transición centralizadas, registro de antes/después e integridad transaccional.
- Recomendación: RPC/Edge Functions transaccionales con autorización, máquina de estados y `audit_events`.

### A-03 — Enumeración y exposición de información de tickets

- Evidencia: `index.html:680–756` consulta por un número con espacio aleatorio de cuatro dígitos y revela categoría, sector, estado y fecha.
- Impacto: facilita adivinar tickets y expone información de incidencias a terceros.
- Recomendación: identificador de alta entropía, token/OTP de consulta o autenticación del solicitante; rate limiting y respuestas no enumerables.

### A-04 — Cargas de archivos sin validación ni control de ciclo de vida

- Evidencia: se aceptan archivos por `accept="image/*"` y se suben directamente en `index.html:486–575` y `brigada.html:890–1025`.
- Impacto: `accept` no valida contenido/tamaño; objetos huérfanos quedan si falla el `insert/update`; rutas no incluyen institución; no hay política de retención ni análisis.
- Recomendación: validar MIME, tamaño y contenido en servidor, rutas tenant/ticket, buckets privados con políticas estrictas, URLs firmadas y compensación/limpieza.

### A-05 — Confirmaciones de éxito potencialmente falsas ante cero filas afectadas

- Evidencia: varias actualizaciones no solicitan datos de retorno y solo verifican `error`, por ejemplo `admin.html:1814–1848` y `brigada.html:834–860`.
- Impacto: una condición que no coincide o una política que filtra filas puede no generar error y el usuario recibe confirmación incorrecta.
- Recomendación: usar RPC transaccional o `select` de retorno y comprobar exactamente una transición realizada.

## Hallazgos medios

### M-01 — Colisión de número de ticket

- Evidencia: `index.html:771–788` usa fecha y un aleatorio de cuatro dígitos, sin reintento ni restricción visible.
- Impacto: bajo volumen reduce el riesgo, pero no elimina colisiones; una restricción única podría hacer fallar altas legítimas.
- Recomendación: generar identificador en base de datos/función con unicidad e idempotencia.

### M-02 — Lógica, configuración y presentación monolíticas y duplicadas

- Evidencia: tres HTML contienen CSS/JS embebido; estados, cliente Supabase, URL/buckets y reglas se repiten.
- Impacto: cambios inconsistentes y costosos; dificulta pruebas y configuración por institución.
- Recomendación: modularizar, tipar/validar contratos y centralizar configuración y reglas.

### M-03 — Datos institucionales y catálogo hardcodeados

- Evidencia: textos, contactos, jurisdicción, sectores, categorías y marca están en `index.html`; identidad municipal en los tres archivos.
- Impacto: no hay configuración remota ni reutilización para otro ayuntamiento.
- Recomendación: modelar configuración institucional administrable y cargarla según dominio/ruta/sesión.

### M-04 — Falta de validación robusta de entradas y concurrencia

- Evidencia: descripciones, sectores, motivos y datos de ticket se aceptan sin límites ni esquema; transiciones compiten desde clientes distintos.
- Impacto: datos de baja calidad, payloads excesivos, contenido malicioso y estados inconsistentes.
- Recomendación: esquemas compartidos, límites, sanitización de salida y transiciones atómicas con control de versión.

### M-05 — Dependencia CDN sin inmovilización ni SRI

- Evidencia: las páginas cargan `@supabase/supabase-js@2` desde jsDelivr sin versión exacta/integrity.
- Impacto: variabilidad de entrega y riesgo de cadena de suministro.
- Recomendación: fijar versión, integrar con build confiable o usar SRI cuando proceda, y definir CSP.

### M-06 — Registro de datos en consola

- Evidencia: el administrador registra objetos de tickets y devoluciones (`admin.html:1047–1048`, `2247–2248`); existen logs en los demás flujos.
- Impacto: datos de incidencias pueden quedar expuestos a personas con acceso al navegador/soporte.
- Recomendación: retirar logs de datos en producción y usar observabilidad con redacción de PII.

### M-07 — Sin infraestructura, pruebas ni separación de ambientes declaradas

- Evidencia: no existen archivos de build, dependencias, CI, migraciones, variables de entorno ni configuración de hosting.
- Impacto: no hay proceso repetible, controlado ni verificable para implementación real.
- Recomendación: introducir repositorio de migraciones, configuración por ambiente, CI/CD con aprobaciones y pruebas automatizadas.

## Hallazgos bajos

### B-01 — Dos recursos locales referenciados no existen

- Evidencia: `index.html:1162` y `1178` referencian `images/parque-maximo-gomez.png` y `images/parroquia-san-antonio.png`; no están en el repositorio.
- Impacto: imágenes rotas al seleccionar esos lugares emblemáticos.
- Recomendación: incorporar recursos autorizados o retirar las opciones en una misión funcional posterior.

### B-02 — Mensajes de error y UX de operación heterogéneos

- Evidencia: mezcla de `alert`, `prompt`, `confirm`, consola y estados de UI; algunos errores de carga solo registran consola.
- Impacto: experiencia poco consistente y difícil de operar/soportar.
- Recomendación: componente uniforme de notificaciones, estados de carga, reintentos e identificación segura de incidentes.

### B-03 — Información institucional y contenidos sin fuente/configuración verificable

- Evidencia: historia, población, contacto, dirección y avisos se codifican en `index.html:1542–1879`.
- Impacto: desactualización y replicación manual para cada institución.
- Recomendación: gestión de contenido y aprobación editorial por institución.

## Valores hardcodeados identificados

| Tipo | Ubicación | Valor o patrón |
| --- | --- | --- |
| Institución/tenant | Tres HTML | `municipio_id = 1` |
| Brigada de prueba | `brigada.html:413` | ID `2` |
| Proyecto Supabase | Tres HTML | URL de un único proyecto y clave pública embebidas (no se reproduce la clave) |
| Buckets | Portal/paneles | `evidencias-tickets`, `evidencias-resoluciones`, prefijo `resoluciones/` |
| Ticket | `index.html:771–788` | prefijo `LS`, fecha y aleatorio de cuatro dígitos |
| Institución | Tres HTML | Laguna Salada, logo, títulos y texto municipal |
| Configuración ciudadana | `index.html:368`, `854–1187`, `1542–1879` | sectores, categorías, jurisdicción, contenidos, contacto, dirección y datos demográficos |
| Flujo | Tres HTML | estados del ticket y sus textos visibles |

## Riesgos no verificables desde el repositorio

- Estado real de RLS y políticas de tablas/buckets.
- Restricciones, índices, claves foráneas, triggers, funciones y auditoría de Supabase.
- Privacidad de objetos Storage, configuración de Auth, rate limits y secretos de servidor.
- Hosting, dominios, HTTPS/CSP, copias de seguridad, registros y procesos de despliegue.

## Preparación multiinstitución

Estado: **no preparada**. Existe una columna de municipio usada como filtro, pero está fijada en cliente y no hay configuración dinámica, identidad, roles, RLS verificable, dominio por institución ni Panel Maestro. La primera construcción debe ser la fundación de tenancy y autorización descrita en el roadmap.

## Verificaciones realizadas

- Enumeración completa del repositorio: 3 HTML y 3 imágenes.
- Revisión estática de los 5.270 renglones HTML/JS/CSS y de los tres recursos gráficos.
- Búsqueda de referencias Supabase, IDs fijos, operaciones de datos/Storage, entradas dinámicas, logs, valores temporales y recursos faltantes.
- Verificación de rama y diff: `saibot/v1.1`; sin diferencias previas contra `main` al inicio de la misión.
- Inspección de dimensiones/formato de imágenes y detección de referencias locales rotas.
- No se ejecutaron llamadas a Supabase ni flujos que escriban datos. La carga visual local con navegador no se realizó porque el entorno bloqueó URLs `file:`; no se intentó eludir esa política.
