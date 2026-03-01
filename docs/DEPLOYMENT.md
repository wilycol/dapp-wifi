# Guía de Despliegue en Vercel (Producción)

Este proyecto está optimizado para Next.js en Vercel. Sigue estos pasos para desplegar la versión de producción.

## 1. Conectar Repositorio
1.  Ve a tu [Dashboard de Vercel](https://vercel.com/dashboard).
2.  Haz clic en **"Add New..."** -> **"Project"**.
3.  Selecciona el repositorio `dapp-wifi` de tu cuenta de GitHub.
4.  Haz clic en **"Import"**.

## 2. Configurar Proyecto
En la pantalla de configuración ("Configure Project"):

*   **Framework Preset**: Next.js (se detecta automáticamente).
*   **Root Directory**: `./` (dejar por defecto).
*   **Build Command**: `next build` (dejar por defecto).
*   **Output Directory**: `.next` (dejar por defecto).

## 3. Variables de Entorno (CRÍTICO)
Debes agregar las siguientes variables en la sección **"Environment Variables"**.

### Supabase (Base de Datos & Auth)
| Variable | Valor (Ejemplo / Instrucción) |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://whwtagguzgzbjirhtifi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Tu Anon Key Pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Tu Service Role Secret - **NO** usar Anon Key aquí) |

### Paddle (Pagos & Webhooks)
| Variable | Valor (Ejemplo / Instrucción) |
| :--- | :--- |
| `PADDLE_API_KEY` | Tu API Key de Paddle (Sandbox o Production). |
| `PADDLE_WEBHOOK_SECRET_KEY` | El Secret Key del Webhook que configurarás en el Dashboard de Paddle. |

> **Nota**: Si aún no tienes las llaves finales de Paddle, puedes poner valores temporales (ej: `placeholder_key`), pero el endpoint `/api/webhook` dará error 500 hasta que se configuren las reales.

## 4. Desplegar
1.  Haz clic en **"Deploy"**.
2.  Espera a que termine el proceso de build (aprox. 1-2 minutos).
3.  Si todo sale bien, verás la pantalla de "Congratulations!".
4.  Copia la URL de tu proyecto (ej: `https://dapp-wifi.vercel.app`).

## 5. Post-Deploy: Configurar Webhook en Paddle
Una vez tengas la URL de Vercel:

1.  Ve al Dashboard de Paddle > Developer Tools > Notifications (Webhooks).
2.  Crea una nueva notificación.
3.  **URL**: `https://TU-PROYECTO.vercel.app/api/webhook`
4.  **Eventos**: Suscríbete a `subscription.created`, `subscription.updated`, `subscription.canceled`.
5.  Copia el **Secret Key** que te da Paddle y actualiza la variable `PADDLE_WEBHOOK_SECRET_KEY` en Vercel.
6.  Redespliega (Redeploy) en Vercel para que tome el nuevo secreto.
