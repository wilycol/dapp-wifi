# Guía de Implementación y Pruebas del Webhook Seguro (Paddle)

## 1. Variables de Entorno Requeridas
Asegúrate de configurar estas variables en Vercel (Production) y en tu `.env.local` (Development):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://whwtagguzgzbjirhtifi.supabase.co
# CRÍTICO: Solo en el servidor (Vercel Env Vars), nunca en NEXT_PUBLIC
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_real

# Paddle
PADDLE_API_KEY=tu_api_key_de_paddle
# CRÍTICO: Secret obtenido en Paddle Dashboard > Developer Tools > Notifications
PADDLE_WEBHOOK_SECRET_KEY=tu_webhook_secret_key
```

## 2. Checklist de Pruebas (Modo Sandbox)

### Prueba 1: Validación de Firma (Seguridad)
- [ ] Enviar una petición POST a `/api/webhook` sin el header `paddle-signature`.
  - **Resultado Esperado**: 401 Unauthorized (`Missing Signature`).
- [ ] Enviar una petición con una firma falsa o cuerpo modificado.
  - **Resultado Esperado**: 401 Unauthorized (`Invalid Signature`).

### Prueba 2: Validación de Tenant (Aislamiento)
- [ ] Generar un evento de prueba en Paddle Sandbox.
- [ ] Asegurarse de **NO** incluir `company_id` en el `custom_data`.
  - **Resultado Esperado**: 200 OK pero con status `ignored_no_tenant` (Logs: `⚠️ Webhook ignorado: Falta company_id`).
- [ ] Incluir un `company_id` que no existe en tu base de datos (UUID random).
  - **Resultado Esperado**: 400 Bad Request (`Invalid Tenant`). Logs: `⛔ Security Alert`.

### Prueba 3: Flujo Exitoso
- [ ] Crear una suscripción en Paddle Sandbox pasando el `company_id` real de una empresa de prueba en `custom_data`.
- [ ] Verificar que el webhook responde 200 OK.
- [ ] Verificar logs: `✅ Tenant Verificado: [Nombre Empresa]`.

## 3. Garantías de Seguridad Implementadas

1.  **Falsificación Imposible**: El uso de `paddle.webhooks.unmarshal` garantiza que solo Paddle (quien posee la clave privada correspondiente a tu Secret) pudo haber generado el evento. Cualquier modificación en el body invalida la firma.
2.  **Aislamiento de Tenant**: Incluso si un atacante logra enviar un evento firmado válido (e.g., comprando algo legítimamente), si intenta inyectar un `company_id` ajeno o inexistente, la validación contra la base de datos bloqueará la operación antes de ejecutar cualquier lógica de negocio.
3.  **Logs Limpios**: En producción (`NODE_ENV=production`), no se vuelcan datos sensibles ni payloads completos, solo IDs y tipos de evento.
