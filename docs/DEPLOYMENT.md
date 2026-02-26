# Guía de Despliegue (Deployment)

Este proyecto está optimizado para ser desplegado en **Vercel**.

## Despliegue en Vercel

1.  **Conectar Repositorio**
    - Ve a [Vercel Dashboard](https://vercel.com).
    - "Add New..." -> "Project".
    - Importa el repositorio `dapp-wifi`.

2.  **Configurar Proyecto**
    - **Framework Preset**: Next.js (Detectado automáticamente).
    - **Root Directory**: `./` (Raíz).

3.  **Variables de Entorno**
    Debes configurar las siguientes variables en la sección "Environment Variables" de Vercel:

    | Variable | Descripción |
    | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase. |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase. |

4.  **Desplegar**
    - Haz clic en "Deploy".
    - Vercel construirá la aplicación y te dará una URL (ej: `dapp-wifi.vercel.app`).

## Verificaciones Post-Deploy

1.  **Login**: Verifica que puedas iniciar sesión.
2.  **Conexión DB**: Navega al Dashboard y verifica que carguen los datos (o se muestren vacíos sin error).
3.  **Rutas Dinámicas**: Prueba navegar entre secciones.

## CI/CD
Cada vez que hagas un `push` a la rama `main`, Vercel disparará automáticamente un nuevo despliegue.
