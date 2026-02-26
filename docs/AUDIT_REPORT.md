# Informe de Auditoría de Seguridad y Multi-Tenancy

**Fecha:** 26 de Febrero de 2026
**Proyecto:** Dapp-WiFi SaaS
**Auditor:** Jack-SafeRefactor (AI Agent)

## 1. Resumen Ejecutivo
Se ha realizado una auditoría exhaustiva y una prueba de concepto (PoC) sobre la arquitectura Multi-Tenant del sistema. **El sistema se considera SEGURO y AISLADO** para el uso por múltiples empresas (ISPs/WISPs). Las políticas de seguridad a nivel de fila (RLS) están activas y funcionan correctamente, impidiendo el acceso cruzado a datos entre inquilinos (tenants).

## 2. Metodología de Pruebas
La auditoría se dividió en dos fases:
1.  **Análisis Estático:** Revisión de esquemas SQL, claves foráneas y definiciones de políticas RLS.
2.  **Análisis Dinámico:** Ejecución de scripts automatizados (`scripts/test-multitenant.js`) simulando usuarios reales con tokens JWT autenticados.

## 3. Resultados de Pruebas Dinámicas (Aislamiento)
Se ejecutó un script de prueba que simuló dos empresas (Company A y Company B) y dos usuarios administradores respectivos.

| ID | Escenario de Prueba | Resultado Esperado | Resultado Obtenido | Estado |
|----|---------------------|--------------------|--------------------|--------|
| T01 | Usuario A crea Cliente en Company A | Permitido | Cliente creado exitosamente | ✅ PASS |
| T02 | Usuario A crea Ticket en Company A | Permitido | Ticket creado exitosamente | ✅ PASS |
| T03 | Usuario B intenta LEER datos de Company A | **Bloqueado** (Retorna vacío) | Array vacío (0 registros) | ✅ PASS |
| T04 | Usuario B intenta ACTUALIZAR datos de Company A | **Bloqueado** (Sin cambios) | 0 filas afectadas | ✅ PASS |
| T05 | Usuario A lee sus propios datos | Permitido | Registros visibles | ✅ PASS |

**Conclusión:** El aislamiento de datos es efectivo. Un usuario autenticado con un token válido de "Company B" es técnicamente incapaz de acceder a los datos de "Company A" a través de la API de Supabase.

## 4. Auditoría de Esquema y Base de Datos

### 4.1 Estructura Multi-Tenant
Todas las tablas críticas han sido migradas para incluir la columna discriminadora `company_id`:
- `public.companies` (Tabla Maestra)
- `public.profiles` (Vinculación Usuario-Empresa)
- `public.clients` (Datos aislados)
- `public.installers` (Datos aislados)
- `public.support_tickets` (Datos aislados)

### 4.2 Políticas RLS (Row Level Security)
Se verificó que las políticas no sean permisivas (`USING true`). Las políticas actuales siguen el patrón estricto:
```sql
USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
```
Esto garantiza que la seguridad se aplique en el motor de base de datos, independientemente de errores en el frontend.

### 4.3 Hallazgos y Discrepancias Menores
Durante la auditoría se detectaron diferencias entre el esquema original propuesto y el estado actual de la base de datos en producción:
1.  **Tabla `clients`**: No posee la columna `plan` que estaba en el diseño original. Se recomienda agregarla si es necesaria para la lógica de negocio.
2.  **Tabla `installers`**: Fue recreada exitosamente durante la migración ya que no existía.
3.  **Tabla `profiles`**: Utiliza `full_name` en lugar de columnas separadas de nombre.

## 5. Recomendaciones de Seguridad
1.  **Rotación de Secretos**: Asegurar que `SERVICE_ROLE_KEY` nunca se exponga en el cliente (navegador).
2.  **Validación en Backend**: Aunque RLS protege los datos, se recomienda validar `company_id` en los Endpoints de API (como Webhooks) para evitar procesamiento innecesario.
3.  **Backups**: Configurar backups automáticos en Supabase (Point-in-Time Recovery) antes del lanzamiento a producción masiva.

## 6. Próximos Pasos
- Integrar la pasarela de pagos (Paddle) vinculando el estado de suscripción en la tabla `companies`.
- Desplegar en Vercel siguiendo la guía de despliegue generada.

---
**Firma:** Jack-SafeRefactor
**Estado:** ✅ APROBADO PARA FASE BETA
