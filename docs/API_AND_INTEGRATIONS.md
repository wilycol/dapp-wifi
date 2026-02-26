# API e Integraciones

Documentación de servicios externos y APIs utilizadas.

## Paddle (Pagos y Suscripciones)

Usamos Paddle para gestionar la facturación SaaS de los ISPs (nuestros clientes).

### Configuración
- **Vendor ID**: Identificador de tu cuenta Paddle.
- **Client Side Token**: Para el checkout en frontend.
- **API Key**: Para operaciones de servidor.

### Flujo de Suscripción
1.  El usuario selecciona un plan en la UI.
2.  Se abre el Checkout de Paddle (Overlay).
3.  Al completar el pago, Paddle envía un **Webhook** a nuestro endpoint `/api/webhooks/paddle`.
4.  El webhook actualiza el estado de la suscripción en la tabla `companies`.

### Webhooks Críticos
- `subscription_created`: Activa la cuenta del ISP.
- `subscription_updated`: Cambios de plan.
- `subscription_cancelled`: Marca la cuenta para desactivación al final del periodo.

## Supabase (Backend as a Service)

### Auth
- Proveedor: Email/Password.
- Hooks: `on_auth_user_created` (Trigger) crea automáticamente una entrada en `public.profiles`.

### Storage (Futuro)
- Buckets para logos de empresas o documentos de clientes.
