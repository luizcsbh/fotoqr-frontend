import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import {
  QrCode,
  Send,
  Mail,
  MessageSquare,
  FileDown,
  RotateCcw,
  Ban,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../../services/invitation.service';
import { Invitation } from '../../types';

interface InvitationManagerProps {
  eventId: string | number;
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({ eventId }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<'email' | 'whatsapp' | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await invitationService.listInvitations(eventId);
      setInvitations(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar convites emitidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [eventId]);

  const handleBulkGenerate = async () => {
    try {
      const res = await invitationService.generateBulkInvitations(eventId);
      toast.success(`${res.generated} convites gerados com sucesso!`);
      fetchInvitations();
    } catch (err: any) {
      toast.error('Erro ao gerar convites em lote.');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar este convite? Ele não poderá mais ser usado para entrada.')) {
      return;
    }
    try {
      await invitationService.revokeInvitation(id);
      toast.success('Convite cancelado.');
      fetchInvitations();
    } catch (err: any) {
      toast.error('Erro ao cancelar convite.');
    }
  };

  const handleReissue = async (id: number) => {
    try {
      await invitationService.resendInvitation(id);
      toast.success('Convite reemitido com novo QR Code seguro!');
      fetchInvitations();
    } catch (err: any) {
      toast.error('Erro ao reemitir convite.');
    }
  };

  const handleDownloadPdf = async (id: number, guestName: string) => {
    try {
      await invitationService.downloadPdf(id, `convite-${guestName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('Download do PDF iniciado!');
    } catch (err: any) {
      toast.error('Erro ao baixar PDF do convite.');
    }
  };

  // Disparo para todos ou selecionados via E-mail
  const handleDispatchEmail = async (ids?: number[]) => {
    const isAll = !ids || ids.length === 0;
    const count = isAll ? invitations.length : ids.length;

    if (count === 0) {
      toast.error('Nenhum convite disponível para envio.');
      return;
    }

    if (!window.confirm(`Deseja enviar o convite por e-mail para ${isAll ? 'TODOS os convidados' : `${count} convidado(s) selecionado(s)`}?`)) {
      return;
    }

    try {
      setDispatching(true);
      setDispatchChannel('email');
      const res = await invitationService.sendEmailBatch(eventId, ids, false);
      toast.success(`Disparo de e-mails concluído: ${res.sent} enviado(s) com sucesso${res.failed > 0 ? `, ${res.failed} falha(s)` : ''}!`);
      fetchInvitations();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha no envio de e-mails.');
    } finally {
      setDispatching(false);
      setDispatchChannel(null);
    }
  };

  // Disparo para todos ou selecionados via WhatsApp
  const handleDispatchWhatsApp = async (ids?: number[]) => {
    const isAll = !ids || ids.length === 0;
    const count = isAll ? invitations.length : ids.length;

    if (count === 0) {
      toast.error('Nenhum convite disponível para envio.');
      return;
    }

    if (!window.confirm(`Deseja disparar o convite por WhatsApp para ${isAll ? 'TODOS os convidados' : `${count} convidado(s) selecionado(s)`}?`)) {
      return;
    }

    try {
      setDispatching(true);
      setDispatchChannel('whatsapp');
      const res = await invitationService.sendWhatsAppBatch(eventId, ids);
      toast.success(`Disparo de WhatsApp concluído: ${res.sent} enviado(s)${res.failed > 0 ? `, ${res.failed} falha(s)` : ''}!`);
      fetchInvitations();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha no envio de WhatsApp.');
    } finally {
      setDispatching(false);
      setDispatchChannel(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === invitations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invitations.map((i) => i.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getStatusBadge = (status: string, used: number, max: number) => {
    if (status === 'cancelled') return <Badge variant="danger">Cancelado</Badge>;
    if (used >= max || status === 'used') return <Badge variant="success">Utilizado ({used}/{max})</Badge>;
    if (status === 'sent') return <Badge variant="info">Enviado ({used}/{max})</Badge>;
    return <Badge variant="warning">Pendente ({used}/{max})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkGenerate}
            className="flex items-center gap-1.5 font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            Gerar Convites para Todos
          </Button>

          <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
            Total emitidos: <strong className="text-slate-800">{invitations.length}</strong>
            {selectedIds.length > 0 && (
              <span className="text-indigo-600 font-bold ml-1.5">
                • {selectedIds.length} selecionado(s)
              </span>
            )}
          </span>
        </div>

        {/* Action Buttons for Dispatch (Email & WhatsApp) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Disparar E-mail */}
          <Button
            size="sm"
            variant="secondary"
            disabled={dispatching || invitations.length === 0}
            isLoading={dispatching && dispatchChannel === 'email'}
            onClick={() => handleDispatchEmail(selectedIds.length > 0 ? selectedIds : undefined)}
            className="flex items-center gap-2 font-semibold shadow-xs"
          >
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {selectedIds.length > 0
                ? `Enviar E-mail (${selectedIds.length})`
                : 'Disparar E-mail para Todos'}
            </span>
          </Button>

          {/* Disparar WhatsApp */}
          <Button
            size="sm"
            variant="success"
            disabled={dispatching || invitations.length === 0}
            isLoading={dispatching && dispatchChannel === 'whatsapp'}
            onClick={() => handleDispatchWhatsApp(selectedIds.length > 0 ? selectedIds : undefined)}
            className="flex items-center gap-2 font-semibold shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-white shrink-0" />
            <span>
              {selectedIds.length > 0
                ? `Enviar WhatsApp (${selectedIds.length})`
                : 'Disparar WhatsApp para Todos'}
            </span>
          </Button>
        </div>
      </div>

      {/* Invitations Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm font-medium">Carregando convites...</div>
        ) : invitations.length === 0 ? (
          <EmptyState
            icon={<QrCode className="w-8 h-8" />}
            title="Nenhum convite emitido ainda"
            description="Cadastre convidados e clique no botão acima para gerar convites individuais com QR Code exclusivo."
            actionText="Gerar Convites em Lote"
            onAction={handleBulkGenerate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === invitations.length}
                      onChange={toggleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Selecionar todos os convites"
                    />
                  </th>
                  <th className="py-3 px-4">Convidado</th>
                  <th className="py-3 px-4">Status & Entradas</th>
                  <th className="py-3 px-4">Destino de Envio</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{inv.guestName}</p>
                      <span className="text-xs text-slate-400">Cat: {inv.guestCategory}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status, inv.usedEntries, inv.maxEntries)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {inv.guestEmail && <p>{inv.guestEmail}</p>}
                      {inv.guestPhone && <p className="text-slate-400">{inv.guestPhone}</p>}
                      {!inv.guestEmail && !inv.guestPhone && (
                        <span className="text-slate-400 italic">Sem contato cadastrado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/convite/${inv.tokenHash}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver Página Pública do Convite"
                          className="inline-flex items-center justify-center w-8 h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                        </a>
                        <button
                          type="button"
                          title="Baixar Convite em PDF"
                          onClick={() => handleDownloadPdf(inv.id, inv.guestName)}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <FileDown className="w-4 h-4 shrink-0" />
                        </button>
                        <button
                          type="button"
                          title="Reemitir Convite (Novo QR Code)"
                          onClick={() => handleReissue(inv.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 shrink-0" />
                        </button>
                        {inv.status !== 'cancelled' ? (
                          <button
                            type="button"
                            title="Cancelar Convite"
                            onClick={() => handleRevoke(inv.id)}
                            className="inline-flex items-center justify-center w-8 h-8 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Ban className="w-4 h-4 shrink-0" />
                          </button>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
