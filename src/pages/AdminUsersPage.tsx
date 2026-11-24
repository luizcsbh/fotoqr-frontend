import React, { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Lock, RefreshCw, Search, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/admin.service';
import { AdminHeader } from '../components/Layout/AdminHeader';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { EmptyState } from '../components/UI/EmptyState';
import { Modal } from '../components/UI/Modal';
import { Pagination } from '../components/UI/Pagination';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../utils/roles';
import { ManagedUser, ManagedUserRole } from '../types';

const ASSIGNABLE_ROLES: ManagedUserRole[] = ['user', 'dj', 'super_admin'];
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/** Change waiting for the super admin's confirmation */
type PendingAction =
  | { kind: 'role'; user: ManagedUser; role: ManagedUserRole }
  | { kind: 'status'; user: ManagedUser; isActive: boolean }
  | { kind: 'delete'; user: ManagedUser };

const errorMessage = (err: unknown, fallback: string) =>
  (err as { message?: string })?.message || fallback;

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = { page, limit: 20, search, role, status: status || undefined };
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => adminService.getUsers(query),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    // Deleting a user also removes their events from the dashboard
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  const closeModal = () => {
    setPending(null);
    setDeleteConfirmation('');
  };

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; role?: ManagedUserRole; isActive?: boolean }) =>
      adminService.updateUser(args.id, { role: args.role, isActive: args.isActive }),
    onSuccess: (updated) => {
      toast.success(`Conta de ${updated.name} atualizada.`);
      refresh();
      closeModal();
    },
    onError: (err) => toast.error(errorMessage(err, 'Não foi possível atualizar o usuário.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: (result) => {
      toast.success(result.message || 'Usuário excluído.');
      refresh();
      closeModal();
    },
    onError: (err) => toast.error(errorMessage(err, 'Não foi possível excluir o usuário.')),
  });

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'role') updateMutation.mutate({ id: pending.user.id, role: pending.role });
    if (pending.kind === 'status') updateMutation.mutate({ id: pending.user.id, isActive: pending.isActive });
    if (pending.kind === 'delete') deleteMutation.mutate(pending.user.id);
  };

  const isBusy = updateMutation.isPending || deleteMutation.isPending;
  const fieldClass =
    'h-10 w-full px-3 bg-slate-50 text-slate-900 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-hidden';

  const lockReason = (u: ManagedUser) =>
    String(u.id) === String(currentUser?.id)
      ? 'Sua conta — altere pela página Meu perfil'
      : u.isProtected
        ? 'Super admin definido na configuração do servidor'
        : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <AdminHeader
        title="Usuários"
        description="Gerencie as contas da plataforma: perfis de acesso, desativação e exclusão."
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_180px_auto] gap-3 items-end bg-white p-3 rounded-2xl border border-slate-200/80 mb-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Buscar</span>
          <div className="relative mt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nome ou e-mail"
              className={`${fieldClass} pl-9`}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Perfil</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Todos os perfis</option>
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Desativados</option>
          </select>
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching && !isLoading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Atualizar
        </Button>
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="px-5 py-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-base mb-1">Não foi possível carregar os usuários</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && !isError && data.items.length === 0 && (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Nenhum usuário encontrado"
          description="Ajuste a busca ou os filtros."
        />
      )}

      {data && !isError && data.items.length > 0 && (
        <>
          <ul
            className={`bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 transition-opacity ${
              isFetching ? 'opacity-60' : ''
            }`}
          >
            {data.items.map((u) => {
              const locked = lockReason(u);
              return (
                <li key={u.id} className="px-4 sm:px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5">
                  {/* Identity */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        u.isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${u.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                          {u.name}
                        </span>
                        {!u.isActive && <Badge variant="danger">Desativado</Badge>}
                        {locked && (
                          <span title={locked} className="inline-flex items-center text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Desde {dateFormat.format(new Date(u.createdAt))} · {u.eventCount} evento(s) · {u.photoCount} foto(s)
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Perfil de {u.name}
                    </label>
                    <select
                      id={`role-${u.id}`}
                      value={u.role}
                      disabled={Boolean(locked) || isBusy}
                      title={locked ?? 'Alterar perfil'}
                      onChange={(e) =>
                        setPending({ kind: 'role', user: u, role: e.target.value as ManagedUserRole })
                      }
                      className="h-9 px-2.5 bg-white text-slate-800 rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    {u.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Boolean(locked) || isBusy}
                        title={locked ?? undefined}
                        onClick={() => setPending({ kind: 'status', user: u, isActive: false })}
                        leftIcon={<UserX className="w-4 h-4" />}
                      >
                        Desativar
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        disabled={Boolean(locked) || isBusy}
                        onClick={() => setPending({ kind: 'status', user: u, isActive: true })}
                        leftIcon={<UserCheck className="w-4 h-4" />}
                      >
                        Reativar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={Boolean(locked) || isBusy}
                      title={locked ?? 'Excluir conta'}
                      onClick={() => setPending({ kind: 'delete', user: u })}
                      className="text-red-600! hover:bg-red-50 hover:text-red-700!"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="usuários"
            onPageChange={setPage}
          />
        </>
      )}

      {/* Confirmation */}
      <Modal
        isOpen={pending !== null}
        onClose={() => !isBusy && closeModal()}
        maxWidth="sm"
        title={
          pending?.kind === 'delete'
            ? 'Excluir esta conta?'
            : pending?.kind === 'status'
              ? pending.isActive
                ? 'Reativar esta conta?'
                : 'Desativar esta conta?'
              : 'Alterar o perfil?'
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeModal} disabled={isBusy}>
              Cancelar
            </Button>
            <Button
              variant={pending?.kind === 'delete' || (pending?.kind === 'status' && !pending.isActive) ? 'danger' : 'primary'}
              size="sm"
              onClick={confirmPending}
              isLoading={isBusy}
              disabled={pending?.kind === 'delete' && deleteConfirmation.trim().toLowerCase() !== pending.user.email.toLowerCase()}
            >
              Confirmar
            </Button>
          </>
        }
      >
        {pending?.kind === 'role' && (
          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">{pending.user.name}</strong> passará de{' '}
            <strong>{ROLE_LABELS[pending.user.role] ?? pending.user.role}</strong> para{' '}
            <strong>{ROLE_LABELS[pending.role]}</strong>.
            {pending.role === 'super_admin' && ' Super admins veem e gerenciam todos os eventos, fotos e usuários.'}{' '}
            A pessoa precisará entrar de novo.
          </p>
        )}
        {pending?.kind === 'status' && (
          <p className="text-sm text-slate-600">
            {pending.isActive ? (
              <>
                <strong className="text-slate-900">{pending.user.name}</strong> poderá entrar na plataforma novamente.
              </>
            ) : (
              <>
                <strong className="text-slate-900">{pending.user.name}</strong> não poderá mais entrar e todas as sessões
                abertas serão encerradas. Os eventos e as fotos da conta continuam guardados.
              </>
            )}
          </p>
        )}
        {pending?.kind === 'delete' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Esta ação é <strong className="text-red-600">irreversível</strong>. Serão apagados a conta de{' '}
              <strong className="text-slate-900">{pending.user.name}</strong>, os{' '}
              <strong>{pending.user.eventCount} evento(s)</strong> dela e todas as{' '}
              <strong>{pending.user.photoCount} foto(s)</strong> desses eventos.
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">
                Digite <span className="font-mono text-slate-900">{pending.user.email}</span> para confirmar
              </span>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                autoComplete="off"
                className="mt-1 h-10 w-full px-3 bg-slate-50 text-slate-900 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-hidden"
              />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
