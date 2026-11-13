import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import { Alert } from '../UI/Alert';
import { useAlert } from '../../hooks/useAlert';
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
  ChevronRight,
  X,
  Phone,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../../services/invitation.service';
import { Invitation } from '../../types';

interface InvitationManagerProps {
  eventId: string | number;
  eventTitle?: string;
}

interface DeliveryConfig {
  smtpConfigured: boolean;
  smtpHost: string | null;
  smtpPort: number;
  smtpFrom: string;
  whatsappApiConfigured: boolean;
  whatsappPhoneId: string | null;
}

// Formata o número de telefone sanitizando e inserindo DDI 55 (Brasil) caso tenha 10 ou 11 dígitos
export const formatWhatsAppPhone = (rawPhone?: string | null): string => {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
};

// Gera a mensagem de convite personalizada para WhatsApp
export const generateWhatsAppInviteMessage = (guestName: string, eventTitle: string, tokenHash: string): string => {
  const origin = window.location.origin;
  const inviteUrl = `${origin}/convite/${tokenHash}`;
  return (
    `Olá, *${guestName}*! 🎉\n\n` +
    `Aqui está o seu convite oficial para *${eventTitle}*.\n\n` +
    `Acesse o seu convite e seu QR Code exclusivo de entrada pelo link abaixo:\n` +
    `${inviteUrl}\n\n` +
    `📱 _Apresente o QR Code na tela do seu celular no momento do check-in na portaria._\n` +
    `Esperamos por você!`
  );
};

