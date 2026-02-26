# Guía de Desarrollo

Pasos para configurar el entorno de desarrollo local para **dapp-wifi**.

## Requisitos Previos
- Node.js 18+
- npm o pnpm
- Git
- Cuenta en Supabase
- Cuenta en Vercel (opcional para deploy)

## Configuración Inicial

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/usuario/dapp-wifi.git
    cd dapp-wifi
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo `.env.local` en la raíz basado en `.env.example` (si existe) o con las siguientes variables:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_supabase
    SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (solo para scripts de admin)
    ```

4.  **Iniciar el Servidor de Desarrollo**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## Flujo de Trabajo con Base de Datos

### Migraciones
Usamos migraciones SQL para versionar la base de datos.
Las migraciones se encuentran en `supabase/migrations`.

Para aplicar cambios localmente (si usas Supabase CLI):
```bash
supabase db reset
```

Para aplicar cambios en producción/remoto, usamos la interfaz SQL de Supabase o scripts de conexión directa.

## Scripts Útiles
- `npm run lint`: Ejecuta el linter (ESLint/Oxlint) para verificar calidad de código.
- `npm run build`: Compila la aplicación para producción.
- `node scripts/audit-db.js`: Ejecuta una auditoría de conexión y estructura de BD.
