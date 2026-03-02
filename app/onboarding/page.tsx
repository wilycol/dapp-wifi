'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  Globe, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Upload,
  CreditCard
} from 'lucide-react';
import { useTheme } from 'next-themes';

const supabase = createClient();

// Schema for Step 1: Company Info
const companySchema = z.object({
  name: z.string().min(3, 'El nombre del negocio es requerido'),
  fiscal_id: z.string().min(1, 'Identificación fiscal requerida (NIT/RUT)'),
  address: z.string().min(5, 'Dirección física requerida'),
  phone: z.string().min(7, 'Teléfono de contacto requerido'),
  email: z.string().email('Email de contacto inválido'),
  currency: z.string().default('USD'),
});

// Schema for Step 2: Website
const websiteSchema = z.object({
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  request_website: z.boolean().default(false),
});

// Schema for Step 3: Team
const teamSchema = z.object({
  technician_email: z.string().email('Email inválido').optional().or(z.literal('')),
  collector_email: z.string().email('Email inválido').optional().or(z.literal('')),
});

export default function Onboarding() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Forms
  const companyForm = useForm({ resolver: zodResolver(companySchema) });
  const websiteForm = useForm({ resolver: zodResolver(websiteSchema) });
  const teamForm = useForm({ resolver: zodResolver(teamSchema) });

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Check if already has company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
        
      if (profile?.company_id) {
        router.push('/');
      }
    }
    getUser();
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const submitCompany = async (data: any) => {
    setLoading(true);
    try {
      let logoUrl = null;

      // Upload Logo if exists
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);
          
        logoUrl = publicUrl;
      }

      // Create Company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: data.name,
          fiscal_id: data.fiscal_id,
          address: data.address,
          phone: data.phone,
          email: data.email,
          currency: data.currency,
          logo_url: logoUrl,
          subscription_plan: 'Free', // Default plan
          owner_id: user.id,
          slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now() // Unique slug
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      setCompanyId(company.id);

      // Update User Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          company_id: company.id,
          role: 'admin' // Set as admin
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setStep(2);
    } catch (error: any) {
      console.error('Error creating company:', error);
      alert('Error al crear el negocio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitWebsite = async (data: any) => {
    setLoading(true);
    try {
      if (!companyId) throw new Error("Company ID missing");

      if (data.website) {
        await supabase
          .from('companies')
          .update({ website: data.website })
          .eq('id', companyId);
      } else if (data.request_website) {
        // Create request ticket
        await supabase
          .from('service_requests')
          .insert([{
            company_id: companyId,
            request_type: 'website_creation',
            details: { status: 'requested_via_onboarding' }
          }]);
      }
      setStep(3);
    } catch (error: any) {
      console.error('Error updating website:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitTeam = async (data: any) => {
    setLoading(true);
    try {
      if (!companyId) throw new Error("Company ID missing");
      
      const invites = [];
      if (data.technician_email) {
        invites.push({
          company_id: companyId,
          email: data.technician_email,
          role: 'Tecnico',
          status: 'pending'
        });
      }
      if (data.collector_email) {
        invites.push({
          company_id: companyId,
          email: data.collector_email,
          role: 'Cobrador',
          status: 'pending'
        });
      }

      if (invites.length > 0) {
        const { error } = await supabase
          .from('company_invites')
          .insert(invites);
        
        if (error) throw error;
      }

      // Finish
      router.push('/');
    } catch (error: any) {
      console.error('Error inviting team:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Bienvenido a Dapp WiFi
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Configuremos tu negocio en unos simples pasos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step > i ? <CheckCircle2 size={16} /> : i}
                </div>
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  {i === 1 ? 'Negocio' : i === 2 ? 'Web' : 'Equipo'}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Company Info */}
          {step === 1 && (
            <form onSubmit={companyForm.handleSubmit(submitCompany)} className="space-y-6">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="text-gray-400" size={32} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Sube tu logo (Click para cambiar)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Negocio</label>
                <input {...companyForm.register('name')} className="form-input-dapp w-full" placeholder="Ej: Redes Rápidas S.A." />
                {companyForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{companyForm.formState.errors.name.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identificación Fiscal (NIT/RUT)</label>
                <input {...companyForm.register('fiscal_id')} className="form-input-dapp w-full" placeholder="Ej: 123456-7" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Física</label>
                <input {...companyForm.register('address')} className="form-input-dapp w-full" placeholder="Calle Principal #123" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono de Soporte</label>
                <input {...companyForm.register('phone')} className="form-input-dapp w-full" placeholder="+504 9999-9999" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email de Contacto</label>
                <input {...companyForm.register('email')} className="form-input-dapp w-full" placeholder="contacto@minegocio.com" />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18} />}
                Continuar
              </button>
            </form>
          )}

          {/* Step 2: Website */}
          {step === 2 && (
            <form onSubmit={websiteForm.handleSubmit(submitWebsite)} className="space-y-6">
              <div className="text-center mb-6">
                <Globe className="mx-auto h-12 w-12 text-blue-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Presencia Digital</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">¿Tienes ya un sitio web para tus clientes?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sitio Web (Opcional)</label>
                <input {...websiteForm.register('website')} className="form-input-dapp w-full" placeholder="https://minegocio.com" />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="request_website"
                      type="checkbox"
                      {...websiteForm.register('request_website')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="request_website" className="font-medium text-blue-700 dark:text-blue-300">
                      No tengo sitio web, ¡quiero uno!
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Solicita una página web moderna integrada con Dapp WiFi. Crearemos un ticket para contactarte.
                    </p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18} />}
                Siguiente
              </button>
            </form>
          )}

          {/* Step 3: Team */}
          {step === 3 && (
            <form onSubmit={teamForm.handleSubmit(submitTeam)} className="space-y-6">
              <div className="text-center mb-6">
                <Users className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Tu Equipo</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Invita a tus colaboradores (Plan Free: 1 Técnico, 1 Cobrador)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email del Técnico (Opcional)</label>
                <input {...teamForm.register('technician_email')} className="form-input-dapp w-full" placeholder="tecnico@minegocio.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email del Cobrador (Opcional)</label>
                <input {...teamForm.register('collector_email')} className="form-input-dapp w-full" placeholder="cobrador@minegocio.com" />
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  disabled 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Users size={16} />
                  Añadir más empleados
                </button>
                <p className="mt-3 text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-100 dark:border-amber-800/30">
                  <span className="font-semibold block mb-1">Plan Free Limitado</span>
                  Solo puedes registrar 1 Técnico y 1 Cobrador inicialmente.
                  <br/>
                  Actualiza a un plan <strong>Pro</strong> para gestionar equipos más grandes.
                </p>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18} />}
                Finalizar y Entrar
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
