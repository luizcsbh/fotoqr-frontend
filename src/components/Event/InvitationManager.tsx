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
      toast.success(`${res.generated} novos convites gerados com sucesso!`);
      fetchInvitations();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao emitir convites em lote.');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar este convite? Ele não poderá mais ser usado para entrar.')) return;
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

  const handleDispatchEmail = async (ids?: number[]) => {
    try {
      setDispatching(true);
      const res = await invitationService.sendEmailBatch(eventId, ids, false);
      toast.success(`Disparo de e-mails concluído: ${res.sent} enviados com sucesso.`);
      fetchInvitations();
    } catch (err: any) {
      toast.error('Falha no envio de e-mails.');
    } finally {
      setDispatching(false);
    }
  };

  const handleDispatchWhatsApp = async (ids?: number[]) => {
    try {
      setDispatching(true);
      const res = await invitationService.sendWhatsAppBatch(eventId, ids);
      toast.success(`Disparo de WhatsApp concluído: ${res.sent} enviados.`);
      fetchInvitations();
    } catch (err: any) {
      toast.error('Falha no envio de WhatsApp.');
    } finally {
      setDispatching(false);
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
    if (status === 'cancelled') return <Badge variant="error">Cancelado</Badge>;
    if (used >= max || status === 'used') return <Badge variant="success">Utilizado ({used}/{max})</Badge>;
    if (status === 'sent') return <Badge variant="info">Enviado ({used}/{max})</Badge>;
    return <Badge variant="warning">Pendente ({used}/{max})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkGenerate}
            className="flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            Gerar Convites para Todos
          </Button>
          <span className="text-xs text-slate-500">
            Total emitidos: <strong>{invitations.length}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={dispatching || invitations.length === 0}
            onClick={() => handleDispatchEmail(selectedIds.length > 0 ? selectedIds : undefined)}
            className="flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            {selectedIds.length > 0 ? `Enviar E-mail (${selectedIds.length})` : 'Disparar E-mail p/ Todos'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={dispatching || invitations.length === 0}
            onClick={() => handleDispatchWhatsApp(selectedIds.length > 0 ? selectedIds : undefined)}
            className="flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            {selectedIds.length > 0 ? `Enviar WhatsApp (${selectedIds.length})` : 'Disparar WhatsApp p/ Todos'}
          </Button>
        </div>
      </div>

      {/* Invitations Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando convites...</div>
        ) : invitations.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title="Nenhum convite emitido ainda"
            description="Cadastre convidados e clique no botão acima para gerar convites individuais com QR Code exclusivo."
            action={{
              label: 'Gerar Convites em Lote',
              onClick: handleBulkGenerate,
            }}
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
                      className="rounded text-indigo-600 focus:ring-indigo-500"
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
                        className="rounded text-indigo-600 focus:ring-indigo-500"
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <a
                        href={`/convite/${inv.tokenHash}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver Página Pública do Convite"
                        className="inline-block p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        title="Baixar Convite em PDF"
                        onClick={() => handleDownloadPdf(inv.id, inv.guestName)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        title="Reemitir Convite (Novo QR Code)"
                        onClick={() => handleReissue(inv.id)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      {inv.status !== 'cancelled' && (
                        <button
                          title="Cancelar Convite"
                          onClick={() => handleRevoke(inv.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
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

