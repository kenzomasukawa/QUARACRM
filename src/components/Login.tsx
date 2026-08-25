import React, { useState } from 'react';
import { Lock, Mail, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsSubmitting(true);
    setError(null);

    const result = await signIn(email.trim(), password);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center text-white font-black text-xl shadow-lg border border-rose-400/30 mb-3">
            Q
          </div>
          <h1 className="font-black text-2xl text-neutral-900 dark:text-white tracking-tight">
            quara<span className="text-rose-500">crm</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Gestão Comercial &amp; Pipeline</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 space-y-4"
        >
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Entrar</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Acesse sua conta para gerenciar o pipeline comercial.
            </p>
          </div>

          {!isConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Supabase não configurado. Defina <code className="font-mono">VITE_SUPABASE_URL</code> e{' '}
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> nas variáveis de ambiente.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@suaempresa.com.br"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-neutral-900 dark:text-neutral-100 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-neutral-900 dark:text-neutral-100 outline-none transition"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-600 mt-6">
          Acesso restrito à equipe comercial QuaraCRM.
        </p>
      </div>
    </div>
  );
};
