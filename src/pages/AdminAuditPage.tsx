import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Globe, RefreshCw, ScrollText, Search, User as UserIcon, X } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { AdminHeader } from '../components/Layout/AdminHeader';
import { Badge, BadgeVariant } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { EmptyState } from '../components/UI/EmptyState';
import { Pagination } from '../components/UI/Pagination';
import { AuditLogEntry } from '../types';

const ACTION_LABELS: Record<string, string> = {
  AUTH_LOGIN: 'Login',
  AUTH_LOGIN_FAILED: 'Login recusado',
  AUTH_LOGIN_BLOCKED: 'Login de conta desativada',
  USER_REGISTER: 'Cadastro',
  PASSWORD_CHANGE: 'Senha alterada',
  PASSWORD_RESET: 'Senha redefinida',
  EVENT_CREATE: 'Evento criado',
  EVENT_UPDATE: 'Evento editado',
  EVENT_ACTIVATE: 'Evento ativado',
  EVENT_PAUSE: 'Evento pausado',
  EVENT_DELETE: 'Evento excluído',
  PHOTO_DELETE: 'Foto excluída',
  PHOTO_APPROVE: 'Foto aprovada',
  PHOTO_APPROVE_BULK: 'Fotos aprovadas',
  USER_CREATE: 'Conta criada',
  USER_UPDATE: 'Dados da conta alterados',
  USER_PASSWORD_SET: 'Senha definida pelo admin',
  USER_ROLE_CHANGE: 'Perfil alterado',
  USER_ACTIVATE: 'Conta reativada',
  USER_DEACTIVATE: 'Conta desativada',
  USER_DELETE: 'Conta excluída',
  GUEST_CREATE: 'Convidado adicionado',
  GUEST_UPDATE: 'Convidado editado',
  GUEST_DELETE: 'Convidado removido',
  GUEST_IMPORT: 'Convidados importados',
  INVITATION_CREATE: 'Convite gerado',
  INVITATION_REISSUE: 'Convite reemitido',
  INVITATION_REVOKE: 'Convite revogado',
  DELIVERY_EMAIL_SENT: 'Convite enviado por e-mail',
  DELIVERY_WHATSAPP_SENT: 'Convite enviado por WhatsApp',
  READER_ADD: 'Leitor adicionado',
  READER_REMOVE: 'Leitor removido',
};

const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

function actionVariant(action: string): BadgeVariant {
  if (/DELETE|REMOVE|REVOKE|FAILED|BLOCKED|DEACTIVATE/.test(action)) return 'danger';
  if (/ROLE|PAUSE|PASSWORD/.test(action)) return 'warning';
  if (/CREATE|APPROVE|ACTIVATE|REGISTER|ADD/.test(action)) return 'success';
  if (/UPDATE|LOGIN|SENT|IMPORT|REISSUE/.test(action)) return 'info';
  return 'neutral';
}

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

/** "2026-11-24" (local day) → ISO instant at the start or end of that day */
const dayBoundary = (day: string, end: boolean) =>
  day ? new Date(`${day}T${end ? '23:59:59.999' : '00:00:00'}`).toISOString() : undefined;

const AuditRow: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => {
  const [open, setOpen] = useState(false);
  const hasDetails = entry.metadata && Object.keys(entry.metadata).length > 0;
  const actor = entry.actor?.name || entry.actor?.email;

  return (
    <li className="px-4 sm:px-5 py-3.5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
        <div className="sm:w-48 shrink-0">
          <Badge variant={actionVariant(entry.action)}>{actionLabel(entry.action)}</Badge>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 break-words">
            {entry.description || actionLabel(entry.action)}
            {entry.eventTitle && !entry.description?.includes(entry.eventTitle) && (
              <span className="text-slate-500"> · {entry.eventTitle}</span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 min-w-0">
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {actor ? (
                  <>
                    {actor}
                    {entry.actor?.name && entry.actor.email && (
                      <span className="text-slate-400"> ({entry.actor.email})</span>
                    )}
                  </>
                ) : (
                  'Convidado / anônimo'
                )}
              </span>
            </span>
            {entry.ipAddress && (
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {entry.ipAddress}
              </span>
            )}
            {hasDetails && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-0.5 font-semibold text-brand-700 hover:text-brand-800"
                aria-expanded={open}
              >
                Detalhes
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {open && hasDetails && (
            <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 overflow-x-auto">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          )}
        </div>
        <time
          dateTime={entry.createdAt}
          className="text-xs text-slate-500 sm:text-right shrink-0 tabular-nums order-first sm:order-none"
        >
          {dateTimeFormat.format(new Date(entry.createdAt))}
        </time>
      </div>
    </li>
  );
};

export const AdminAuditPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [fromDay, setFromDay] = useState('');
  const [toDay, setToDay] = useState('');

  // Wait for the user to stop typing before querying
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = {
    page,
    limit: 30,
    search,
    action,
    from: dayBoundary(fromDay, false),
    to: dayBoundary(toDay, true),
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', query],
    queryFn: () => adminService.getAuditLogs(query),
    placeholderData: keepPreviousData,
  });

  const hasFilters = Boolean(search || action || fromDay || toDay);
  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setAction('');
    setFromDay('');
    setToDay('');
    setPage(1);
  };

  const fieldClass =
    'h-10 w-full px-3 bg-slate-50 text-slate-900 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-hidden';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <AdminHeader
        title="Auditoria"
        description="Registro de tudo o que acontece na plataforma: logins, eventos, fotos e alterações de contas."
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_220px_160px_160px_auto] gap-3 items-end bg-white p-3 rounded-2xl border border-slate-200/80 mb-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Buscar</span>
          <div className="relative mt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Usuário, e-mail, evento ou descrição"
              className={`${fieldClass} pl-9`}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Ação</span>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Todas as ações</option>
            {(data?.actions ?? []).map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">De</span>
          <input
            type="date"
            value={fromDay}
            max={toDay || undefined}
            onChange={(e) => {
              setFromDay(e.target.value);
              setPage(1);
            }}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Até</span>
          <input
            type="date"
            value={toDay}
            min={fromDay || undefined}
            onChange={(e) => {
              setToDay(e.target.value);
              setPage(1);
            }}
            className={`${fieldClass} mt-1`}
          />
        </label>
        <div className="flex gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
              Limpar
            </Button>
          )}
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
      </div>

      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="px-5 py-4 animate-pulse flex gap-4">
              <div className="h-5 w-32 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-base mb-1">Não foi possível carregar a auditoria</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && !isError && data.items.length === 0 && (
        <EmptyState
          icon={<ScrollText className="w-8 h-8" />}
          title={hasFilters ? 'Nenhum registro com esses filtros' : 'Nenhum registro ainda'}
          description={
            hasFilters
              ? 'Ajuste ou limpe os filtros para ver mais registros.'
              : 'As ações feitas na plataforma aparecerão aqui.'
          }
        />
      )}

      {data && !isError && data.items.length > 0 && (
        <>
          <ul
            className={`bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 transition-opacity ${
              isFetching ? 'opacity-60' : ''
            }`}
          >
            {data.items.map((entry) => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </ul>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            itemLabel="registros"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default AdminAuditPage;
