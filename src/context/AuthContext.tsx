import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseEnvConfigured } from '../lib/supabase';
import { UserRole } from '../types/crm';

interface AuthContextType {
  session: Session | null;
  authUser: SupabaseUser | null;
  userRole: UserRole;
  refreshUserRole: () => Promise<void>;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('consultant');
  const [isLoading, setIsLoading] = useState(true);

  const loadUserRole = useCallback(async (userId: string) => {
    if (!isSupabaseEnvConfigured || !userId) {
      setUserRole('consultant');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.role) {
        setUserRole(data.role as UserRole);
      } else {
        setUserRole('consultant');
      }
    } catch {
      setUserRole('consultant');
    }
  }, []);

  const refreshUserRole = useCallback(async () => {
    if (session?.user?.id) {
      await loadUserRole(session.user.id);
    }
  }, [session?.user?.id, loadUserRole]);

  useEffect(() => {
    if (!isSupabaseEnvConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) {
        loadUserRole(data.session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        loadUserRole(newSession.user.id).finally(() => setIsLoading(false));
      } else {
        setUserRole('consultant');
        setIsLoading(false);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [loadUserRole]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseEnvConfigured) {
      return {
        success: false,
        message: 'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, message: error.message || 'Não foi possível autenticar.' };
    }

    setSession(data.session);
    if (data.session?.user?.id) {
      await loadUserRole(data.session.user.id);
    }
    return { success: true, message: 'Login realizado com sucesso!' };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole('consultant');
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        authUser: session?.user || null,
        userRole,
        refreshUserRole,
        isLoading,
        isConfigured: isSupabaseEnvConfigured,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
