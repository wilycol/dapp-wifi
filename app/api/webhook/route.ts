import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';

// =============================================================================
// 1. Configuración Estática (Initialization & Reusability)
// =============================================================================

// Validación estricta de variables críticas al iniciar (Fail Fast)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET_KEY;

// Reutilización de Cliente Supabase (Singleton Pattern via Module Scope)
// Usamos Service Role para operaciones privilegiadas (validar tenant, idempotencia)
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Inicialización correcta de Paddle
let paddle: Paddle | null = null;

if (PADDLE_API_KEY) {
  paddle = new Paddle({ apiKey: PADDLE_API_KEY });
}

// Constantes
const REPLAY_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutos

// =============================================================================
// 2. Webhook Handler (Production-Grade v2)
// =============================================================================

export async function POST(request: Request) {
  const isProd = process.env.NODE_ENV === 'production';

  try {
    // -------------------------------------------------------------------------
    // A. Health Check & Configuration Validation
    // -------------------------------------------------------------------------
    if (!supabaseAdmin || !paddle || !PADDLE_WEBHOOK_SECRET) {
      console.error('❌ Server Misconfiguration: Missing critical keys (Supabase or Paddle).');
      return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    // -------------------------------------------------------------------------
    // B. Security: Signature & Replay Attack Protection
    // -------------------------------------------------------------------------
    const signatureHeader = request.headers.get('paddle-signature');
    if (!signatureHeader) {
      console.warn('⚠️ Security: Missing Paddle Signature');
      return NextResponse.json({ error: 'Missing Signature' }, { status: 401 });
    }

    // Extracción de Timestamp del header para prevenir Replay Attacks
    // Formato típico: ts=1234567890;h1=hash...
    const tsMatch = signatureHeader.match(/ts=(\d+)/);
    if (!tsMatch) {
       console.warn('⚠️ Security: Invalid Signature Format (Missing Timestamp)');
       return NextResponse.json({ error: 'Invalid Signature Format' }, { status: 401 });
    }

    const eventTimestamp = parseInt(tsMatch[1], 10) * 1000; // Convertir a ms
    const now = Date.now();
    
    if (Math.abs(now - eventTimestamp) > REPLAY_TOLERANCE_MS) {
        console.warn(`⛔ Security: Replay Attack Suspected! Timestamp diff: ${Math.abs(now - eventTimestamp)}ms`);
        return NextResponse.json({ error: 'Request Expired' }, { status: 401 });
    }

    // -------------------------------------------------------------------------
    // C. Signature Verification & Parsing
    // -------------------------------------------------------------------------
    const rawBody = await request.text();
    let eventData;
    
    try {
        eventData = await paddle.webhooks.unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signatureHeader);
    } catch (e) {
        console.error('❌ Security: Invalid Webhook Signature:', e);
        return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
    }

    const { eventId, eventType, data } = eventData;
    // Type Casting seguro para customData
    const customData = (data as any)?.customData as Record<string, any> | undefined;
    const companyId = customData?.company_id;

    // Log Controlado (Producción vs Desarrollo)
    if (isProd) {
        console.log(`📦 Webhook: ${eventType} | ID: ${eventId} | Tenant: ${companyId || 'Unknown'}`);
    } else {
        console.log('📦 Webhook Full Payload:', JSON.stringify(eventData, null, 2));
    }

    // -------------------------------------------------------------------------
    // D. Tenant Validation (Aislamiento Multi-Tenant) - PRIORIDAD 1
    // -------------------------------------------------------------------------
    if (!companyId) {
        console.warn(`⚠️ Business Rule: Webhook ignorado (Falta company_id). Event: ${eventType}`);
        // Retornamos success para que Paddle deje de reintentar eventos irrelevantes
        return NextResponse.json({ received: true, status: 'ignored_no_tenant' }, { status: 200 });
    }

    // Verificar existencia en DB
    const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

    if (companyError || !company) {
        console.error(`⛔ Security Alert: Webhook con company_id inexistente: ${companyId}`);
        // Retornamos 400 porque esto podría ser un ataque o error de configuración
        return NextResponse.json({ error: 'Invalid Tenant' }, { status: 400 });
    }

    console.log(`✅ Tenant Verificado: ${company.name} (${company.id})`);

    // -------------------------------------------------------------------------
    // E. Idempotency Check (Processed Webhooks) - PRIORIDAD 2
    // -------------------------------------------------------------------------
    // Solo insertamos si el tenant es válido.
    if (eventId) {
        const { error: insertError } = await supabaseAdmin
            .from('processed_webhooks')
            .insert({ id: eventId });

        if (insertError) {
            // Código 23505 es unique_violation en Postgres
            if (insertError.code === '23505') {
                console.log(`ℹ️ Idempotency: Event ${eventId} already processed. Skipping.`);
                return NextResponse.json({ received: true, status: 'already_processed' }, { status: 200 });
            } else {
                console.error('⚠️ Database Error checking idempotency:', insertError);
                // No bloqueamos el proceso por error de DB en log, pero es riesgoso.
                // En sistema crítico, podríamos decidir fallar. Aquí continuamos.
            }
        }
    }

    // -------------------------------------------------------------------------
    // F. Business Logic Execution
    // -------------------------------------------------------------------------
    switch (eventType) {
        case EventName.SubscriptionCreated:
        case EventName.SubscriptionUpdated:
            console.log(`🔄 Processing Subscription Update for ${company.name}`);
            // TODO: Implementar lógica de actualización de plan
            // await updateCompanySubscription(company.id, data);
            break;
        
        case EventName.SubscriptionCanceled:
             console.log(`⚠️ Subscription Canceled for ${company.name}`);
             // TODO: Implementar lógica de degradación o bloqueo
             break;

        default:
            console.log(`ℹ️ Event handled default: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Critical Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
