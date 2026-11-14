import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { useAuth } from '../hooks/useAuth';
import { staffConsolePath, staffService } from '../services/staff.service';
import { ApiError } from '../types';

/**
 * Landing page of a DJ / reader exclusive link (/acesso/:token): opens the restricted session and
 * goes straight to that console — no password, and no way into the dashboard.
 */
export const StaffAccessPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; open the link only once
    if (!token || startedRef.current) return;
    startedRef.current = true;

    staffService
      .openAccess(token)
      .then(async (access) => {
        await refreshUser();
        navigate(staffConsolePath(access), { replace: true });
      })
      .catch((err: ApiError) => {
        setError(err?.message || 'Não foi possível abrir este link de acesso.');
      });
  }, [token, navigate, refreshUser]);

  if (!error) {
    return <LoadingScreen message="Abrindo seu acesso..." subMessage="Validando o link exclusivo do evento." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Link de acesso inválido</h1>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    </div>
  );
};

export default StaffAccessPage;