export const InvitationManager: React.FC<InvitationManagerProps> = ({ eventId, eventTitle = 'Evento Especial' }) => {
  const { showAlert, showConfirm } = useAlert();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<'email' | 'whatsapp' | null>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig | null>(null);

  // Modal do Assistente de Disparo WhatsApp Web
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [waQueueIndex, setWaQueueIndex] = useState(0);

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

  const fetchConfig = async () => {
    try {
      const config = await invitationService.getDeliveryConfig(eventId);
      setDeliveryConfig(config);
    } catch (err) {
      // Ignora erro em caso de backend em desenvolvimento
    }
  };

  useEffect(() => {
    fetchInvitations();
    fetchConfig();
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
    const confirmed = await showConfirm({
      title: 'Cancelar Convite',
      message: 'Tem certeza que deseja cancelar este convite? Ele não poderá mais ser usado para entrada na portaria.',
      variant: 'danger',
      confirmText: 'Sim, cancelar',
      cancelText: 'Voltar',
    });
    if (!confirmed) return;

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

  // Envio Direto Real via WhatsApp para Convidado Individual
  const handleDirectWhatsApp = async (inv: Invitation) => {
    if (!inv.guestPhone) {
      toast.error('Este convidado não possui telefone cadastrado.');
      return;
    }
    const cleanPhone = formatWhatsAppPhone(inv.guestPhone);
    if (!cleanPhone) {
      toast.error('Número de telefone inválido.');
      return;
    }

    const message = generateWhatsAppInviteMessage(inv.guestName, eventTitle, inv.tokenHash);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    // Abre o WhatsApp Web / App diretamente com o texto pré-carregado
    window.open(waUrl, '_blank');

    // Registra a entrega real no backend e atualiza status
    try {
      await invitationService.markInvitationSent(inv.id, 'whatsapp', inv.guestPhone);
      setInvitations((prev) =>
        prev.map((item) => (item.id === inv.id ? { ...item, status: 'sent' } : item))
      );
      toast.success(`WhatsApp aberto para ${inv.guestName}! Status atualizado para Enviado.`);
    } catch (err) {
      console.error('Erro ao marcar status:', err);
    }
  };

  // Envio Direto Real por E-mail para Convidado Individual
  const handleDirectEmail = async (inv: Invitation) => {
    if (!inv.guestEmail) {
      toast.error('Este convidado não possui e-mail cadastrado.');
      return;
    }

    if (deliveryConfig?.smtpConfigured) {
      // Disparo real via servidor SMTP configurado
      try {
        toast.loading(`Enviando e-mail para ${inv.guestEmail}...`, { id: `email-${inv.id}` });
        const res = await invitationService.sendEmailBatch(eventId, [inv.id], false);
        if (res.sent > 0) {
          toast.success(`E-mail enviado com sucesso para ${inv.guestEmail}!`, { id: `email-${inv.id}` });
          setInvitations((prev) =>
            prev.map((item) => (item.id === inv.id ? { ...item, status: 'sent' } : item))
          );
        } else {
          toast.error(`Falha no envio de e-mail. Verifique a configuração SMTP.`, { id: `email-${inv.id}` });
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Erro ao enviar e-mail via servidor.', { id: `email-${inv.id}` });
      }
    } else {
      // Fallback para cliente de e-mail local (mailto) com link direto real
      const origin = window.location.origin;
      const inviteUrl = `${origin}/convite/${inv.tokenHash}`;
      const subject = `Seu Convite Oficial: ${eventTitle}`;
      const body = `Olá, ${inv.guestName}!\n\nVocê recebeu seu convite oficial para ${eventTitle}.\n\nAcesse seu convite com QR Code de entrada pelo link abaixo:\n${inviteUrl}\n\nApresente na tela do celular no dia do evento!`;
      const mailtoUrl = `mailto:${inv.guestEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.open(mailtoUrl, '_blank');

      try {
        await invitationService.markInvitationSent(inv.id, 'email', inv.guestEmail);
        setInvitations((prev) =>
          prev.map((item) => (item.id === inv.id ? { ...item, status: 'sent' } : item))
        );
        toast.success(`Cliente de e-mail aberto para ${inv.guestEmail}! Status atualizado.`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Disparo para todos ou selecionados via E-mail
  const handleDispatchEmail = async (ids?: number[]) => {
    const isAll = !ids || ids.length === 0;
    const targetInvs = isAll ? invitations : invitations.filter((i) => ids.includes(i.id));
    const count = targetInvs.length;

    if (count === 0) {
      toast.error('Nenhum convite disponível para envio.');
      return;
    }

    if (!deliveryConfig?.smtpConfigured) {
      await showAlert({
        title: 'Servidor SMTP não configurado',
        message:
          'Para disparo automático em massa pelo servidor, adicione as credenciais SMTP no arquivo .env:\n\n' +
          '• SMTP_HOST\n• SMTP_PORT\n• SMTP_USER\n• SMTP_PASS\n\n' +
          'Você também pode enviar individualmente pelo seu cliente de e-mail clicando no ícone de envelope ao lado de cada convidado.',
        variant: 'warning',
        confirmText: 'Entendi',
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Disparo de Convites por E-mail',
      message: `Deseja enviar o convite por e-mail para ${isAll ? 'TODOS os convidados' : `${count} convidado(s) selecionado(s)`}?`,
      variant: 'info',
      confirmText: 'Iniciar Disparo',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

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
    const targetInvs = isAll ? invitations : invitations.filter((i) => ids.includes(i.id));
    const invsWithPhone = targetInvs.filter((i) => Boolean(i.guestPhone));

    if (invsWithPhone.length === 0) {
      toast.error('Nenhum dos convidados selecionados possui telefone cadastrado.');
      return;
    }

    // Se o backend tem a API Cloud oficial configurada
    if (deliveryConfig?.whatsappApiConfigured) {
      const confirmed = await showConfirm({
        title: 'Disparo via WhatsApp Cloud API',
        message: `Deseja disparar convites via WhatsApp Cloud API para ${invsWithPhone.length} convidado(s)?`,
        variant: 'info',
        confirmText: 'Iniciar Disparo',
        cancelText: 'Cancelar',
      });
      if (confirmed) {
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
        return;
      }
    }

    // Se não há API Cloud configurada (ou o organizador prefere enviar pelo seu WhatsApp Web/App direto):
    // Abre o assistente de disparo sequencial
    setWaQueueIndex(0);
    setIsWhatsAppModalOpen(true);
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

  // Lista de convites selecionados ou todos que possuem telefone para o assistente WhatsApp
  const waQueueList = (selectedIds.length > 0
    ? invitations.filter((i) => selectedIds.includes(i.id))
    : invitations
  ).filter((i) => Boolean(i.guestPhone));

  const currentWaGuest = waQueueList[waQueueIndex];

  return (
    <div className="space-y-6">
      {/* Alerta de Status do Servidor de E-mail (SMTP) */}
      {deliveryConfig && !deliveryConfig.smtpConfigured && (
        <Alert
          variant="warning"
          title="Servidor de E-mails (SMTP) não configurado"
          dismissible
        >
          Para realizar disparos automáticos em lote pelo servidor, adicione as credenciais SMTP no arquivo{' '}
          <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-xs">.env</code> do backend (Brevo, Gmail ou provedor SMTP). O envio manual direto via cliente de e-mail e o envio por WhatsApp continuam disponíveis normalmente.
        </Alert>
      )}

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
                        {/* 1. Enviar Real via WhatsApp */}
                        <button
                          type="button"
                          title={
                            inv.guestPhone
                              ? `Enviar Convite Real via WhatsApp (${inv.guestPhone})`
                              : 'Convidado sem telefone cadastrado'
                          }
                          disabled={!inv.guestPhone}
                          onClick={() => handleDirectWhatsApp(inv)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            inv.guestPhone
                              ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                        </button>

                        {/* 2. Enviar Real por E-mail */}
                        <button
                          type="button"
                          title={
                            inv.guestEmail
                              ? `Enviar Convite Real por E-mail (${inv.guestEmail})`
                              : 'Convidado sem e-mail cadastrado'
                          }
                          disabled={!inv.guestEmail}
                          onClick={() => handleDirectEmail(inv)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            inv.guestEmail
                              ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                        </button>

                        {/* 3. Ver Página Pública do Convite */}
                        <a
                          href={`/convite/${inv.tokenHash}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver Página Pública do Convite"
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                        </a>

                        {/* 4. Baixar Convite em PDF */}
                        <button
                          type="button"
                          title="Baixar Convite em PDF"
                          onClick={() => handleDownloadPdf(inv.id, inv.guestName)}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <FileDown className="w-4 h-4 shrink-0" />
                        </button>

                        {/* 5. Reemitir Convite */}
                        <button
                          type="button"
                          title="Reemitir Convite (Novo QR Code)"
                          onClick={() => handleReissue(inv.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 shrink-0" />
                        </button>

                        {/* 6. Cancelar Convite */}
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

      {/* Modal Assistente de Disparo WhatsApp Web */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Assistente de Disparo WhatsApp</h3>
                  <p className="text-xs text-slate-500">
                    Envio direto e real através do WhatsApp Web ou App
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-5">
              {waQueueList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhum convidado com número de telefone disponível na fila.
                </div>
              ) : currentWaGuest ? (
                <>
                  {/* Barra de Progresso */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
                      <span>Progresso da Fila</span>
                      <span className="text-emerald-700">
                        {waQueueIndex + 1} de {waQueueList.length}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${((waQueueIndex + 1) / waQueueList.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Card do Convidado em Foco */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Destinatário Atual
                        </span>
                        <h4 className="text-lg font-bold text-slate-800 mt-1">{currentWaGuest.guestName}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          {currentWaGuest.guestPhone}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(currentWaGuest.status, currentWaGuest.usedEntries, currentWaGuest.maxEntries)}
                      </div>
                    </div>

                    {/* Pré-visualização da Mensagem */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {generateWhatsAppInviteMessage(currentWaGuest.guestName, eventTitle, currentWaGuest.tokenHash)}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Button
                      variant="success"
                      onClick={async () => {
                        await handleDirectWhatsApp(currentWaGuest);
                        if (waQueueIndex + 1 < waQueueList.length) {
                          setWaQueueIndex(waQueueIndex + 1);
                        } else {
                          toast.success('Todos os convidados da fila foram processados!');
                          setIsWhatsAppModalOpen(false);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5"
                    >
                      <MessageSquare className="w-4 h-4 text-white" />
                      <span>Abrir no WhatsApp e Avançar</span>
                    </Button>

                    {waQueueIndex + 1 < waQueueList.length ? (
                      <Button
                        variant="outline"
                        onClick={() => setWaQueueIndex(waQueueIndex + 1)}
                        className="text-slate-600"
                      >
                        Pular Convidado
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsWhatsAppModalOpen(false)}
                        className="text-slate-600"
                      >
                        Concluir Fila
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-base font-bold text-slate-800">Fila Finalizada!</h4>
                  <p className="text-xs text-slate-500 mt-1">Todos os convites selecionados foram enviados via WhatsApp.</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsWhatsAppModalOpen(false)}
                    className="mt-4"
                  >
                    Fechar Assistente
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
