'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getInvitation, acceptInvitation } from '@/app/actions/invitations';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

export default function InvitePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkAuthAndInvite() {
      // 1. Verificar Usuario
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. Obtener detalles de la invitación
      const result = await getInvitation(params.code);
      
      if (!result.success) {
        setError(result.error as string);
        setLoading(false);
        return;
      }
      
      setInvitation(result.invitation);
      setLoading(false);
    }

    checkAuthAndInvite();
  }, [params.code]);

  const handleAccept = async () => {
    if (!user) {
      // Redirigir a login con return URL
      router.push(`/login?next=/invite/${params.code}`);
      return;
    }

    setLoading(true);
    const result = await acceptInvitation(params.code, user.id, user.email);

    if (result.success) {
      setSuccess(true);
      // Redirigir al dashboard después de unos segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } else {
      setError(result.error as string);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invitación Inválida</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/" className="btn-primary w-full inline-flex justify-center">
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">¡Bienvenido al Equipo!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Has aceptado la invitación correctamente. Redirigiendo al panel...</p>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 text-2xl font-bold">
            {invitation.companies?.name?.[0] || 'E'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitación a Colaborar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Te han invitado a unirte a <strong>{invitation.companies?.name}</strong> como <span className="uppercase font-bold text-blue-600 dark:text-blue-400">{invitation.role}</span>.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Detalles de la invitación</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Email invitado: {invitation.email}
            </p>
          </div>

          {!user ? (
            <div className="text-center p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Necesitas iniciar sesión o registrarte para aceptar esta invitación.
              </p>
              <button 
                onClick={handleAccept}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                Iniciar Sesión y Aceptar
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Aceptarás esta invitación como <strong>{user.email}</strong>
              </p>
              <button 
                onClick={handleAccept}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                Unirme al Equipo
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
